import type { SupabaseClient } from "@supabase/supabase-js";
import type { EmployeeRow } from "@/types/kudos";

export const ERR_NO_EMPLOYEE_PROFILE = "NO_EMPLOYEE_PROFILE";
export const ERR_NOT_AUTHENTICATED = "NOT_AUTHENTICATED";

export class NoEmployeeProfileError extends Error {
  readonly code = ERR_NO_EMPLOYEE_PROFILE;
  constructor(email: string) {
    super(`No active employees row for email "${email}"`);
    this.name = "NoEmployeeProfileError";
  }
}

export class NotAuthenticatedError extends Error {
  readonly code = ERR_NOT_AUTHENTICATED;
  constructor() {
    super("Not authenticated");
    this.name = "NotAuthenticatedError";
  }
}

/**
 * Resolve the authenticated Supabase user to their active `employees` row.
 *
 * Called at the top of every Route Handler that performs Kudo-related work
 * (plan.md § FR-016 — Application layer enforcement).
 *
 * - Throws `NotAuthenticatedError` when no session is present.
 * - Throws `NoEmployeeProfileError` when a session exists but there is no
 *   matching active `employees` row for the JWT email claim.
 *   Route Handlers should translate this to `403 { code: "NO_EMPLOYEE_PROFILE" }`.
 *
 * The lookup is case-insensitive on email (matches the partial unique index
 * `idx_employees_email_active ON lower(email) WHERE deleted_at IS NULL`).
 */
export async function getCurrentEmployee(
  supabase: SupabaseClient,
): Promise<EmployeeRow> {
  const { data: session } = await supabase.auth.getUser();
  const email = session?.user?.email;
  if (!session?.user || !email) {
    throw new NotAuthenticatedError();
  }

  const { data, error } = await supabase
    .from("employees")
    .select(
      "id, email, full_name, employee_code, department, job_title, avatar_url, is_admin, deleted_at",
    )
    .ilike("email", email)
    .is("deleted_at", null)
    .limit(1)
    .maybeSingle();

  if (error) {
    // Surface DB errors to the caller; the Route Handler is responsible for
    // logging + returning 500.
    throw error;
  }

  if (!data) {
    // Flag so ops can detect mis-seeded employees (plan § Phase 5 polish).
    if (typeof console !== "undefined") {
      console.error(ERR_NO_EMPLOYEE_PROFILE, { email });
    }
    throw new NoEmployeeProfileError(email);
  }

  return data as EmployeeRow;
}
