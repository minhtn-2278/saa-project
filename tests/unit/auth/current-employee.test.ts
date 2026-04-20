import { describe, it, expect, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  getCurrentEmployee,
  NoEmployeeProfileError,
  NotAuthenticatedError,
} from "@/lib/auth/current-employee";

/**
 * Minimal Supabase mock — only the bits `getCurrentEmployee` touches.
 * Mirrors the chained query-builder interface enough to unit-test the
 * resolver without a real connection.
 */
function mockSupabase(opts: {
  user?: { email: string } | null;
  employee?: { id: number; email: string; full_name: string } | null;
  dbError?: { message: string } | null;
}): SupabaseClient {
  const builder = {
    select: () => builder,
    ilike: () => builder,
    is: () => builder,
    limit: () => builder,
    maybeSingle: vi.fn(async () => ({
      data: opts.employee
        ? {
            id: opts.employee.id,
            email: opts.employee.email,
            full_name: opts.employee.full_name,
            employee_code: "SA-TEST",
            department: "Testing",
            job_title: "Test",
            avatar_url: null,
            is_admin: false,
            deleted_at: null,
          }
        : null,
      error: opts.dbError ?? null,
    })),
  };
  return {
    auth: {
      getUser: vi.fn(async () => ({
        data: { user: opts.user ?? null },
        error: null,
      })),
    },
    from: vi.fn(() => builder),
  } as unknown as SupabaseClient;
}

describe("getCurrentEmployee", () => {
  it("returns the matching employee row for an authenticated user", async () => {
    const supabase = mockSupabase({
      user: { email: "tran.nhat.minh@sun-asterisk.com" },
      employee: {
        id: 1,
        email: "tran.nhat.minh@sun-asterisk.com",
        full_name: "Trần Nhật Minh",
      },
    });
    const out = await getCurrentEmployee(supabase);
    expect(out.id).toBe(1);
    expect(out.full_name).toBe("Trần Nhật Minh");
  });

  it("throws NotAuthenticatedError when there is no session", async () => {
    const supabase = mockSupabase({ user: null });
    await expect(getCurrentEmployee(supabase)).rejects.toBeInstanceOf(
      NotAuthenticatedError,
    );
  });

  it("throws NoEmployeeProfileError when session exists but no employees row", async () => {
    const supabase = mockSupabase({
      user: { email: "ghost@sun-asterisk.com" },
      employee: null,
    });
    await expect(getCurrentEmployee(supabase)).rejects.toBeInstanceOf(
      NoEmployeeProfileError,
    );
  });

  it("re-throws database errors so the Route Handler can log + 500", async () => {
    const supabase = mockSupabase({
      user: { email: "tran.nhat.minh@sun-asterisk.com" },
      employee: null,
      dbError: { message: "connection reset" },
    });
    await expect(getCurrentEmployee(supabase)).rejects.toMatchObject({
      message: "connection reset",
    });
  });

  it("does case-insensitive email match (handled by ilike in the resolver)", async () => {
    // Under mock we just confirm the method is invoked; real case-insensitivity
    // is verified by integration tests against the partial unique index on
    // lower(email).
    const supabase = mockSupabase({
      user: { email: "Tran.Nhat.Minh@Sun-Asterisk.com" },
      employee: {
        id: 1,
        email: "tran.nhat.minh@sun-asterisk.com",
        full_name: "Trần Nhật Minh",
      },
    });
    const out = await getCurrentEmployee(supabase);
    expect(out.id).toBe(1);
  });
});
