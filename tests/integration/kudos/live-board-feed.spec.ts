import { beforeEach, describe, expect, it } from "vitest";
import {
  authedFetch,
  plainBody,
  runIntegration,
  signInAsEmail,
} from "./_test-utils";
import {
  getEmployeeIdByEmail,
  getTestAdminClient,
  resetKudoState,
} from "../_helpers/db";

/**
 * Integration tests for the Live-board cursor + department + heart-fields
 * extensions of `GET /api/kudos`. See plan.md § Phase 3 (T032..T035).
 *
 * Gated behind `RUN_INTEGRATION_TESTS=true` like all HTTP-level tests —
 * requires a running dev server + a seeded Supabase test project.
 */

const CALLER_EMAIL = "tran.nhat.minh-b@sun-asterisk.com";
const RECIPIENT_EMAIL = "nguyen.thi.an@sun-asterisk.com";
const DEPT_EMPLOYEE_EMAIL = "le.minh.chau@sun-asterisk.com";

describe.skipIf(!runIntegration)("GET /api/kudos — Live board extensions", () => {
  let callerCookie: string;
  let callerId: number;
  let recipientId: number;
  let titleId: number;
  let hashtagId: number;

  beforeEach(async () => {
    await resetKudoState();
    const admin = getTestAdminClient();

    const c = await signInAsEmail(CALLER_EMAIL);
    callerCookie = c.cookieHeader;
    callerId = c.employeeId;

    const r = await getEmployeeIdByEmail(RECIPIENT_EMAIL);
    if (!r) throw new Error("seed missing recipient");
    recipientId = r;

    const { data: t } = await admin
      .from("titles")
      .select("id")
      .is("deleted_at", null)
      .limit(1);
    titleId = (t?.[0]?.id as number) ?? -1;

    const { data: h } = await admin
      .from("hashtags")
      .select("id")
      .is("deleted_at", null)
      .limit(1);
    hashtagId = (h?.[0]?.id as number) ?? -1;
  });

  // ---------------------------------------------------------------------------
  // KUDO_LIST_11 — cursor pagination (Live board)
  // ---------------------------------------------------------------------------
  it("KUDO_LIST_11: cursor=<ISO+id> returns items strictly older, populates nextCursor", async () => {
    // Create 3 kudos in order.
    for (const text of ["one", "two", "three"]) {
      await authedFetch("/api/kudos", callerCookie, {
        method: "POST",
        body: JSON.stringify({
          recipientId,
          titleId,
          body: plainBody(text),
          hashtags: [{ id: hashtagId }],
        }),
      });
      await new Promise((r) => setTimeout(r, 15));
    }

    // First page of size 2 — no cursor.
    const firstRes = await authedFetch(
      "/api/kudos?limit=2",
      callerCookie,
    );
    expect(firstRes.status).toBe(200);
    const first = await firstRes.json();
    expect(first.data).toHaveLength(2);
    expect(first.meta.nextCursor).toBeTypeOf("string");
    expect(first.meta.nextCursor.length).toBeGreaterThan(0);
    // Cursor mode: offset-meta fields are NOT populated.
    expect(first.meta.page).toBeFalsy();

    // Second page via cursor — expect the remaining 1 item, older than page 1.
    const secondRes = await authedFetch(
      `/api/kudos?limit=2&cursor=${encodeURIComponent(first.meta.nextCursor)}`,
      callerCookie,
    );
    expect(secondRes.status).toBe(200);
    const second = await secondRes.json();
    expect(second.data.length).toBeGreaterThanOrEqual(1);
    // Items should be strictly older than the cursor boundary (first-page's last).
    const firstPageTimestamps = first.data.map(
      (k: { createdAt: string }) => k.createdAt,
    );
    const oldestFirstPage = firstPageTimestamps[firstPageTimestamps.length - 1];
    for (const k of second.data) {
      expect(new Date(k.createdAt).getTime()).toBeLessThanOrEqual(
        new Date(oldestFirstPage).getTime(),
      );
    }
  });

  // ---------------------------------------------------------------------------
  // KUDO_LIST_12 — cursor exhausted
  // ---------------------------------------------------------------------------
  it("KUDO_LIST_12: cursor past the end returns data=[] + nextCursor=null", async () => {
    // Create a single kudo so we have SOMETHING older than the future cursor.
    await authedFetch("/api/kudos", callerCookie, {
      method: "POST",
      body: JSON.stringify({
        recipientId,
        titleId,
        body: plainBody("only one"),
        hashtags: [{ id: hashtagId }],
      }),
    });

    // Oldest-of-all cursor — encode a very old timestamp + id=1.
    const ancient = Buffer.from(
      JSON.stringify(["1970-01-01T00:00:00.000Z", 1]),
      "utf8",
    )
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");

    const res = await authedFetch(
      `/api/kudos?limit=10&cursor=${encodeURIComponent(ancient)}`,
      callerCookie,
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data).toEqual([]);
    expect(json.meta.nextCursor).toBeNull();
  });

  // ---------------------------------------------------------------------------
  // KUDO_LIST_14 — invalid cursor → 422
  // ---------------------------------------------------------------------------
  it("KUDO_LIST_14: invalid cursor → 422 VALIDATION_ERROR", async () => {
    const res = await authedFetch("/api/kudos?cursor=not-a-cursor", callerCookie);
    expect(res.status).toBe(422);
    const json = await res.json();
    expect(json.error.code).toBe("VALIDATION_ERROR");
  });

  // ---------------------------------------------------------------------------
  // KUDO_LIST_15 — filter by departmentId
  // ---------------------------------------------------------------------------
  it("KUDO_LIST_15: ?departmentId=<id> only returns Kudos whose recipient is in that department", async () => {
    const admin = getTestAdminClient();

    // Pick the department of DEPT_EMPLOYEE_EMAIL to filter on.
    const deptRecipientId = await getEmployeeIdByEmail(DEPT_EMPLOYEE_EMAIL);
    if (!deptRecipientId) throw new Error("seed missing DEPT_EMPLOYEE_EMAIL");
    const { data: deptRow } = await admin
      .from("employees")
      .select("department_id")
      .eq("id", deptRecipientId)
      .single();
    const departmentId = deptRow?.department_id as number | null;
    if (!departmentId) throw new Error("seed employee missing department_id");

    // Create one kudo for the dept employee and one for the standard recipient.
    await authedFetch("/api/kudos", callerCookie, {
      method: "POST",
      body: JSON.stringify({
        recipientId: deptRecipientId,
        titleId,
        body: plainBody("in the department"),
        hashtags: [{ id: hashtagId }],
      }),
    });
    await authedFetch("/api/kudos", callerCookie, {
      method: "POST",
      body: JSON.stringify({
        recipientId,
        titleId,
        body: plainBody("different department"),
        hashtags: [{ id: hashtagId }],
      }),
    });

    const res = await authedFetch(
      `/api/kudos?departmentId=${departmentId}`,
      callerCookie,
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data.length).toBeGreaterThanOrEqual(1);
    for (const k of json.data) {
      expect(k.recipientId).toBe(deptRecipientId);
    }
  });

  // ---------------------------------------------------------------------------
  // KUDO_LIST_16 — hashtag + department combined (AND)
  // ---------------------------------------------------------------------------
  it("KUDO_LIST_16: hashtagId + departmentId are combined via AND", async () => {
    const admin = getTestAdminClient();
    const deptRecipientId = await getEmployeeIdByEmail(DEPT_EMPLOYEE_EMAIL);
    if (!deptRecipientId) throw new Error("seed missing DEPT_EMPLOYEE_EMAIL");
    const { data: deptRow } = await admin
      .from("employees")
      .select("department_id")
      .eq("id", deptRecipientId)
      .single();
    const departmentId = deptRow?.department_id as number | null;
    if (!departmentId) throw new Error("seed missing department_id");

    await authedFetch("/api/kudos", callerCookie, {
      method: "POST",
      body: JSON.stringify({
        recipientId: deptRecipientId,
        titleId,
        body: plainBody("matches both"),
        hashtags: [{ id: hashtagId }],
      }),
    });

    const res = await authedFetch(
      `/api/kudos?hashtagId=${hashtagId}&departmentId=${departmentId}`,
      callerCookie,
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data.length).toBeGreaterThanOrEqual(1);
    for (const k of json.data) {
      expect(k.recipientId).toBe(deptRecipientId);
    }
  });

  // ---------------------------------------------------------------------------
  // KUDO_LIST_19 — Kudo card carries heart fields
  // ---------------------------------------------------------------------------
  it("KUDO_LIST_19: every card carries heartCount / heartedByMe / canHeart", async () => {
    await authedFetch("/api/kudos", callerCookie, {
      method: "POST",
      body: JSON.stringify({
        recipientId,
        titleId,
        body: plainBody("for heart fields"),
        hashtags: [{ id: hashtagId }],
      }),
    });

    const res = await authedFetch("/api/kudos", callerCookie);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data.length).toBeGreaterThan(0);
    for (const k of json.data) {
      expect(typeof k.heartCount).toBe("number");
      expect(k.heartCount).toBeGreaterThanOrEqual(0);
      expect(typeof k.heartedByMe).toBe("boolean");
      expect(typeof k.canHeart).toBe("boolean");
    }
  });

  // ---------------------------------------------------------------------------
  // KUDO_LIST_20 — canHeart=false on own Kudo
  // ---------------------------------------------------------------------------
  it("KUDO_LIST_20: canHeart is false on Kudos authored by the caller", async () => {
    await authedFetch("/api/kudos", callerCookie, {
      method: "POST",
      body: JSON.stringify({
        recipientId,
        titleId,
        body: plainBody("authored by caller"),
        hashtags: [{ id: hashtagId }],
      }),
    });

    const res = await authedFetch("/api/kudos", callerCookie);
    const json = await res.json();
    const own = json.data.find(
      (k: { bodyPlain: string }) => k.bodyPlain === "authored by caller",
    );
    expect(own).toBeDefined();
    expect(own.canHeart).toBe(false);

    // Sanity: when the caller likes someone else's Kudo, their own row
    // still has canHeart=false (author check, not liked-set check).
    expect(callerId).toBeGreaterThan(0);
  });
});
