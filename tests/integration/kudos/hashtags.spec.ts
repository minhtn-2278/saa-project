import { beforeEach, describe, expect, it } from "vitest";
import {
  authedFetch,
  runIntegration,
  signInAsEmail,
} from "./_test-utils";

const CALLER_EMAIL = "tran.nhat.minh@sun-asterisk.com";

describe.skipIf(!runIntegration)("GET /api/hashtags", () => {
  let callerCookie: string;

  beforeEach(async () => {
    const c = await signInAsEmail(CALLER_EMAIL);
    callerCookie = c.cookieHeader;
  });

  it("HASHTAG_LIST_01: default → top hashtags by usage_count desc", async () => {
    const res = await authedFetch("/api/hashtags", callerCookie);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(Array.isArray(json.data)).toBe(true);
    for (let i = 1; i < json.data.length; i++) {
      expect(json.data[i].usageCount).toBeLessThanOrEqual(
        json.data[i - 1].usageCount,
      );
    }
  });

  it("HASHTAG_LIST_05: no match → empty array", async () => {
    const res = await authedFetch(
      "/api/hashtags?q=xzxzxzxzxzxzxzxz",
      callerCookie,
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data).toEqual([]);
  });

  it("HASHTAG_LIST_08: no auth → 401", async () => {
    const res = await fetch("http://localhost:3000/api/hashtags");
    expect(res.status).toBe(401);
  });
});
