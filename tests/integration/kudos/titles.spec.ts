import { beforeEach, describe, expect, it } from "vitest";
import {
  authedFetch,
  runIntegration,
  signInAsEmail,
} from "./_test-utils";
import { getTestAdminClient } from "../_helpers/db";

const CALLER_EMAIL = "tran.nhat.minh@sun-asterisk.com";

describe.skipIf(!runIntegration)("GET /api/titles", () => {
  let callerCookie: string;

  beforeEach(async () => {
    const c = await signInAsEmail(CALLER_EMAIL);
    callerCookie = c.cookieHeader;
  });

  it("TITLE_LIST_01: default request → sorted by sort_order asc", async () => {
    const res = await authedFetch("/api/titles", callerCookie);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(Array.isArray(json.data)).toBe(true);
    for (let i = 1; i < json.data.length; i++) {
      expect(json.data[i].sortOrder).toBeGreaterThanOrEqual(
        json.data[i - 1].sortOrder,
      );
    }
  });

  it("TITLE_LIST_02: soft-deleted titles excluded", async () => {
    const admin = getTestAdminClient();
    // Seed-dependent: at least one soft-deleted title is expected in the seed.
    const { data: deleted } = await admin
      .from("titles")
      .select("id, slug, name")
      .not("deleted_at", "is", null)
      .limit(1);
    if (!deleted?.[0]) return;
    const res = await authedFetch("/api/titles", callerCookie);
    const json = await res.json();
    expect(
      json.data.find((t: { id: number }) => t.id === deleted[0].id),
    ).toBeUndefined();
  });

  it("TITLE_LIST_04: no auth → 401", async () => {
    const res = await fetch("http://localhost:3000/api/titles");
    expect(res.status).toBe(401);
  });
});
