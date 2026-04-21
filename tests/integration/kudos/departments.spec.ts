import { beforeEach, describe, expect, it } from "vitest";
import { authedFetch, runIntegration, signInAsEmail, BASE_URL } from "./_test-utils";
import { getTestAdminClient } from "../_helpers/db";

/**
 * Integration tests for `GET /api/departments`.
 * See plan.md § T055 (DEPT_LIST_01..05).
 *
 * The handler returns the flat list of active departments ordered by
 * `sort_order` then `code`. Wrapped in `unstable_cache({revalidate:300})`
 * — tests hit `/api/_test/revalidate` first to clear the cache between
 * runs (see T022).
 */

const CALLER_EMAIL = "tran.nhat.minh-b@sun-asterisk.com";
const TEST_AUTH_SECRET = process.env.TEST_AUTH_SECRET ?? "";

async function revalidateDepartments() {
  await fetch(`${BASE_URL}/api/_test/revalidate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Test-Auth": TEST_AUTH_SECRET,
    },
    body: JSON.stringify({ tags: ["departments"] }),
  });
}

describe.skipIf(!runIntegration)("GET /api/departments", () => {
  let callerCookie: string;

  beforeEach(async () => {
    const c = await signInAsEmail(CALLER_EMAIL);
    callerCookie = c.cookieHeader;
    await revalidateDepartments();
  });

  // ---------------------------------------------------------------------------
  // DEPT_LIST_01 — returns all active rows
  // ---------------------------------------------------------------------------
  it("DEPT_LIST_01: returns only active departments (deleted_at IS NULL)", async () => {
    const admin = getTestAdminClient();
    const res = await authedFetch("/api/departments", callerCookie);
    expect(res.status).toBe(200);
    const json = await res.json();
    const { count: activeCount } = await admin
      .from("departments")
      .select("*", { count: "exact", head: true })
      .is("deleted_at", null);
    expect(json.data.length).toBe(activeCount);
  });

  // ---------------------------------------------------------------------------
  // DEPT_LIST_02 — ORDER BY sort_order, code
  // ---------------------------------------------------------------------------
  it("DEPT_LIST_02: ordering is sort_order ASC, then code ASC", async () => {
    const res = await authedFetch("/api/departments", callerCookie);
    const json = await res.json();
    const rows = json.data as Array<{ code: string; sortOrder: number }>;
    for (let i = 1; i < rows.length; i++) {
      const prev = rows[i - 1];
      const cur = rows[i];
      if (prev.sortOrder !== cur.sortOrder) {
        expect(prev.sortOrder).toBeLessThanOrEqual(cur.sortOrder);
      } else {
        expect(prev.code.localeCompare(cur.code)).toBeLessThanOrEqual(0);
      }
    }
  });

  // ---------------------------------------------------------------------------
  // DEPT_LIST_03 — soft-deleted excluded
  // ---------------------------------------------------------------------------
  it("DEPT_LIST_03: soft-deleted departments are excluded", async () => {
    const admin = getTestAdminClient();
    const { data: active } = await admin
      .from("departments")
      .select("id, code")
      .is("deleted_at", null)
      .limit(1);
    const target = active?.[0];
    if (!target) return;

    await admin
      .from("departments")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", target.id);
    await revalidateDepartments();

    try {
      const res = await authedFetch("/api/departments", callerCookie);
      const json = await res.json();
      const ids = (json.data as Array<{ id: number }>).map((d) => d.id);
      expect(ids).not.toContain(target.id);
    } finally {
      await admin
        .from("departments")
        .update({ deleted_at: null })
        .eq("id", target.id);
      await revalidateDepartments();
    }
  });

  // ---------------------------------------------------------------------------
  // DEPT_LIST_04 — hierarchy field exposed
  // ---------------------------------------------------------------------------
  it("DEPT_LIST_04: response exposes parentId for hierarchy", async () => {
    const res = await authedFetch("/api/departments", callerCookie);
    const json = await res.json();
    expect(Array.isArray(json.data)).toBe(true);
    for (const row of json.data) {
      expect(row).toHaveProperty("parentId");
      expect(row.parentId === null || typeof row.parentId === "number").toBe(
        true,
      );
    }
  });

  // ---------------------------------------------------------------------------
  // DEPT_LIST_05 — auth
  // ---------------------------------------------------------------------------
  it("DEPT_LIST_05: unauthenticated caller returns 401", async () => {
    const res = await fetch(`${BASE_URL}/api/departments`);
    expect(res.status).toBe(401);
  });
});
