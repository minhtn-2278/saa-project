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
const RECIPIENT_EMAIL = "nguyen.thi.an@sun-asterisk.com";

describe.skipIf(!runIntegration)("POST /api/kudos — transactional rollback", () => {
  let callerCookie: string;
  let recipientId: number;
  let titleId: number;

  beforeEach(async () => {
    await resetKudoState();
    const admin = getTestAdminClient();
    const caller = await signInAsEmail(CALLER_EMAIL);
    callerCookie = caller.cookieHeader;

    const maybeRecipient = await getEmployeeIdByEmail(RECIPIENT_EMAIL);
    if (!maybeRecipient) throw new Error(`seed missing ${RECIPIENT_EMAIL}`);
    recipientId = maybeRecipient;

    const { data: titles } = await admin
      .from("titles")
      .select("id")
      .is("deleted_at", null)
      .limit(1);
    titleId = (titles?.[0]?.id as number) ?? -1;
  });

  /**
   * Force a bogus hashtag id. The server does a lookup first and fails
   * validation (422) BEFORE inserting the parent `kudos` row — so this is
   * really an assertion that we never leave an orphan in the happy path.
   */
  it("never leaves an orphan kudos row when child validation fails", async () => {
    const admin = getTestAdminClient();
    const { count: before } = await admin
      .from("kudos")
      .select("id", { count: "exact", head: true });

    const res = await authedFetch("/api/kudos", callerCookie, {
      method: "POST",
      body: JSON.stringify({
        recipientId,
        titleId,
        body: plainBody("rollback test"),
        hashtags: [{ id: 99999999 }],
      }),
    });
    expect([422, 500]).toContain(res.status);

    const { count: after } = await admin
      .from("kudos")
      .select("id", { count: "exact", head: true });
    expect(after).toBe(before);
  });
});
