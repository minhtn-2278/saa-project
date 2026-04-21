import { NextResponse } from "next/server";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { getCurrentEmployee } from "@/lib/auth/current-employee";
import {
  authErrorToResponse,
  errorResponse,
  zodErrorToResponse,
} from "@/lib/kudos/api-responses";

/**
 * `POST|DELETE /api/kudos/[id]/like` — Live-board US4 heart toggle.
 *
 * Both verbs share the same resolver: load the kudo (excluding
 * soft-deleted / hidden / reported — Q-P3 treats all invisible kudos as
 * 404), check auth + self-like on POST, then issue the INSERT or DELETE
 * and re-read post-operation state. The response shape
 * `{data: {kudoId, heartCount, heartedByMe}}` is identical for both verbs
 * so the optimistic client reconciles from a single code path
 * (plan § Phase 6, api-docs `LikeResponse`).
 *
 * Idempotency:
 *   - POST: `kudo_hearts` has composite PK `(kudo_id, employee_id)`; a
 *     duplicate insert returns Postgres `23505` which we swallow and treat
 *     as success (no extra row written).
 *   - DELETE: the `DELETE FROM kudo_hearts WHERE ...` is naturally
 *     idempotent — 0 rows matched is not an error.
 *
 * Self-like enforcement is *authoritative* here — the client's `canHeart`
 * flag is UX-only (see plan.md Risk: self-like enforcement leak).
 */

const idSchema = z.coerce
  .number()
  .int()
  .positive({ message: "kudoId.invalid" });

interface LikePostState {
  kudoId: number;
  heartCount: number;
  heartedByMe: boolean;
}

async function resolveVisibleKudo(
  supabase: SupabaseClient,
  kudoId: number,
): Promise<{ authorId: number } | { notFound: true }> {
  const { data, error } = await supabase
    .from("kudos")
    .select("id, author_id, status, deleted_at")
    .eq("id", kudoId)
    .maybeSingle();
  if (error) {
    throw new Error(`kudo lookup: ${error.message}`);
  }
  if (!data || data.deleted_at || data.status !== "published") {
    return { notFound: true };
  }
  return { authorId: data.author_id as number };
}

async function readPostState(
  supabase: SupabaseClient,
  kudoId: number,
  callerId: number,
): Promise<LikePostState> {
  const { count, error: countError } = await supabase
    .from("kudo_hearts")
    .select("kudo_id", { count: "exact", head: true })
    .eq("kudo_id", kudoId);
  if (countError) {
    throw new Error(`hearts count: ${countError.message}`);
  }

  const { data: mine, error: mineError } = await supabase
    .from("kudo_hearts")
    .select("kudo_id")
    .eq("kudo_id", kudoId)
    .eq("employee_id", callerId)
    .maybeSingle();
  if (mineError) {
    throw new Error(`hearts mine: ${mineError.message}`);
  }

  return {
    kudoId,
    heartCount: count ?? 0,
    heartedByMe: Boolean(mine),
  };
}

export async function POST(
  _request: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id: rawId } = await ctx.params;

  const parsed = idSchema.safeParse(rawId);
  if (!parsed.success) return zodErrorToResponse(parsed.error);
  const kudoId = parsed.data;

  const supabase = await createClient();

  let callerId: number;
  try {
    const caller = await getCurrentEmployee(supabase);
    callerId = caller.id;
  } catch (err) {
    const res = authErrorToResponse(err);
    if (res) return res;
    console.error("POST /api/kudos/[id]/like identity error", err);
    return errorResponse("INTERNAL_ERROR", "Unexpected error", 500);
  }

  let visible: { authorId: number } | { notFound: true };
  try {
    visible = await resolveVisibleKudo(supabase, kudoId);
  } catch (err) {
    console.error("POST /api/kudos/[id]/like lookup error", err);
    return errorResponse("INTERNAL_ERROR", "Unexpected error", 500);
  }
  if ("notFound" in visible) {
    return errorResponse("NOT_FOUND", "Kudo not found", 404);
  }

  if (visible.authorId === callerId) {
    return errorResponse(
      "SELF_LIKE_FORBIDDEN",
      "Bạn không thể thả tim cho Kudo của chính mình",
      403,
    );
  }

  const { error: insertError } = await supabase
    .from("kudo_hearts")
    .insert({ kudo_id: kudoId, employee_id: callerId });
  // 23505 (unique_violation) is the duplicate-like race — swallow for
  // idempotency; anything else is unexpected.
  if (insertError && insertError.code !== "23505") {
    console.error("POST /api/kudos/[id]/like insert error", insertError);
    return errorResponse("INTERNAL_ERROR", "Unexpected error", 500);
  }

  try {
    const state = await readPostState(supabase, kudoId, callerId);
    return NextResponse.json({ data: state });
  } catch (err) {
    console.error("POST /api/kudos/[id]/like read-back error", err);
    return errorResponse("INTERNAL_ERROR", "Unexpected error", 500);
  }
}

export async function DELETE(
  _request: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id: rawId } = await ctx.params;

  const parsed = idSchema.safeParse(rawId);
  if (!parsed.success) return zodErrorToResponse(parsed.error);
  const kudoId = parsed.data;

  const supabase = await createClient();

  let callerId: number;
  try {
    const caller = await getCurrentEmployee(supabase);
    callerId = caller.id;
  } catch (err) {
    const res = authErrorToResponse(err);
    if (res) return res;
    console.error("DELETE /api/kudos/[id]/like identity error", err);
    return errorResponse("INTERNAL_ERROR", "Unexpected error", 500);
  }

  let visible: { authorId: number } | { notFound: true };
  try {
    visible = await resolveVisibleKudo(supabase, kudoId);
  } catch (err) {
    console.error("DELETE /api/kudos/[id]/like lookup error", err);
    return errorResponse("INTERNAL_ERROR", "Unexpected error", 500);
  }
  if ("notFound" in visible) {
    return errorResponse("NOT_FOUND", "Kudo not found", 404);
  }

  const { error: deleteError } = await supabase
    .from("kudo_hearts")
    .delete()
    .eq("kudo_id", kudoId)
    .eq("employee_id", callerId);
  if (deleteError) {
    console.error("DELETE /api/kudos/[id]/like delete error", deleteError);
    return errorResponse("INTERNAL_ERROR", "Unexpected error", 500);
  }

  try {
    const state = await readPostState(supabase, kudoId, callerId);
    return NextResponse.json({ data: state });
  } catch (err) {
    console.error("DELETE /api/kudos/[id]/like read-back error", err);
    return errorResponse("INTERNAL_ERROR", "Unexpected error", 500);
  }
}
