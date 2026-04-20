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

describe.skipIf(!runIntegration)("GET /api/kudos", () => {
  let callerCookie: string;
  let recipientId: number;
  let titleId: number;
  let hashtagId: number;

  beforeEach(async () => {
    await resetKudoState();
    const admin = getTestAdminClient();

    const c = await signInAsEmail(CALLER_EMAIL);
    callerCookie = c.cookieHeader;

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

  it("KUDO_LIST_01: default pagination, newest first", async () => {
    // Create two kudos, newest second.
    await authedFetch("/api/kudos", callerCookie, {
      method: "POST",
      body: JSON.stringify({
        recipientId,
        titleId,
        body: plainBody("older"),
        hashtags: [{ id: hashtagId }],
      }),
    });
    await new Promise((r) => setTimeout(r, 30));
    await authedFetch("/api/kudos", callerCookie, {
      method: "POST",
      body: JSON.stringify({
        recipientId,
        titleId,
        body: plainBody("newer"),
        hashtags: [{ id: hashtagId }],
      }),
    });

    const list = await authedFetch("/api/kudos", callerCookie);
    expect(list.status).toBe(200);
    const json = await list.json();
    expect(json.meta.page).toBe(1);
    expect(json.meta.limit).toBe(20);
    expect(json.data.length).toBeGreaterThanOrEqual(2);
    expect(json.data[0].bodyPlain).toContain("newer");
  });

  it("KUDO_LIST_05: limit=100", async () => {
    const res = await authedFetch("/api/kudos?limit=100", callerCookie);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.meta.limit).toBe(100);
  });

  it("KUDO_LIST_09: hidden kudo excluded", async () => {
    const admin = getTestAdminClient();
    const { data: kudoInsert } = await admin
      .from("kudos")
      .insert({
        author_id: (await getEmployeeIdByEmail(CALLER_EMAIL)) ?? -1,
        recipient_id: recipientId,
        title_id: titleId,
        body: plainBody("hidden one"),
        body_plain: "hidden one",
        status: "hidden",
      })
      .select("id")
      .single();
    const hiddenId = kudoInsert?.id;

    const res = await authedFetch("/api/kudos", callerCookie);
    const json = await res.json();
    expect(
      json.data.find((k: { id: number }) => k.id === hiddenId),
    ).toBeUndefined();
  });

  it("KUDO_LIST_10: no auth → 401", async () => {
    const res = await fetch("http://localhost:3000/api/kudos");
    expect(res.status).toBe(401);
  });
});
