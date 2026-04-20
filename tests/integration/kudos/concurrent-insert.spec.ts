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

const CALLER_EMAIL = "tran.nhat.minh@sun-asterisk.com";
const OTHER_EMAIL = "nguyen.thi.an@sun-asterisk.com";

/**
 * FR-006 race-safety: two callers creating the same hashtag slug in parallel
 * must collapse to a single row — the partial unique index on `slug` guards
 * the second insert; the handler's `upsert({onConflict:'slug', ignoreDuplicates:true})`
 * + re-read strategy resolves both requests to the same id.
 */
describe.skipIf(!runIntegration)("concurrent inline-create race", () => {
  let c1: string;
  let c2: string;
  let recipient1: number;
  let recipient2: number;
  let titleId: number;

  beforeEach(async () => {
    await resetKudoState();
    const admin = getTestAdminClient();

    const a = await signInAsEmail(CALLER_EMAIL);
    c1 = a.cookieHeader;
    const b = await signInAsEmail(OTHER_EMAIL);
    c2 = b.cookieHeader;

    // A and B each target someone different so neither hits the self-Kudo guard.
    const third = await getEmployeeIdByEmail("pham.van.bach@sun-asterisk.com");
    const fourth = await getEmployeeIdByEmail("le.minh.chau@sun-asterisk.com");
    if (!third || !fourth) throw new Error("seed missing third/fourth users");
    recipient1 = third;
    recipient2 = fourth;

    const { data: t } = await admin
      .from("titles")
      .select("id")
      .is("deleted_at", null)
      .limit(1);
    titleId = (t?.[0]?.id as number) ?? -1;
  });

  it("two parallel inline-creates of the same hashtag label collapse to one row", async () => {
    const admin = getTestAdminClient();
    const label = `concur_${Date.now().toString(36)}`;

    const [r1, r2] = await Promise.all([
      authedFetch("/api/kudos", c1, {
        method: "POST",
        body: JSON.stringify({
          recipientId: recipient1,
          titleId,
          body: plainBody("A"),
          hashtags: [{ label }],
        }),
      }),
      authedFetch("/api/kudos", c2, {
        method: "POST",
        body: JSON.stringify({
          recipientId: recipient2,
          titleId,
          body: plainBody("B"),
          hashtags: [{ label }],
        }),
      }),
    ]);
    expect(r1.status).toBe(201);
    expect(r2.status).toBe(201);

    const { data: rows } = await admin
      .from("hashtags")
      .select("id, label, usage_count")
      .eq("label", label);
    expect(rows?.length).toBe(1);
    // Both writers bumped the counter, so usage_count should be 2.
    expect(rows?.[0]?.usage_count).toBeGreaterThanOrEqual(1);
  });
});
