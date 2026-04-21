import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentEmployee } from "@/lib/auth/current-employee";
import {
  authErrorToResponse,
  errorResponse,
  zodErrorToResponse,
} from "@/lib/kudos/api-responses";
import { hashtagsListParamsSchema } from "@/lib/validations/live-board";
import type { HashtagRow } from "@/types/kudos";

/**
 * GET /api/hashtags — search / list active hashtags.
 *
 * Modes (plan § T058):
 *   - `?q=<text>` → case-insensitive prefix match on slug (ordered by slug).
 *   - `?sort=usage` → top `limit` hashtags by usage_count DESC, label ASC.
 *     Drives the Live-board Hashtag filter dropdown (B.1.1 → Figma JWpsISMAaM)
 *     which the plan caps at `limit=10` per Q-A2.
 *   - `?sort=recent` (default when no `q`) → preserves the Viết Kudo
 *     typeahead behaviour by ordering on usage_count DESC.
 *
 * Search (`q`) takes precedence over `sort` — both modes are still ordered
 * deterministically so the UI can render stable lists.
 */
export async function GET(request: Request) {
  const supabase = await createClient();

  try {
    await getCurrentEmployee(supabase);
  } catch (err) {
    const res = authErrorToResponse(err);
    if (res) return res;
    console.error("GET /api/hashtags identity error", err);
    return errorResponse("INTERNAL_ERROR", "Unexpected error", 500);
  }

  const url = new URL(request.url);
  const parsed = hashtagsListParamsSchema.safeParse({
    q: url.searchParams.get("q") ?? undefined,
    limit: url.searchParams.get("limit") ?? undefined,
    sort: url.searchParams.get("sort") ?? undefined,
  });
  if (!parsed.success) return zodErrorToResponse(parsed.error);
  const { q, limit, sort } = parsed.data;

  let query = supabase
    .from("hashtags")
    .select("id, label, slug, usage_count, created_by, deleted_at")
    .is("deleted_at", null)
    .limit(limit);

  if (q && q.length > 0) {
    const normalised = q.normalize("NFC").toLowerCase();
    // PostgREST `ilike` pattern — escape `%` and `_` so user input is literal.
    const escaped = normalised.replace(/[%_]/g, (c) => `\\${c}`);
    query = query
      .ilike("slug", `${escaped}%`)
      .order("slug", { ascending: true });
  } else if (sort === "usage") {
    query = query
      .order("usage_count", { ascending: false })
      .order("label", { ascending: true });
  } else {
    // sort === 'recent' — default, preserves Viết Kudo behaviour.
    query = query.order("usage_count", { ascending: false });
  }

  const { data, error } = await query;
  if (error) {
    console.error("GET /api/hashtags query error", error);
    return errorResponse("INTERNAL_ERROR", "Could not list hashtags", 500);
  }

  const rows = (data ?? []) as HashtagRow[];
  return NextResponse.json({
    data: rows.map((r) => ({
      id: r.id,
      label: r.label,
      slug: r.slug,
      usageCount: r.usage_count,
    })),
  });
}
