import { beforeEach, describe, expect, it } from "vitest";
import {
  authedFetch,
  plainBody,
  runIntegration,
  signInAsEmail,
  BASE_URL,
} from "./_test-utils";
import {
  getEmployeeIdByEmail,
  getTestAdminClient,
  resetKudoState,
} from "../_helpers/db";

/**
 * Integration tests for `GET /api/me/stats` (plan.md § T075, STATS_01..07).
 *
 * Contract: parallel aggregates scoped to the caller:
 *   - `kudosReceived` = published, non-deleted kudos with `recipient_id=me`
 *   - `kudosSent` = published, non-deleted kudos with `author_id=me`
 *     (anonymous Kudos STILL count — author is recorded even when masked)
 *   - `heartsReceived` = `kudo_hearts` whose kudo targets me + is published +
 *     non-deleted. Hidden / soft-deleted kudos' hearts are excluded.
 *   - `boxesOpened` / `boxesUnopened` are HARD-CODED to 0 (Secret Box feature
 *     deferred — `secret_boxes` table not in this release).
 *
 * Gated behind `RUN_INTEGRATION_TESTS=true`.
 */

const CALLER_EMAIL = "tran.nhat.minh-b@sun-asterisk.com";
const OTHER_EMAIL = "nguyen.thi.an@sun-asterisk.com";
const THIRD_EMAIL = "le.minh.chau@sun-asterisk.com";

async function createKudo(
  cookie: string,
  opts: {
    recipientId: number;
    titleId: number;
    hashtagId: number;
    body: string;
    isAnonymous?: boolean;
    anonymousAlias?: string;
  },
): Promise<number> {
  const res = await authedFetch("/api/kudos", cookie, {
    method: "POST",
    body: JSON.stringify({
      recipientId: opts.recipientId,
      titleId: opts.titleId,
      body: plainBody(opts.body),
      hashtags: [{ id: opts.hashtagId }],
      isAnonymous: opts.isAnonymous ?? false,
      anonymousAlias: opts.anonymousAlias,
    }),
  });
  if (!res.ok) {
    throw new Error(`createKudo failed ${res.status}: ${await res.text()}`);
  }
  const json = await res.json();
  return json.data.id as number;
}

async function addHeart(kudoId: number, employeeId: number): Promise<void> {
  const admin = getTestAdminClient();
  const { error } = await admin
    .from("kudo_hearts")
    .insert({ kudo_id: kudoId, employee_id: employeeId });
  if (error && error.code !== "23505") {
    throw new Error(`addHeart: ${error.message}`);
  }
}

describe.skipIf(!runIntegration)("GET /api/me/stats", () => {
  let callerCookie: string;
  let callerId: number;
  let otherCookie: string;
  let otherId: number;
  let thirdId: number;
  let titleId: number;
  let hashtagId: number;

  beforeEach(async () => {
    await resetKudoState();
    const admin = getTestAdminClient();

    const c = await signInAsEmail(CALLER_EMAIL);
    callerCookie = c.cookieHeader;
    callerId = c.employeeId;

    const o = await signInAsEmail(OTHER_EMAIL);
    otherCookie = o.cookieHeader;
    otherId = o.employeeId;

    const third = await getEmployeeIdByEmail(THIRD_EMAIL);
    if (!third) throw new Error("seed missing third employee");
    thirdId = third;

    const { data: titles } = await admin
      .from("titles")
      .select("id")
      .is("deleted_at", null)
      .limit(1);
    titleId = (titles?.[0]?.id as number) ?? -1;

    const { data: tags } = await admin
      .from("hashtags")
      .select("id")
      .is("deleted_at", null)
      .limit(1);
    hashtagId = (tags?.[0]?.id as number) ?? -1;
  });

  // ---------------------------------------------------------------------------
  // STATS_01 — caller with activity
  // ---------------------------------------------------------------------------
  it("STATS_01: returns live aggregates for a caller with Kudos activity", async () => {
    // Caller SENDS 2 kudos (to other + third).
    await createKudo(callerCookie, {
      recipientId: otherId,
      titleId,
      hashtagId,
      body: "sent1",
    });
    await createKudo(callerCookie, {
      recipientId: thirdId,
      titleId,
      hashtagId,
      body: "sent2",
    });
    // Caller RECEIVES 1 kudo (from other).
    const received = await createKudo(otherCookie, {
      recipientId: callerId,
      titleId,
      hashtagId,
      body: "received",
    });
    // Caller gets 2 hearts on the received kudo (from other + third).
    await addHeart(received, otherId);
    await addHeart(received, thirdId);

    const res = await authedFetch("/api/me/stats", callerCookie);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data).toMatchObject({
      kudosReceived: 1,
      kudosSent: 2,
      heartsReceived: 2,
      boxesOpened: 0,
      boxesUnopened: 0,
    });
  });

  // ---------------------------------------------------------------------------
  // STATS_02 — empty caller
  // ---------------------------------------------------------------------------
  it("STATS_02: brand-new caller has all counts at 0", async () => {
    const res = await authedFetch("/api/me/stats", callerCookie);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data).toEqual({
      kudosReceived: 0,
      kudosSent: 0,
      heartsReceived: 0,
      boxesOpened: 0,
      boxesUnopened: 0,
    });
  });

  // ---------------------------------------------------------------------------
  // STATS_03 — anonymous Kudos still count for sender
  // ---------------------------------------------------------------------------
  it("STATS_03: anonymous Kudos still count for the sender's kudosSent", async () => {
    await createKudo(callerCookie, {
      recipientId: otherId,
      titleId,
      hashtagId,
      body: "anon kudo",
      isAnonymous: true,
      anonymousAlias: "Thỏ bảy màu",
    });

    const res = await authedFetch("/api/me/stats", callerCookie);
    const json = await res.json();
    expect(json.data.kudosSent).toBe(1);
  });

  // ---------------------------------------------------------------------------
  // STATS_04 — soft-deleted Kudos excluded from kudosSent
  // ---------------------------------------------------------------------------
  it("STATS_04: soft-deleted Kudos are excluded from kudosSent", async () => {
    const ids: number[] = [];
    for (let i = 0; i < 3; i++) {
      ids.push(
        await createKudo(callerCookie, {
          recipientId: otherId,
          titleId,
          hashtagId,
          body: `k${i}`,
        }),
      );
    }
    const admin = getTestAdminClient();
    await admin
      .from("kudos")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", ids[0]);

    const res = await authedFetch("/api/me/stats", callerCookie);
    const json = await res.json();
    expect(json.data.kudosSent).toBe(2);
  });

  // ---------------------------------------------------------------------------
  // STATS_05 — hearts on hidden Kudos excluded from heartsReceived
  // ---------------------------------------------------------------------------
  it("STATS_05: hearts on hidden Kudos are excluded from heartsReceived", async () => {
    const k1 = await createKudo(otherCookie, {
      recipientId: callerId,
      titleId,
      hashtagId,
      body: "visible",
    });
    const k2 = await createKudo(otherCookie, {
      recipientId: callerId,
      titleId,
      hashtagId,
      body: "to-hide",
    });
    await addHeart(k1, otherId);
    await addHeart(k2, otherId);
    await addHeart(k2, thirdId);

    const admin = getTestAdminClient();
    await admin.from("kudos").update({ status: "hidden" }).eq("id", k2);

    const res = await authedFetch("/api/me/stats", callerCookie);
    const json = await res.json();
    expect(json.data.heartsReceived).toBe(1);
  });

  // ---------------------------------------------------------------------------
  // STATS_06 — Secret Box counts pinned to 0
  // ---------------------------------------------------------------------------
  it("STATS_06: boxesOpened and boxesUnopened are hard-coded to 0", async () => {
    const res = await authedFetch("/api/me/stats", callerCookie);
    const json = await res.json();
    expect(json.data.boxesOpened).toBe(0);
    expect(json.data.boxesUnopened).toBe(0);
  });

  // ---------------------------------------------------------------------------
  // STATS_07 — auth required
  // ---------------------------------------------------------------------------
  it("STATS_07: unauthenticated caller returns 401", async () => {
    const res = await fetch(`${BASE_URL}/api/me/stats`);
    expect(res.status).toBe(401);
  });
});
