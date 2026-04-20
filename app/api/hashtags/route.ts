import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getCurrentEmployee } from "@/lib/auth/current-employee";
import {
  authErrorToResponse,
  errorResponse,
  zodErrorToResponse,
} from "@/lib/kudos/api-responses";
import type { HashtagRow } from "@/types/kudos";

const listHashtagsParamsSchema = z.object({
  q: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v && v.length > 0 ? v : undefined)),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

/**
 * GET /api/hashtags — search/list active hashtags.
 * Spec: HASHTAG_LIST_01, 05, 08 (Phase 3 scope).
 *   - No `q`: return top `limit` hashtags ordered by usage_count desc.
 *   - With `q`: case-insensitive prefix match on slug (derived lower + NFC).
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
  const raw = {
    q: url.searchParams.get("q") ?? undefined,
    limit: url.searchParams.get("limit") ?? undefined,
  };
  const parsed = listHashtagsParamsSchema.safeParse(raw);
  if (!parsed.success) return zodErrorToResponse(parsed.error);

  let query = supabase
    .from("hashtags")
    .select("id, label, slug, usage_count, created_by, deleted_at")
    .is("deleted_at", null)
    .limit(parsed.data.limit);

  if (parsed.data.q) {
    const normalised = parsed.data.q.normalize("NFC").toLowerCase();
    // PostgREST `ilike` pattern — escape `%` and `_` so user input is literal.
    const escaped = normalised.replace(/[%_]/g, (c) => `\\${c}`);
    query = query.ilike("slug", `${escaped}%`).order("slug", { ascending: true });
  } else {
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
