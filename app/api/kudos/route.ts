import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { getCurrentEmployee } from "@/lib/auth/current-employee";
import {
  authErrorToResponse,
  errorResponse,
  zodErrorToResponse,
} from "@/lib/kudos/api-responses";
import {
  createKudoRequestSchema,
  bodyPlainSchema,
} from "@/lib/validations/kudos";
import { liveBoardListKudosParamsSchema } from "@/lib/validations/live-board";
import { fetchKudosPage } from "@/lib/kudos/fetch-kudos-page";
import { extractMentionIds, sanitizeBody } from "@/lib/kudos/sanitize-body";
import { hashtagSlug, titleSlug } from "@/lib/kudos/hashtag-slug";
import { serializeKudo } from "@/lib/kudos/serialize-kudo";
import { KUDO_IMAGES_BUCKET } from "@/lib/constants/kudos";
import type {
  CreateKudoRequest,
  EmployeeRow,
  HashtagRow,
  KudoRow,
  PublicKudo,
  TitleRow,
  UploadRow,
} from "@/types/kudos";

const SIGNED_URL_TTL_SECONDS = 60 * 60; // 1h (TR-008)

/**
 * POST /api/kudos — create a new Kudo.
 *
 * Runs the TypeScript transactional chain described in plan.md § Backend:
 *   1. Resolve inline-create titles/hashtags via `upsert({onConflict:'slug'})`.
 *   2. INSERT into `kudos`, capture id.
 *   3. Bulk INSERT into `kudo_hashtags`.
 *   4. (US2) Bulk INSERT into `kudo_images`, `kudo_mentions` — Phase 4.
 *   5. Bump hashtags.usage_count (best-effort, eventually consistent).
 *   6. Re-read + serialise + return.
 * If steps 3–4 fail, issue a compensating `DELETE FROM kudos WHERE id=?`.
 */
export async function POST(request: Request) {
  const supabase = await createClient();

  let caller: EmployeeRow;
  try {
    caller = await getCurrentEmployee(supabase);
  } catch (err) {
    const res = authErrorToResponse(err);
    if (res) return res;
    console.error("POST /api/kudos identity error", err);
    return errorResponse("INTERNAL_ERROR", "Unexpected error", 500);
  }

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return errorResponse("BAD_REQUEST", "Invalid JSON body", 400);
  }

  const parsed = createKudoRequestSchema.safeParse(rawBody);
  if (!parsed.success) return zodErrorToResponse(parsed.error);
  const input: CreateKudoRequest = parsed.data;

  // Self-Kudo guard (FR-016 step 2).
  if (input.recipientId === caller.id) {
    return errorResponse("VALIDATION_ERROR", "Validation failed", 422, {
      recipientId: ["recipient.self"],
    });
  }

  // Recipient must exist and be active.
  const { data: recipient, error: recipientError } = await supabase
    .from("employees")
    .select("id, deleted_at")
    .eq("id", input.recipientId)
    .maybeSingle();
  if (recipientError) {
    console.error("POST /api/kudos recipient lookup error", recipientError);
    return errorResponse("INTERNAL_ERROR", "Unexpected error", 500);
  }
  if (!recipient || recipient.deleted_at) {
    return errorResponse("VALIDATION_ERROR", "Validation failed", 422, {
      recipientId: ["recipient.notFound"],
    });
  }

  // Sanitise body + re-validate body_plain length.
  const { body: cleanBody, bodyPlain } = sanitizeBody(input.body);
  const plainCheck = bodyPlainSchema.safeParse(bodyPlain);
  if (!plainCheck.success) return zodErrorToResponse(plainCheck.error);

  // Title resolution: titleId existing, or titleName to inline-create.
  let titleId: number;
  if (input.titleId != null) {
    const { data: title, error } = await supabase
      .from("titles")
      .select("id, deleted_at")
      .eq("id", input.titleId)
      .maybeSingle();
    if (error) {
      console.error("POST /api/kudos title lookup error", error);
      return errorResponse("INTERNAL_ERROR", "Unexpected error", 500);
    }
    if (!title || title.deleted_at) {
      return errorResponse("VALIDATION_ERROR", "Validation failed", 422, {
        titleId: ["title.notFound"],
      });
    }
    titleId = title.id;
  } else if (input.titleName) {
    const resolved = await resolveTitleByName(
      supabase,
      input.titleName,
      caller.id,
    );
    if ("error" in resolved) return resolved.error;
    titleId = resolved.id;
  } else {
    // Zod superRefine already catches this, but keep a belt-and-braces guard.
    return errorResponse("VALIDATION_ERROR", "Validation failed", 422, {
      titleId: ["title.required"],
    });
  }

  // Image ownership + attach-check (FR-016 step 2; KUDO_CREATE_18/19).
  const imageIds = input.imageIds ?? [];
  if (imageIds.length > 0) {
    const { data: uploadRows, error: uplError } = await supabase
      .from("uploads")
      .select("id, owner_id, deleted_at")
      .in("id", imageIds);
    if (uplError) {
      console.error("POST /api/kudos upload lookup error", uplError);
      return errorResponse("INTERNAL_ERROR", "Unexpected error", 500);
    }
    const rows = uploadRows ?? [];
    // 404 / ownership check.
    for (const id of imageIds) {
      const row = rows.find((r) => r.id === id);
      if (!row || row.deleted_at) {
        return errorResponse("VALIDATION_ERROR", "Validation failed", 422, {
          imageIds: [`image.notFound:${id}`],
        });
      }
      if (row.owner_id !== caller.id) {
        return errorResponse("FORBIDDEN", "Not the owner of an image", 403);
      }
    }
    // Already-attached check — every upload must NOT appear in any kudo_images row.
    const { data: attachedRows, error: attachError } = await supabase
      .from("kudo_images")
      .select("upload_id")
      .in("upload_id", imageIds);
    if (attachError) {
      console.error("POST /api/kudos attach-check error", attachError);
      return errorResponse("INTERNAL_ERROR", "Unexpected error", 500);
    }
    if ((attachedRows ?? []).length > 0) {
      const already = Array.from(
        new Set((attachedRows ?? []).map((r) => r.upload_id as number)),
      );
      return errorResponse("VALIDATION_ERROR", "Validation failed", 422, {
        imageIds: [`image.alreadyAttached:${already.join(",")}`],
      });
    }
  }

  // Extract @mention ids from the sanitised body.
  const mentionIds = extractMentionIds(cleanBody);
  // Validate that every mention points to an active employee.
  let validMentionIds: number[] = [];
  if (mentionIds.length > 0) {
    const { data: validEmployees, error: mentionError } = await supabase
      .from("employees")
      .select("id")
      .in("id", mentionIds)
      .is("deleted_at", null);
    if (mentionError) {
      console.error("POST /api/kudos mention lookup error", mentionError);
      return errorResponse("INTERNAL_ERROR", "Unexpected error", 500);
    }
    const validSet = new Set((validEmployees ?? []).map((e) => e.id as number));
    // Preserve the order returned by extractMentionIds.
    validMentionIds = mentionIds.filter((id) => validSet.has(id));
    // Note: invalid mentions are silently dropped — the sanitiser already
    // stripped bogus attrs, and mentions for deleted employees are
    // legitimate (show as plain reference on the board).
  }

  // Hashtag resolution: ids stay as-is; labels are upserted into hashtags.
  const resolvedHashtagIds: number[] = [];
  for (const entry of input.hashtags) {
    if ("id" in entry) {
      const { data: h, error } = await supabase
        .from("hashtags")
        .select("id, deleted_at")
        .eq("id", entry.id)
        .maybeSingle();
      if (error) {
        console.error("POST /api/kudos hashtag lookup error", error);
        return errorResponse("INTERNAL_ERROR", "Unexpected error", 500);
      }
      if (!h || h.deleted_at) {
        return errorResponse("VALIDATION_ERROR", "Validation failed", 422, {
          hashtags: [`hashtag.notFound:${entry.id}`],
        });
      }
      resolvedHashtagIds.push(h.id);
    } else {
      const resolved = await resolveHashtagByLabel(
        supabase,
        entry.label,
        caller.id,
      );
      if ("error" in resolved) return resolved.error;
      resolvedHashtagIds.push(resolved.id);
    }
  }

  // Insert the kudos row.
  const { data: inserted, error: insertError } = await supabase
    .from("kudos")
    .insert({
      author_id: caller.id,
      recipient_id: input.recipientId,
      title_id: titleId,
      body: cleanBody,
      body_plain: bodyPlain,
      is_anonymous: input.isAnonymous ?? false,
      anonymous_alias: input.isAnonymous
        ? input.anonymousAlias?.trim() || null
        : null,
      status: "published",
    })
    .select("id")
    .single();

  if (insertError || !inserted) {
    console.error("POST /api/kudos insert error", insertError);
    return errorResponse(
      "INTERNAL_ERROR",
      insertError?.message ?? "Could not create kudo",
      500,
    );
  }

  const kudoId = inserted.id as number;

  // Compensating rollback: on any failure below, delete the kudos row.
  const rollback = async (reason: string): Promise<NextResponse> => {
    const { error: delError } = await supabase
      .from("kudos")
      .delete()
      .eq("id", kudoId);
    if (delError) {
      // Log + surface — the join tables have ON DELETE CASCADE so
      // leaving the kudos row while deletion failed is the worst case.
      console.error(
        `POST /api/kudos compensating rollback failed for kudo ${kudoId}`,
        delError,
      );
    }
    return errorResponse("INTERNAL_ERROR", reason, 500);
  };

  // Bulk-insert kudo_hashtags.
  if (resolvedHashtagIds.length > 0) {
    const rows = resolvedHashtagIds.map((hashtag_id) => ({
      kudo_id: kudoId,
      hashtag_id,
    }));
    const { error } = await supabase.from("kudo_hashtags").insert(rows);
    if (error) {
      console.error("POST /api/kudos kudo_hashtags insert error", error);
      return rollback("Could not attach hashtags");
    }
  }

  // Bulk-insert kudo_images (ordered via position 0..4).
  if (imageIds.length > 0) {
    const rows = imageIds.map((upload_id, position) => ({
      kudo_id: kudoId,
      upload_id,
      position,
    }));
    const { error } = await supabase.from("kudo_images").insert(rows);
    if (error) {
      console.error("POST /api/kudos kudo_images insert error", error);
      return rollback("Could not attach images");
    }
  }

  // Bulk-insert kudo_mentions (order preserved by validMentionIds).
  if (validMentionIds.length > 0) {
    const rows = validMentionIds.map((employee_id) => ({
      kudo_id: kudoId,
      employee_id,
    }));
    const { error } = await supabase.from("kudo_mentions").insert(rows);
    if (error) {
      console.error("POST /api/kudos kudo_mentions insert error", error);
      return rollback("Could not attach mentions");
    }
  }

  // Best-effort usage_count bump (partial failure is tolerable — TR).
  for (const hashtag_id of resolvedHashtagIds) {
    const { error } = await supabase.rpc("increment_hashtag_usage", {
      p_hashtag_id: hashtag_id,
    });
    if (error) {
      // Fallback: read-modify-write. Non-atomic but close enough under low
      // concurrency; a proper RPC can be added later without touching callers.
      const { data: h } = await supabase
        .from("hashtags")
        .select("usage_count")
        .eq("id", hashtag_id)
        .maybeSingle();
      const next = ((h?.usage_count as number | undefined) ?? 0) + 1;
      await supabase
        .from("hashtags")
        .update({ usage_count: next })
        .eq("id", hashtag_id);
    }
  }

  // Re-read the kudo + joins and serialise.
  const serialised = await readAndSerialise(supabase, kudoId);
  if ("error" in serialised) return serialised.error;

  return NextResponse.json({ data: serialised.kudo }, { status: 201 });
}

/**
 * GET /api/kudos — paginated published-kudo feed for the board.
 * Spec coverage:
 *   - KUDO_LIST_01, 05, 09, 10 (Viết Kudo Phase 3)
 *   - KUDO_LIST_11..16, 19, 20 (Live-board Phase 3 — cursor, department,
 *     heart fields)
 *
 * Two pagination modes (caller picks by presence of `cursor`):
 *   - **Offset** (legacy): `?page=&limit=` → `meta: { page, limit, total }`.
 *   - **Cursor** (Live board): `?cursor=&limit=` → `meta: { limit, nextCursor }`.
 *
 * Cursor format: opaque base64url of `[createdAtIso, id]` — composite tuple
 * ordering so exact-timestamp ties during burst inserts stay deterministic
 * (plan Q-P1).
 */
export async function GET(request: Request) {
  const supabase = await createClient();

  let caller: EmployeeRow;
  try {
    caller = await getCurrentEmployee(supabase);
  } catch (err) {
    const res = authErrorToResponse(err);
    if (res) return res;
    console.error("GET /api/kudos identity error", err);
    return errorResponse("INTERNAL_ERROR", "Unexpected error", 500);
  }

  const url = new URL(request.url);
  const parsed = liveBoardListKudosParamsSchema.safeParse({
    page: url.searchParams.get("page") ?? undefined,
    limit: url.searchParams.get("limit") ?? undefined,
    cursor: url.searchParams.get("cursor") ?? undefined,
    titleId: url.searchParams.get("titleId") ?? undefined,
    hashtagId: url.searchParams.get("hashtagId") ?? undefined,
    departmentId: url.searchParams.get("departmentId") ?? undefined,
  });
  if (!parsed.success) return zodErrorToResponse(parsed.error);
  const { page, limit, cursor, titleId, hashtagId, departmentId } = parsed.data;

  const usingCursor = cursor !== undefined;

  // Delegate to the shared batched helper — one code path for both the
  // Viết Kudo board (page/offset) and the Live board (cursor). See
  // `lib/kudos/fetch-kudos-page.ts` for the N+1 avoidance strategy.
  const result = await fetchKudosPage(supabase, {
    callerEmployeeId: caller.id,
    limit,
    page,
    cursor,
    titleId,
    hashtagId,
    departmentId,
  });

  if (!result.ok) {
    console.error("GET /api/kudos fetchKudosPage error", result.message);
    return errorResponse("INTERNAL_ERROR", "Could not load kudos", 500);
  }

  return NextResponse.json({
    data: result.items,
    meta: usingCursor
      ? { limit, nextCursor: result.nextCursor }
      : { page, limit, total: result.total ?? 0 },
  });
}

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

async function resolveTitleByName(
  supabase: SupabaseClient,
  rawName: string,
  callerId: number,
): Promise<{ id: number } | { error: NextResponse }> {
  const name = rawName.trim();
  let slug: string;
  try {
    slug = titleSlug(name);
  } catch {
    return {
      error: errorResponse("VALIDATION_ERROR", "Validation failed", 422, {
        titleName: ["title.length"],
      }),
    };
  }

  // First try to find an existing active title by slug.
  const { data: existing, error: lookupError } = await supabase
    .from("titles")
    .select("id")
    .eq("slug", slug)
    .is("deleted_at", null)
    .limit(1)
    .maybeSingle();
  if (lookupError) {
    console.error("resolveTitleByName lookup error", lookupError);
    return { error: errorResponse("INTERNAL_ERROR", "Unexpected error", 500) };
  }
  if (existing?.id) return { id: existing.id as number };

  // Compute next sort_order once; race-safe fallback below.
  const { data: top } = await supabase
    .from("titles")
    .select("sort_order")
    .is("deleted_at", null)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  const nextSort = ((top?.sort_order as number | undefined) ?? 0) + 1;

  const { data: upserted, error: upsertError } = await supabase
    .from("titles")
    .upsert(
      { name, slug, sort_order: nextSort, created_by: callerId },
      { onConflict: "slug", ignoreDuplicates: true },
    )
    .select("id")
    .maybeSingle();
  if (upsertError) {
    console.error("resolveTitleByName upsert error", upsertError);
    return { error: errorResponse("INTERNAL_ERROR", "Unexpected error", 500) };
  }
  if (upserted?.id) return { id: upserted.id as number };

  // Race: another writer inserted while we were upserting. Read back.
  const { data: raced } = await supabase
    .from("titles")
    .select("id")
    .eq("slug", slug)
    .is("deleted_at", null)
    .limit(1)
    .maybeSingle();
  if (raced?.id) return { id: raced.id as number };

  return { error: errorResponse("INTERNAL_ERROR", "Could not resolve title", 500) };
}

async function resolveHashtagByLabel(
  supabase: SupabaseClient,
  rawLabel: string,
  callerId: number,
): Promise<{ id: number } | { error: NextResponse }> {
  const label = rawLabel.trim();
  let slug: string;
  try {
    slug = hashtagSlug(label);
  } catch {
    return {
      error: errorResponse("VALIDATION_ERROR", "Validation failed", 422, {
        hashtags: ["hashtag.charset"],
      }),
    };
  }

  const { data: existing, error: lookupError } = await supabase
    .from("hashtags")
    .select("id")
    .eq("slug", slug)
    .is("deleted_at", null)
    .limit(1)
    .maybeSingle();
  if (lookupError) {
    console.error("resolveHashtagByLabel lookup error", lookupError);
    return { error: errorResponse("INTERNAL_ERROR", "Unexpected error", 500) };
  }
  if (existing?.id) return { id: existing.id as number };

  const { data: upserted, error: upsertError } = await supabase
    .from("hashtags")
    .upsert(
      { label, slug, created_by: callerId },
      { onConflict: "slug", ignoreDuplicates: true },
    )
    .select("id")
    .maybeSingle();
  if (upsertError) {
    console.error("resolveHashtagByLabel upsert error", upsertError);
    return { error: errorResponse("INTERNAL_ERROR", "Unexpected error", 500) };
  }
  if (upserted?.id) return { id: upserted.id as number };

  const { data: raced } = await supabase
    .from("hashtags")
    .select("id")
    .eq("slug", slug)
    .is("deleted_at", null)
    .limit(1)
    .maybeSingle();
  if (raced?.id) return { id: raced.id as number };

  return {
    error: errorResponse("INTERNAL_ERROR", "Could not resolve hashtag", 500),
  };
}

async function readAndSerialise(
  supabase: SupabaseClient,
  kudoId: number,
): Promise<{ kudo: PublicKudo } | { error: NextResponse }> {
  const { data: row, error } = await supabase
    .from("kudos")
    .select(
      "id, author_id, recipient_id, title_id, body, body_plain, is_anonymous, anonymous_alias, status, created_at, updated_at, deleted_at",
    )
    .eq("id", kudoId)
    .maybeSingle();
  if (error || !row) {
    console.error("readAndSerialise: cannot read kudo", kudoId, error);
    return {
      error: errorResponse("INTERNAL_ERROR", "Could not read kudo", 500),
    };
  }
  return serialiseKudoRow(supabase, row as KudoRow);
}

interface ServialiseKudoHeartContext {
  callerEmployeeId: number;
  heartCount: number;
  likedKudoIds: Set<number>;
}

async function serialiseKudoRow(
  supabase: SupabaseClient,
  row: KudoRow,
  heartCtx?: ServialiseKudoHeartContext,
): Promise<{ kudo: PublicKudo } | { error: NextResponse }> {
  // Resolve author + recipient + mentions employees.
  const { data: mentionRows } = await supabase
    .from("kudo_mentions")
    .select("employee_id")
    .eq("kudo_id", row.id);
  const mentionIds = (mentionRows ?? []).map((m) => m.employee_id as number);

  const allEmployeeIds = Array.from(
    new Set([row.author_id, row.recipient_id, ...mentionIds]),
  );

  const { data: employees, error: empError } = await supabase
    .from("employees")
    .select(
      "id, email, full_name, employee_code, department, job_title, avatar_url, is_admin, deleted_at",
    )
    .in("id", allEmployeeIds);
  if (empError) {
    console.error("serialiseKudoRow employees error", empError);
    return {
      error: errorResponse("INTERNAL_ERROR", "Could not resolve employees", 500),
    };
  }
  const employeesById = new Map<number, EmployeeRow>();
  for (const e of (employees ?? []) as EmployeeRow[]) employeesById.set(e.id, e);

  // Title.
  const { data: title, error: titleError } = await supabase
    .from("titles")
    .select(
      "id, name, slug, description, icon, sort_order, created_by, deleted_at",
    )
    .eq("id", row.title_id)
    .maybeSingle();
  if (titleError || !title) {
    console.error("serialiseKudoRow title error", titleError);
    return {
      error: errorResponse("INTERNAL_ERROR", "Could not resolve title", 500),
    };
  }

  // Hashtags.
  const { data: tagJoin } = await supabase
    .from("kudo_hashtags")
    .select("hashtag_id")
    .eq("kudo_id", row.id);
  const hashtagIds = (tagJoin ?? []).map((r) => r.hashtag_id as number);
  let hashtags: HashtagRow[] = [];
  if (hashtagIds.length > 0) {
    const { data: h } = await supabase
      .from("hashtags")
      .select("id, label, slug, usage_count, created_by, deleted_at")
      .in("id", hashtagIds);
    hashtags = (h ?? []) as HashtagRow[];
  }

  // Images (signed URLs; Phase 4 populates; Phase 3 returns empty array).
  const { data: imageJoin } = await supabase
    .from("kudo_images")
    .select("upload_id, position")
    .eq("kudo_id", row.id)
    .order("position", { ascending: true });
  const imagesOut: PublicKudo["images"] = [];
  if ((imageJoin ?? []).length > 0) {
    const uploadIds = (imageJoin ?? []).map((r) => r.upload_id as number);
    const { data: uploads } = await supabase
      .from("uploads")
      .select("id, owner_id, storage_key, mime_type, byte_size, width, height, deleted_at")
      .in("id", uploadIds);
    const uploadsById = new Map<number, UploadRow>();
    for (const u of (uploads ?? []) as UploadRow[]) uploadsById.set(u.id, u);

    for (const j of imageJoin ?? []) {
      const u = uploadsById.get(j.upload_id as number);
      if (!u) continue;
      const { data: signed } = await supabase.storage
        .from(KUDO_IMAGES_BUCKET)
        .createSignedUrl(u.storage_key, SIGNED_URL_TTL_SECONDS);
      if (!signed?.signedUrl) continue;
      imagesOut.push({
        id: u.id,
        url: signed.signedUrl,
        mimeType: u.mime_type,
        byteSize: u.byte_size,
        width: u.width,
        height: u.height,
        expiresAt: new Date(Date.now() + SIGNED_URL_TTL_SECONDS * 1000).toISOString(),
      });
    }
  }

  const kudo = serializeKudo(row, {
    employeesById,
    title: title as TitleRow,
    hashtags,
    images: imagesOut,
    mentionEmployeeIds: mentionIds,
    heartContext: heartCtx
      ? {
          callerEmployeeId: heartCtx.callerEmployeeId,
          heartCount: heartCtx.heartCount,
          likedKudoIds: heartCtx.likedKudoIds,
        }
      : undefined,
  });

  return { kudo };
}
