import { NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service";
import { getCurrentEmployee } from "@/lib/auth/current-employee";
import {
  authErrorToResponse,
  errorResponse,
} from "@/lib/kudos/api-responses";
import type { DepartmentRow } from "@/types/kudos";

/**
 * GET /api/departments — flat list of active organisational units for the
 * Phòng ban filter dropdown (Figma `WXK5AYB_rG`).
 *
 * Ordering: `sort_order ASC, code ASC` — matches the Figma design order so
 * "CEVC1" lands above "CEVC2" regardless of DB insertion order.
 *
 * **Caching** (plan § T056): wrapped in `unstable_cache({ revalidate: 300 })`
 * with the `departments` tag. Ops uses `revalidateTag('departments')` after
 * the manual HR import (Q-A3) to flush the cache immediately.
 *
 * Auth: Route Handler requires a signed-in employee (same gate as the rest
 * of the Kudos API). `unstable_cache` only caches the query result, never
 * the auth check. The cached function uses the service-role client because
 * `unstable_cache` runs outside the active request scope — calling
 * `cookies()` / `headers()` there throws, and baking one user's session
 * into a shared cache entry would be wrong anyway. Department rows are
 * public master data so service-role reads are safe.
 */

const loadDepartments = unstable_cache(
  async () => {
    const supabase = createServiceRoleClient();
    const { data, error } = await supabase
      .from("departments")
      .select("id, code, name, parent_id, sort_order, deleted_at")
      .is("deleted_at", null)
      .order("sort_order", { ascending: true })
      .order("code", { ascending: true });
    if (error) {
      throw new Error(`GET /api/departments query error: ${error.message}`);
    }
    const rows = (data ?? []) as DepartmentRow[];
    return rows.map((r) => ({
      id: r.id,
      code: r.code,
      name: r.name,
      parentId: r.parent_id,
      sortOrder: r.sort_order,
    }));
  },
  ["live-board-departments-list"],
  { revalidate: 300, tags: ["departments"] },
);

export async function GET() {
  const supabase = await createClient();

  try {
    await getCurrentEmployee(supabase);
  } catch (err) {
    const res = authErrorToResponse(err);
    if (res) return res;
    console.error("GET /api/departments identity error", err);
    return errorResponse("INTERNAL_ERROR", "Unexpected error", 500);
  }

  try {
    const data = await loadDepartments();
    return NextResponse.json({ data });
  } catch (err) {
    console.error("GET /api/departments query error", err);
    return errorResponse("INTERNAL_ERROR", "Could not load departments", 500);
  }
}
