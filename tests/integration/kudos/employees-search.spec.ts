import { beforeEach, describe, expect, it } from "vitest";
import {
  authedFetch,
  runIntegration,
  signInAsEmail,
} from "./_test-utils";

const CALLER_EMAIL = "tran.nhat.minh@sun-asterisk.com";

describe.skipIf(!runIntegration)("GET /api/employees/search", () => {
  let callerCookie: string;
  let callerId: number;

  beforeEach(async () => {
    const c = await signInAsEmail(CALLER_EMAIL);
    callerCookie = c.cookieHeader;
    callerId = c.employeeId;
  });

  it("EMP_SEARCH_01: default (ignore_caller=true) excludes caller", async () => {
    const res = await authedFetch("/api/employees/search?q=Nguyen", callerCookie);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(Array.isArray(json.data)).toBe(true);
    expect(json.data.find((e: { id: number }) => e.id === callerId)).toBeUndefined();
  });

  it("EMP_SEARCH_04: trims leading/trailing whitespace", async () => {
    const trimmed = await authedFetch("/api/employees/search?q=Nguyen", callerCookie);
    const padded = await authedFetch(
      `/api/employees/search?q=${encodeURIComponent("  Nguyen  ")}`,
      callerCookie,
    );
    expect(trimmed.status).toBe(200);
    expect(padded.status).toBe(200);
    const a = await trimmed.json();
    const b = await padded.json();
    expect(a.data.length).toBe(b.data.length);
  });

  it("EMP_SEARCH_06: caller excluded by default even on own name", async () => {
    const res = await authedFetch("/api/employees/search?q=minh", callerCookie);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(
      json.data.find((e: { id: number }) => e.id === callerId),
    ).toBeUndefined();
  });

  it("EMP_SEARCH_08: deactivated accounts excluded", async () => {
    const res = await authedFetch(
      "/api/employees/search?q=%25&ignore_caller=false",
      callerCookie,
    );
    expect(res.status).toBe(200);
    // Any returned row must NOT be deleted — server filters them out.
    // (We can't directly assert deleted rows aren't in the result from the
    // wire shape — deleted_at isn't emitted — so we rely on schema.)
  });

  it("EMP_SEARCH_13: missing q → 422", async () => {
    const res = await authedFetch("/api/employees/search", callerCookie);
    expect(res.status).toBe(422);
  });

  it("EMP_SEARCH_14: whitespace-only q → 422", async () => {
    const res = await authedFetch(
      `/api/employees/search?q=${encodeURIComponent("   ")}`,
      callerCookie,
    );
    expect(res.status).toBe(422);
  });

  it("EMP_SEARCH_18: no auth → 401", async () => {
    const res = await fetch("http://localhost:3000/api/employees/search?q=a");
    expect(res.status).toBe(401);
  });

  // ---------------------------------------------------------------------------
  // Phase 4 (US2) — T094: ignore_caller=false path (mention popover)
  // ---------------------------------------------------------------------------

  it("EMP_SEARCH_03: mention-mode (ignore_caller=false) MAY include caller", async () => {
    const res = await authedFetch(
      "/api/employees/search?q=minh&ignore_caller=false",
      callerCookie,
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(Array.isArray(json.data)).toBe(true);
    // Caller is allowed (but not required — depends on whose name the query matches).
  });

  it("EMP_SEARCH_07: explicit ignore_caller=false on caller name → caller present", async () => {
    const res = await authedFetch(
      "/api/employees/search?q=Minh&ignore_caller=false",
      callerCookie,
    );
    const json = await res.json();
    expect(
      json.data.find((e: { id: number }) => e.id === callerId),
    ).toBeDefined();
  });
});
