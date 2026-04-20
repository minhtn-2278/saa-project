import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentEmployee } from "@/lib/auth/current-employee";
import {
  authErrorToResponse,
  errorResponse,
} from "@/lib/kudos/api-responses";
import type { TitleRow } from "@/types/kudos";

/**
 * GET /api/titles — list active Danh hiệu, ordered by sort_order then id.
 * Spec: TITLE_LIST_01..04; plan § Phase 3 backend integration.
 */
export async function GET() {
  const supabase = await createClient();

  try {
    await getCurrentEmployee(supabase);
  } catch (err) {
    const res = authErrorToResponse(err);
    if (res) return res;
    console.error("GET /api/titles identity error", err);
    return errorResponse("INTERNAL_ERROR", "Unexpected error", 500);
  }

  const { data, error } = await supabase
    .from("titles")
    .select(
      "id, name, slug, description, icon, sort_order, created_by, deleted_at",
    )
    .is("deleted_at", null)
    .order("sort_order", { ascending: true })
    .order("id", { ascending: true });

  if (error) {
    console.error("GET /api/titles query error", error);
    return errorResponse("INTERNAL_ERROR", "Could not list titles", 500);
  }

  const rows = (data ?? []) as TitleRow[];
  return NextResponse.json({
    data: rows.map((r) => ({
      id: r.id,
      name: r.name,
      slug: r.slug,
      description: r.description,
      icon: r.icon,
      sortOrder: r.sort_order,
    })),
  });
}
