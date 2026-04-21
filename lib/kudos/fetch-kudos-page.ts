import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { encodeCursor } from "@/lib/kudos/cursor";
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

/**
 * Shared server-side helper that loads a page of published Kudos + every
 * relation the `PublicKudo` payload needs, **in constant round-trips**.
 *
 * Design goals (plan § Performance / Optimisation pass 2026-04-21):
 *
 *   - **No N+1.** Instead of 5–6 sequential Supabase queries per kudo, we
 *     fetch 1 batched query per relation for the whole page:
 *       1  `kudos`                 — paginated list
 *       2  `kudo_mentions`         — IN kudoIds
 *       3  `kudo_hashtags`         — IN kudoIds
 *       4  `kudo_images`           — IN kudoIds
 *       5  `kudo_hearts` (count)   — IN kudoIds
 *       6  `kudo_hearts` (liked)   — IN kudoIds AND caller
 *       7  `employees`             — IN (authors + recipients + mentions)
 *       8  `titles`                — IN uniqueTitleIds
 *       9  `hashtags`              — IN uniqueHashtagIds
 *      10  `uploads`               — IN uniqueUploadIds
 *     A page of 10 kudos was taking ≥ 50 DB round-trips; this caps at ≤ 10.
 *
 *   - **No self-fetch.** The Server Component can call this directly with
 *     its server-side Supabase client, instead of issuing an HTTP request
 *     to its own Route Handler (which has to re-authenticate, re-parse,
 *     re-query). The `GET /api/kudos` handler also calls the same helper —
 *     one code path, same semantics.
 *
 *   - **Batched storage signing.** Every signed-URL request still costs a
 *     network hop (Supabase Storage API), but they all run in parallel via
 *     `Promise.all`. Pages without images don't pay the cost at all.
 *
 * Serialisation is delegated to `serializeKudo()` — this helper only does
 * I/O + data shaping.
 */

const SIGNED_URL_TTL_SECONDS = 60 * 60; // 1h (TR-008)

export interface FetchKudosPageParams {
  /** Caller's employees.id — drives `canHeart` + liked-set filter. */
  callerEmployeeId: number;
  /** Page size. Live board: 10; Viết Kudo feed: 20. */
  limit: number;
  /**
   * Cursor pagination (Live board). When present, offset mode is ignored.
   * Decoded tuple `(createdAt, id)` — consumers should pass the decoded
   * shape from `lib/kudos/cursor.ts` (the handler / Server Component are
   * responsible for decoding before calling us).
   */
  cursor?: { createdAt: string; id: number };
  /** Offset pagination page number (default 1). */
  page?: number;
  /** Filter to a single Danh hiệu. */
  titleId?: number;
  /** Filter to a single hashtag. */
  hashtagId?: number;
  /** Filter to recipients in a single department. */
  departmentId?: number;
}

export type FetchKudosPageResult =
  | {
      ok: true;
      items: PublicKudo[];
      /** Offset-mode total count; null in cursor mode. */
      total: number | null;
      /** Cursor-mode next cursor; null if pagination exhausted or offset mode. */
      nextCursor: string | null;
    }
  | {
      ok: false;
      /** Machine-readable reason — consumers map to HTTP status. */
      reason: "DB_ERROR";
      message: string;
    };

export async function fetchKudosPage(
  supabase: SupabaseClient,
  params: FetchKudosPageParams,
): Promise<FetchKudosPageResult> {
  const {
    callerEmployeeId,
    limit,
    cursor,
    page = 1,
    titleId,
    hashtagId,
    departmentId,
  } = params;

  const usingCursor = cursor !== undefined;

  // ---------------------------------------------------------------------------
  // 1. Pre-filter sets (hashtag → kudo_ids, department → recipient_ids).
  //    Done in parallel when both are present.
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
    return { ok: false, reason: "DB_ERROR", message: hashtagFilter.error.message };
  }
  if (departmentFilter.error) {
    return {
      ok: false,
      reason: "DB_ERROR",
      message: departmentFilter.error.message,
    };
  }

  const hashtagKudoIds = hashtagFilter.data
    ? (hashtagFilter.data as Array<{ kudo_id: number }>).map((r) => r.kudo_id)
    : null;
  const departmentRecipientIds = departmentFilter.data
    ? (departmentFilter.data as Array<{ id: number }>).map((r) => r.id)
    : null;

  // Short-circuit: empty pre-filter → empty page.
  if (
    (hashtagKudoIds !== null && hashtagKudoIds.length === 0) ||
    (departmentRecipientIds !== null && departmentRecipientIds.length === 0)
  ) {
    return {
      ok: true,
      items: [],
      total: usingCursor ? null : 0,
      nextCursor: usingCursor ? null : null,
    };
  }

  // ---------------------------------------------------------------------------
  // 2. Main `kudos` query.
  // ---------------------------------------------------------------------------
  let q = supabase
    .from("kudos")
    .select(
      "id, author_id, recipient_id, title_id, body, body_plain, is_anonymous, anonymous_alias, status, created_at, updated_at, deleted_at",
      usingCursor ? undefined : { count: "exact" },
    )
    .eq("status", "published")
    .is("deleted_at", null);

  if (titleId) q = q.eq("title_id", titleId);
  if (hashtagKudoIds !== null) q = q.in("id", hashtagKudoIds);
  if (departmentRecipientIds !== null)
    q = q.in("recipient_id", departmentRecipientIds);

  if (usingCursor) {
    // Composite tuple: (created_at < X) OR (created_at = X AND id < Y)
    const or = [
      `created_at.lt.${cursor!.createdAt}`,
      `and(created_at.eq.${cursor!.createdAt},id.lt.${cursor!.id})`,
    ].join(",");
    q = q.or(or);
  }

  q = q
    .order("created_at", { ascending: false })
    .order("id", { ascending: false });

  if (usingCursor) {
    q = q.limit(limit);
  } else {
    const offset = (page - 1) * limit;
    q = q.range(offset, offset + limit - 1);
  }

  const { data: kudoRows, error: kudosError, count } = await q;
  if (kudosError) {
    return { ok: false, reason: "DB_ERROR", message: kudosError.message };
  }
  const rows = (kudoRows ?? []) as KudoRow[];

  if (rows.length === 0) {
    return {
      ok: true,
      items: [],
      total: usingCursor ? null : (count ?? 0),
      nextCursor: null,
    };
  }

  const kudoIds = rows.map((r) => r.id);

  // ---------------------------------------------------------------------------
  // 3. Fan out every relation in parallel. 6 queries total, regardless of
  //    page size — THIS is the big win vs. the old per-row serialiser.
  // ---------------------------------------------------------------------------
  const [
    mentionRes,
    hashtagJoinRes,
    imageJoinRes,
    heartCountRes,
    likedRes,
  ] = await Promise.all([
    supabase.from("kudo_mentions").select("kudo_id, employee_id").in("kudo_id", kudoIds),
    supabase.from("kudo_hashtags").select("kudo_id, hashtag_id").in("kudo_id", kudoIds),
    supabase
      .from("kudo_images")
      .select("kudo_id, upload_id, position")
      .in("kudo_id", kudoIds)
      .order("position", { ascending: true }),
    supabase.from("kudo_hearts").select("kudo_id").in("kudo_id", kudoIds),
    supabase
      .from("kudo_hearts")
      .select("kudo_id")
      .in("kudo_id", kudoIds)
      .eq("employee_id", callerEmployeeId),
  ]);

  for (const r of [mentionRes, hashtagJoinRes, imageJoinRes, heartCountRes, likedRes]) {
    if (r.error) return { ok: false, reason: "DB_ERROR", message: r.error.message };
  }

  const mentionRows = (mentionRes.data ?? []) as Array<{
    kudo_id: number;
    employee_id: number;
  }>;
  const hashtagJoinRows = (hashtagJoinRes.data ?? []) as Array<{
    kudo_id: number;
    hashtag_id: number;
  }>;
  const imageJoinRows = (imageJoinRes.data ?? []) as Array<{
    kudo_id: number;
    upload_id: number;
    position: number;
  }>;
  const heartCountRows = (heartCountRes.data ?? []) as Array<{ kudo_id: number }>;
  const likedRows = (likedRes.data ?? []) as Array<{ kudo_id: number }>;

  // Derive union sets for the next fan-out.
  const mentionIdsByKudo = new Map<number, number[]>();
  for (const m of mentionRows) {
    const list = mentionIdsByKudo.get(m.kudo_id) ?? [];
    list.push(m.employee_id);
    mentionIdsByKudo.set(m.kudo_id, list);
  }
  const hashtagIdsByKudo = new Map<number, number[]>();
  for (const h of hashtagJoinRows) {
    const list = hashtagIdsByKudo.get(h.kudo_id) ?? [];
    list.push(h.hashtag_id);
    hashtagIdsByKudo.set(h.kudo_id, list);
  }
  const imageJoinsByKudo = new Map<
    number,
    Array<{ upload_id: number; position: number }>
  >();
  for (const im of imageJoinRows) {
    const list = imageJoinsByKudo.get(im.kudo_id) ?? [];
    list.push({ upload_id: im.upload_id, position: im.position });
    imageJoinsByKudo.set(im.kudo_id, list);
  }
  const heartCountByKudo = new Map<number, number>();
  for (const h of heartCountRows) {
    heartCountByKudo.set(h.kudo_id, (heartCountByKudo.get(h.kudo_id) ?? 0) + 1);
  }
  const likedSet = new Set<number>(likedRows.map((r) => r.kudo_id));

  const employeeIds = new Set<number>();
  for (const row of rows) {
    employeeIds.add(row.author_id);
    employeeIds.add(row.recipient_id);
  }
  for (const m of mentionRows) employeeIds.add(m.employee_id);

  const titleIds = new Set<number>(rows.map((r) => r.title_id));
  const hashtagIds = new Set<number>(hashtagJoinRows.map((r) => r.hashtag_id));
  const uploadIds = new Set<number>(imageJoinRows.map((r) => r.upload_id));

  // ---------------------------------------------------------------------------
  // 4. Batch-load employees / titles / hashtags / uploads — 4 more queries.
  // ---------------------------------------------------------------------------
  const [employeesRes, titlesRes, hashtagsRes, uploadsRes] = await Promise.all([
    employeeIds.size > 0
      ? supabase
          .from("employees")
          .select(
            "id, email, full_name, employee_code, department, department_id, job_title, avatar_url, is_admin, deleted_at",
          )
          .in("id", Array.from(employeeIds))
      : Promise.resolve({ data: [], error: null }),
    titleIds.size > 0
      ? supabase
          .from("titles")
          .select("id, name, slug, description, icon, sort_order, created_by, deleted_at")
          .in("id", Array.from(titleIds))
      : Promise.resolve({ data: [], error: null }),
    hashtagIds.size > 0
      ? supabase
          .from("hashtags")
          .select("id, label, slug, usage_count, created_by, deleted_at")
          .in("id", Array.from(hashtagIds))
      : Promise.resolve({ data: [], error: null }),
    uploadIds.size > 0
      ? supabase
          .from("uploads")
          .select("id, owner_id, storage_key, mime_type, byte_size, width, height, deleted_at")
          .in("id", Array.from(uploadIds))
      : Promise.resolve({ data: [], error: null }),
  ]);

  for (const r of [employeesRes, titlesRes, hashtagsRes, uploadsRes]) {
    if (r.error) return { ok: false, reason: "DB_ERROR", message: r.error.message };
  }

  const employeesById = new Map<number, EmployeeRow>();
  for (const e of (employeesRes.data ?? []) as EmployeeRow[]) {
    employeesById.set(e.id, e);
  }
  const titlesById = new Map<number, TitleRow>();
  for (const t of (titlesRes.data ?? []) as TitleRow[]) {
    titlesById.set(t.id, t);
  }
  const hashtagsById = new Map<number, HashtagRow>();
  for (const h of (hashtagsRes.data ?? []) as HashtagRow[]) {
    hashtagsById.set(h.id, h);
  }
  const uploadsById = new Map<number, UploadRow>();
  for (const u of (uploadsRes.data ?? []) as UploadRow[]) {
    uploadsById.set(u.id, u);
  }

  // Resolve department codes for every employee that has a `department_id`
  // — feeds `serializeKudo`'s `departmentCodeById` so sender/recipient/
  // mention rows expose `department` as the canonical code.
  const departmentIds = new Set<number>();
  for (const e of employeesById.values()) {
    if (e.department_id != null) departmentIds.add(e.department_id);
  }
  const departmentCodeById = new Map<number, string>();
  if (departmentIds.size > 0) {
    const { data: deptRows, error: deptError } = await supabase
      .from("departments")
      .select("id, code")
      .in("id", Array.from(departmentIds));
    if (deptError) {
      return { ok: false, reason: "DB_ERROR", message: deptError.message };
    }
    for (const d of (deptRows ?? []) as Array<{ id: number; code: string }>) {
      departmentCodeById.set(d.id, d.code);
    }
  }

  // ---------------------------------------------------------------------------
  // 5. Storage signed URLs — one request per upload, fanned out in parallel.
  //    Cheap for pages with 0–5 images; totally skipped when the whole page
  //    has no attachments.
  // ---------------------------------------------------------------------------
  const signedUrlByUpload = new Map<number, string>();
  if (uploadIds.size > 0) {
    const signed = await Promise.all(
      Array.from(uploadsById.values()).map(async (u) => {
        const { data } = await supabase.storage
          .from(KUDO_IMAGES_BUCKET)
          .createSignedUrl(u.storage_key, SIGNED_URL_TTL_SECONDS);
        return { id: u.id, url: data?.signedUrl ?? null };
      }),
    );
    for (const s of signed) {
      if (s.url) signedUrlByUpload.set(s.id, s.url);
    }
  }

  // ---------------------------------------------------------------------------
  // 6. Serialise each row using the batched caches.
  // ---------------------------------------------------------------------------
  const items: PublicKudo[] = [];
  for (const row of rows) {
    const title = titlesById.get(row.title_id);
    if (!title) continue; // Skip rows with a broken title FK; log instead in future.

    const kudoHashtagIds = hashtagIdsByKudo.get(row.id) ?? [];
    const kudoHashtags: HashtagRow[] = [];
    for (const hid of kudoHashtagIds) {
      const h = hashtagsById.get(hid);
      if (h) kudoHashtags.push(h);
    }

    const kudoImageJoins = imageJoinsByKudo.get(row.id) ?? [];
    const imagesOut: PublicKudo["images"] = [];
    for (const j of kudoImageJoins) {
      const u = uploadsById.get(j.upload_id);
      if (!u) continue;
      const url = signedUrlByUpload.get(u.id);
      if (!url) continue;
      imagesOut.push({
        id: u.id,
        url,
        mimeType: u.mime_type,
        byteSize: u.byte_size,
        width: u.width,
        height: u.height,
        expiresAt: new Date(
          Date.now() + SIGNED_URL_TTL_SECONDS * 1000,
        ).toISOString(),
      });
    }

    const mentionIds = mentionIdsByKudo.get(row.id) ?? [];

    items.push(
      serializeKudo(row, {
        employeesById,
        title,
        hashtags: kudoHashtags,
        images: imagesOut,
        mentionEmployeeIds: mentionIds,
        departmentCodeById,
        heartContext: {
          callerEmployeeId,
          heartCount: heartCountByKudo.get(row.id) ?? 0,
          likedKudoIds: likedSet,
        },
      }),
    );
  }

  // ---------------------------------------------------------------------------
  // 7. Compute nextCursor when we filled the page exactly.
  // ---------------------------------------------------------------------------
  let nextCursor: string | null = null;
  if (usingCursor && rows.length === limit) {
    const last = rows[rows.length - 1];
    nextCursor = encodeCursor({ createdAt: last.created_at, id: last.id });
  }

  return {
    ok: true,
    items,
    total: usingCursor ? null : (count ?? items.length),
    nextCursor,
  };
}
