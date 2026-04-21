import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service";
import { getCurrentEmployee } from "@/lib/auth/current-employee";
import {
  authErrorToResponse,
  errorResponse,
  zodErrorToResponse,
} from "@/lib/kudos/api-responses";
import { highlightKudosParamsSchema } from "@/lib/validations/live-board";
import { serializeKudo } from "@/lib/kudos/serialize-kudo";
import { KUDO_IMAGES_BUCKET } from "@/lib/constants/kudos";
import type {
  EmployeeRow,
  HashtagRow,
  KudoRow,
  PublicKudo,
  TitleRow,
  UploadRow,
} from "@/types/kudos";

const SIGNED_URL_TTL_SECONDS = 60 * 60;
const HIGHLIGHT_LIMIT = 5;

/**
 * GET /api/kudos/highlight — top-5 published Kudos of the current filter
 * combination, ranked by heart count (Figma B.3 Highlight carousel).
 *
 * Plan § T053 + user refactor 2026-04-21:
 *   Single combined PostgREST query — INNER JOIN on `kudo_hearts` for the
 *   ranking (0-heart Kudos are excluded by design) + LEFT JOIN embeds for
 *   every relation (author, recipient, title, hashtags, images, mentions)
 *   so the whole ranked page is assembled in one round-trip. Caller's
 *   like-set stays as a tiny second query because it needs a WHERE on the
 *   `employee_id` (same table as the aggregate, conflicts otherwise).
 */
export async function GET(request: Request) {
  const supabase = await createClient();

  let caller: EmployeeRow;
  try {
    caller = await getCurrentEmployee(supabase);
  } catch (err) {
    const res = authErrorToResponse(err);
    if (res) return res;
    console.error("GET /api/kudos/highlight identity error", err);
    return errorResponse("INTERNAL_ERROR", "Unexpected error", 500);
  }

  const url = new URL(request.url);
  const parsed = highlightKudosParamsSchema.safeParse({
    hashtagId: url.searchParams.get("hashtagId") ?? undefined,
    departmentId: url.searchParams.get("departmentId") ?? undefined,
  });
  if (!parsed.success) return zodErrorToResponse(parsed.error);
  const { hashtagId, departmentId } = parsed.data;

  // ---------------------------------------------------------------------------
  // 1. Pre-filter sets for hashtag / department — identical to fetch-kudos-page.
  // ---------------------------------------------------------------------------
  const [hashtagFilter, departmentFilter] = await Promise.all([
    hashtagId
      ? supabase
          .from("kudo_hashtags")
          .select("kudo_id")
          .eq("hashtag_id", hashtagId)
      : Promise.resolve({ data: null, error: null }),
    departmentId
      ? supabase
          .from("employees")
          .select("id")
          .eq("department_id", departmentId)
          .is("deleted_at", null)
      : Promise.resolve({ data: null, error: null }),
  ]);

  if (hashtagFilter.error) {
    console.error("highlight hashtag filter error", hashtagFilter.error);
    return errorResponse("INTERNAL_ERROR", "Could not load highlight", 500);
  }
  if (departmentFilter.error) {
    console.error("highlight dept filter error", departmentFilter.error);
    return errorResponse("INTERNAL_ERROR", "Could not load highlight", 500);
  }

  const hashtagKudoIds = hashtagFilter.data
    ? (hashtagFilter.data as Array<{ kudo_id: number }>).map((r) => r.kudo_id)
    : null;
  const departmentRecipientIds = departmentFilter.data
    ? (departmentFilter.data as Array<{ id: number }>).map((r) => r.id)
    : null;

  if (
    (hashtagKudoIds !== null && hashtagKudoIds.length === 0) ||
    (departmentRecipientIds !== null && departmentRecipientIds.length === 0)
  ) {
    return NextResponse.json({ data: [] });
  }

  // ---------------------------------------------------------------------------
  // 2. Top-5 ranked kudos + every relation in ONE embedded query.
  //
  //    The view `kudos_with_heart_count` (see
  //    supabase/migrations/202604220900_kudos_with_heart_count_view.sql)
  //    exposes `heart_count` as a plain column — aggregation happens INSIDE
  //    Postgres, not via PostgREST's `count()` aggregate (which Supabase
  //    disables by default via `db-aggregates-enabled=false`). The view
  //    inherits every FK relationship from the underlying `kudos` table so
  //    nested embeds (`author:employees!author_id(…)`, `kudo_hashtags(…)`,
  //    etc.) resolve the same as a regular `.from("kudos")` query.
  //
  //    0-heart kudos are excluded via `.gt("heart_count", 0)` — previously
  //    enforced by the `kudo_hearts!inner` INNER JOIN.
  //
  //    Every embed is a LEFT JOIN (array-valued ⇒ empty array when the
  //    relation has no rows). FK hints `!author_id` / `!recipient_id`
  //    disambiguate the two FK paths from `kudos` to `employees`.
  // ---------------------------------------------------------------------------
  const embeddedSelect = `
    id, author_id, recipient_id, title_id, body, body_plain,
    is_anonymous, anonymous_alias, status, created_at, updated_at, deleted_at,
    heart_count,
    author:employees!author_id(
      id, email, full_name, employee_code, department, department_id,
      job_title, avatar_url, is_admin, deleted_at
    ),
    recipient:employees!recipient_id(
      id, email, full_name, employee_code, department, department_id,
      job_title, avatar_url, is_admin, deleted_at
    ),
    title:titles(
      id, name, slug, description, icon, sort_order, created_by, deleted_at
    ),
    kudo_hashtags(
      hashtag:hashtags(
        id, label, slug, usage_count, created_by, deleted_at
      )
    ),
    kudo_images(
      position,
      upload:uploads(
        id, owner_id, storage_key, mime_type, byte_size, width, height, deleted_at
      )
    ),
    kudo_mentions(
      employee:employees(
        id, email, full_name, employee_code, department, department_id,
        job_title, avatar_url, is_admin, deleted_at
      )
    )
  `;

  let topQuery = supabase
    .from("kudos_with_heart_count")
    .select(embeddedSelect)
    .eq("status", "published")
    .is("deleted_at", null)
    .gt("heart_count", 0);

  if (hashtagKudoIds !== null) topQuery = topQuery.in("id", hashtagKudoIds);
  if (departmentRecipientIds !== null)
    topQuery = topQuery.in("recipient_id", departmentRecipientIds);

  topQuery = topQuery
    .order("heart_count", { ascending: false })
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .order("position", { referencedTable: "kudo_images", ascending: true })
    .limit(HIGHLIGHT_LIMIT);

  const { data: topRaw, error: topError } = await topQuery;
  if (topError) {
    console.error("highlight top query error", topError);
    return errorResponse("INTERNAL_ERROR", "Could not load highlight", 500);
  }

  interface EmbeddedHighlightRow extends KudoRow {
    /** Pre-computed in the `kudos_with_heart_count` view. */
    heart_count: number;
    author: EmployeeRow | null;
    recipient: EmployeeRow | null;
    title: TitleRow | null;
    kudo_hashtags: Array<{ hashtag: HashtagRow | null }> | null;
    kudo_images: Array<{
      position: number;
      upload: UploadRow | null;
    }> | null;
    kudo_mentions: Array<{ employee: EmployeeRow | null }> | null;
  }

  const topRows = (topRaw ?? []) as unknown as EmbeddedHighlightRow[];
  if (topRows.length === 0) {
    return NextResponse.json({ data: [] });
  }

  const topIds = topRows.map((r) => r.id);

  // ---------------------------------------------------------------------------
  // 3. Caller's liked-set — small follow-up query. Embedding it on the
  //    same `kudo_hearts` relation clashes with the INNER JOIN aggregate,
  //    so one extra round-trip is cleaner than the workarounds.
  // ---------------------------------------------------------------------------
  const { data: likedRaw, error: likedError } = await supabase
    .from("kudo_hearts")
    .select("kudo_id")
    .in("kudo_id", topIds)
    .eq("employee_id", caller.id);
  if (likedError) {
    console.error("highlight liked query error", likedError);
    return errorResponse("INTERNAL_ERROR", "Could not load highlight", 500);
  }
  const likedSet = new Set<number>(
    (likedRaw ?? []).map((r) => r.kudo_id as number),
  );

  // ---------------------------------------------------------------------------
  // 3b. Resolve department codes for every employee that has a `department_id`.
  //     Feeds `serializeKudo`'s `departmentCodeById` so sender/recipient
  //     subtitles expose the canonical code.
  // ---------------------------------------------------------------------------
  const departmentIds = new Set<number>();
  for (const row of topRows) {
    if (row.author?.department_id != null)
      departmentIds.add(row.author.department_id);
    if (row.recipient?.department_id != null)
      departmentIds.add(row.recipient.department_id);
    for (const m of row.kudo_mentions ?? []) {
      if (m.employee?.department_id != null)
        departmentIds.add(m.employee.department_id);
    }
  }
  const departmentCodeById = new Map<number, string>();
  if (departmentIds.size > 0) {
    const { data: deptRows, error: deptError } = await supabase
      .from("departments")
      .select("id, code")
      .in("id", Array.from(departmentIds));
    if (deptError) {
      console.error("highlight departments error", deptError);
      return errorResponse("INTERNAL_ERROR", "Could not load highlight", 500);
    }
    for (const d of (deptRows ?? []) as Array<{ id: number; code: string }>) {
      departmentCodeById.set(d.id, d.code);
    }
  }

  // ---------------------------------------------------------------------------
  // 4. Storage signed URLs for any embedded images — parallel.
  //    Uses the **service-role** storage client: `createSignedUrl` requires
  //    SELECT on `storage.objects` for the private `kudo-images` bucket,
  //    which the anon / authenticated roles do not have. Using the user
  //    client silently returned null URLs, so the serialize loop dropped
  //    every image. Matches the upload route's approach at
  //    `app/api/uploads/route.ts:80`.
  // ---------------------------------------------------------------------------
  const uploadsById = new Map<number, UploadRow>();
  for (const row of topRows) {
    for (const j of row.kudo_images ?? []) {
      if (j.upload) uploadsById.set(j.upload.id, j.upload);
    }
  }
  const signedUrlByUpload = new Map<number, string>();
  if (uploadsById.size > 0) {
    const storage = createServiceRoleClient().storage;
    const signed = await Promise.all(
      Array.from(uploadsById.values()).map(async (u) => {
        const { data, error } = await storage
          .from(KUDO_IMAGES_BUCKET)
          .createSignedUrl(u.storage_key, SIGNED_URL_TTL_SECONDS);
        if (error) {
          console.error("highlight createSignedUrl error", u.id, error);
        }
        return { id: u.id, url: data?.signedUrl ?? null };
      }),
    );
    for (const s of signed) {
      if (s.url) signedUrlByUpload.set(s.id, s.url);
    }
  }

  // ---------------------------------------------------------------------------
  // 5. Serialise each row using the embedded relations.
  // ---------------------------------------------------------------------------
  const items: PublicKudo[] = [];
  for (const row of topRows) {
    if (!row.title) continue; // Broken title FK — skip defensively.

    const employeesById = new Map<number, EmployeeRow>();
    if (row.author) employeesById.set(row.author.id, row.author);
    if (row.recipient) employeesById.set(row.recipient.id, row.recipient);
    for (const m of row.kudo_mentions ?? []) {
      if (m.employee) employeesById.set(m.employee.id, m.employee);
    }
    const mentionIds = (row.kudo_mentions ?? [])
      .map((m) => m.employee?.id)
      .filter((id): id is number => typeof id === "number");

    const kudoHashtags: HashtagRow[] = [];
    for (const h of row.kudo_hashtags ?? []) {
      if (h.hashtag) kudoHashtags.push(h.hashtag);
    }

    const imagesOut: PublicKudo["images"] = [];
    for (const j of row.kudo_images ?? []) {
      if (!j.upload) continue;
      const url = signedUrlByUpload.get(j.upload.id);
      if (!url) continue;
      imagesOut.push({
        id: j.upload.id,
        url,
        mimeType: j.upload.mime_type,
        byteSize: j.upload.byte_size,
        width: j.upload.width,
        height: j.upload.height,
        expiresAt: new Date(
          Date.now() + SIGNED_URL_TTL_SECONDS * 1000,
        ).toISOString(),
      });
    }

    items.push(
      serializeKudo(row, {
        employeesById,
        title: row.title,
        hashtags: kudoHashtags,
        images: imagesOut,
        mentionEmployeeIds: mentionIds,
        departmentCodeById,
        heartContext: {
          callerEmployeeId: caller.id,
          heartCount: row.heart_count ?? 0,
          likedKudoIds: likedSet,
        },
      }),
    );
  }

  return NextResponse.json({ data: items });
}
