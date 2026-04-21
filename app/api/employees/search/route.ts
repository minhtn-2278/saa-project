import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentEmployee } from "@/lib/auth/current-employee";
import {
  authErrorToResponse,
  errorResponse,
  zodErrorToResponse,
} from "@/lib/kudos/api-responses";
import { employeeSearchParamsSchema } from "@/lib/validations/kudos";
import type { EmployeeRow } from "@/types/kudos";

/**
 * GET /api/employees/search — recipient + mention autocomplete.
 * Spec: EMP_SEARCH_01, 04, 06, 08, 13, 14, 18 (Phase 3 scope).
 *
 * Query params (parsed by employeeSearchParamsSchema):
 *   - q: required, min 1 char after trim.
 *   - ignore_caller: default true. When true, caller is excluded from results.
 *   - limit: 1–100, default 20.
 *
 * Match rules (diacritic-tolerant, case-insensitive):
 *   - `lower(full_name)` contains the search term (pg_trgm index used under the hood).
 *   - `lower(email)` contains the search term.
 * Soft-deleted accounts are always excluded.
 */
export async function GET(request: Request) {
  const supabase = await createClient();

  let caller: EmployeeRow;
  try {
    caller = await getCurrentEmployee(supabase);
  } catch (err) {
    const res = authErrorToResponse(err);
    if (res) return res;
    console.error("GET /api/employees/search identity error", err);
    return errorResponse("INTERNAL_ERROR", "Unexpected error", 500);
  }

  const url = new URL(request.url);
  const raw = {
    q: url.searchParams.get("q") ?? "",
    ignore_caller: url.searchParams.get("ignore_caller") ?? undefined,
    limit: url.searchParams.get("limit") ?? undefined,
  };
  const parsed = employeeSearchParamsSchema.safeParse(raw);
  if (!parsed.success) return zodErrorToResponse(parsed.error);

  const { q, ignore_caller, limit } = parsed.data;
  const normalised = q.normalize("NFC").toLowerCase();
  const escaped = normalised.replace(/[%_]/g, (c) => `\\${c}`);
  const pattern = `%${escaped}%`;

  // Live-board migration (plan § T015): read department via the new
  // `departments` FK join. Fall back to the legacy `employees.department`
  // free-text column while the transition is in flight — the response key
  // `department` is preserved so callers (Viết Kudo recipient dropdown) stay
  // unchanged.
  let query = supabase
    .from("employees")
    .select(
      "id, email, full_name, employee_code, department, department_id, job_title, avatar_url, is_admin, deleted_at, departments(code)",
    )
    .is("deleted_at", null)
    .or(`full_name.ilike.${pattern},email.ilike.${pattern}`)
    .order("full_name", { ascending: true })
    .limit(limit);

  if (ignore_caller) {
    query = query.neq("id", caller.id);
  }

  const { data, error } = await query;
  if (error) {
    console.error("GET /api/employees/search query error", error);
    return errorResponse("INTERNAL_ERROR", "Could not search employees", 500);
  }

  type RowWithDept = EmployeeRow & { departments: { code: string } | null };
  const rows = (data ?? []) as unknown as RowWithDept[];

  return NextResponse.json({
    data: rows.map((r) => ({
      id: r.id,
      email: r.email,
      fullName: r.full_name,
      employeeCode: r.employee_code,
      // Prefer the FK-resolved code; fall back to legacy text until the old
      // column is dropped in a follow-up migration.
      department: r.departments?.code ?? r.department,
      jobTitle: r.job_title,
      avatarUrl: r.avatar_url,
    })),
  });
}
