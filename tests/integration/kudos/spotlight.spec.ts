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
 * Integration tests for `GET /api/spotlight` (plan.md § T092, SPOTLIGHT_01..14).
 *
 * Contract:
 *   - `data.total`         = event-wide `COUNT(*)` of `status=published`,
 *                            non-deleted kudos.
 *   - `data.nodes[]`       = up to 20 recipients ranked by 24h kudos count,
 *                            with `{x, y}` positions from
 *                            `lib/spotlight/layout.ts` — ordered by
 *                            `kudosCount DESC, lastReceivedAt DESC, id ASC`.
 *   - `data.layoutVersion` = `${eventDayIsoUtc}:${5minBucketUtc}` so clients
 *                            can detect layout changes without deep-diffing.
 *   - Cache-Control / ETag = 5-min public cache; 304 on matching ETag.
 *
 * `beforeEach` clears `kudos` + the `spotlight` cache tag so each test
 * starts from a known state.
 */

const CALLER_EMAIL = "tran.nhat.minh-b@sun-asterisk.com";
const RECIPIENT_EMAIL = "nguyen.thi.an@sun-asterisk.com";
const TEST_AUTH_SECRET = process.env.TEST_AUTH_SECRET ?? "";

async function revalidateSpotlight() {
  await fetch(`${BASE_URL}/api/_test/revalidate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Test-Auth": TEST_AUTH_SECRET,
    },
    body: JSON.stringify({ tags: ["spotlight"] }),
  });
}

async function createKudo(
  cookie: string,
  opts: { recipientId: number; titleId: number; hashtagId: number; body: string },
): Promise<number> {
  const res = await authedFetch("/api/kudos", cookie, {
    method: "POST",
    body: JSON.stringify({
      recipientId: opts.recipientId,
      titleId: opts.titleId,
      body: plainBody(opts.body),
      hashtags: [{ id: opts.hashtagId }],
      isAnonymous: false,
    }),
  });
  if (!res.ok) {
    throw new Error(`createKudo failed ${res.status}: ${await res.text()}`);
  }
  const json = await res.json();
  return json.data.id as number;
}

describe.skipIf(!runIntegration)("GET /api/spotlight", () => {
  let callerCookie: string;
  let recipientId: number;
  let titleId: number;
  let hashtagId: number;

  beforeEach(async () => {
    await resetKudoState();
    await revalidateSpotlight();
    const admin = getTestAdminClient();

    const c = await signInAsEmail(CALLER_EMAIL);
    callerCookie = c.cookieHeader;

    const r = await getEmployeeIdByEmail(RECIPIENT_EMAIL);
    if (!r) throw new Error("seed missing recipient");
    recipientId = r;

    const { data: titles } = await admin
      .from("titles").select("id").is("deleted_at", null).limit(1);
    titleId = (titles?.[0]?.id as number) ?? -1;
    const { data: tags } = await admin
      .from("hashtags").select("id").is("deleted_at", null).limit(1);
    hashtagId = (tags?.[0]?.id as number) ?? -1;
  });

  // ---------------------------------------------------------------------------
  // SPOTLIGHT_01 — cold cache, returns total + nodes
  // ---------------------------------------------------------------------------
  it("SPOTLIGHT_01: cold cache returns total + capped nodes", async () => {
    await createKudo(callerCookie, {
      recipientId, titleId, hashtagId, body: "hello",
    });

    const res = await authedFetch("/api/spotlight", callerCookie);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data.total).toBeGreaterThanOrEqual(1);
    expect(Array.isArray(json.data.nodes)).toBe(true);
    expect(json.data.nodes.length).toBeLessThanOrEqual(20);
    expect(typeof json.data.layoutVersion).toBe("string");
  });

  // ---------------------------------------------------------------------------
  // SPOTLIGHT_02 — warm cache within TTL returns same layoutVersion
  // ---------------------------------------------------------------------------
  it("SPOTLIGHT_02: two requests within the same bucket share layoutVersion", async () => {
    await createKudo(callerCookie, {
      recipientId, titleId, hashtagId, body: "warm",
    });

    const r1 = await authedFetch("/api/spotlight", callerCookie);
    const r2 = await authedFetch("/api/spotlight", callerCookie);
    expect(r1.status).toBe(200);
    expect(r2.status).toBe(200);
    const j1 = await r1.json();
    const j2 = await r2.json();
    expect(j2.data.layoutVersion).toBe(j1.data.layoutVersion);
  });

  // ---------------------------------------------------------------------------
  // SPOTLIGHT_03 — If-None-Match matching ETag → 304
  // ---------------------------------------------------------------------------
  it("SPOTLIGHT_03: matching If-None-Match returns 304", async () => {
    await createKudo(callerCookie, {
      recipientId, titleId, hashtagId, body: "etag",
    });
    const r1 = await authedFetch("/api/spotlight", callerCookie);
    const etag = r1.headers.get("ETag");
    expect(etag).toBeTruthy();

    const r2 = await authedFetch("/api/spotlight", callerCookie, {
      headers: { "If-None-Match": etag ?? "" },
    });
    expect(r2.status).toBe(304);
  });

  // ---------------------------------------------------------------------------
  // SPOTLIGHT_05 — quiet window: no kudos in 24h
  // ---------------------------------------------------------------------------
  it("SPOTLIGHT_05: quiet 24h window returns empty nodes with non-zero total", async () => {
    // Insert a kudo but backdate its created_at > 24h ago.
    const id = await createKudo(callerCookie, {
      recipientId, titleId, hashtagId, body: "old",
    });
    const admin = getTestAdminClient();
    await admin
      .from("kudos")
      .update({
        created_at: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
      })
      .eq("id", id);
    await revalidateSpotlight();

    const res = await authedFetch("/api/spotlight", callerCookie);
    const json = await res.json();
    expect(json.data.total).toBeGreaterThanOrEqual(1);
    expect(json.data.nodes).toEqual([]);
  });

  // ---------------------------------------------------------------------------
  // SPOTLIGHT_08 — hidden kudos excluded
  // ---------------------------------------------------------------------------
  it("SPOTLIGHT_08: hidden kudos are excluded from both total and nodes", async () => {
    const visible = await createKudo(callerCookie, {
      recipientId, titleId, hashtagId, body: "visible",
    });
    const hidden = await createKudo(callerCookie, {
      recipientId, titleId, hashtagId, body: "hidden",
    });
    const admin = getTestAdminClient();
    await admin.from("kudos").update({ status: "hidden" }).eq("id", hidden);
    await revalidateSpotlight();

    const res = await authedFetch("/api/spotlight", callerCookie);
    const json = await res.json();
    expect(json.data.total).toBe(1);
    const counts = json.data.nodes.map(
      (n: { kudosCount: number }) => n.kudosCount,
    );
    // Only the visible kudo counts for the recipient.
    expect(counts.reduce((a: number, b: number) => a + b, 0)).toBe(1);
    void visible;
  });

  // ---------------------------------------------------------------------------
  // SPOTLIGHT_09 — cap at 20 nodes
  // ---------------------------------------------------------------------------
  it("SPOTLIGHT_09: more than 20 recipients → capped at 20, ordered by kudosCount DESC", async () => {
    const admin = getTestAdminClient();
    const { data: emps } = await admin
      .from("employees")
      .select("id")
      .is("deleted_at", null)
      .limit(22);
    const ids = (emps ?? []).map((e) => e.id as number);
    if (ids.length < 22) return; // Seed doesn't have enough distinct employees.

    for (const rid of ids) {
      await createKudo(callerCookie, {
        recipientId: rid,
        titleId,
        hashtagId,
        body: "spread",
      });
    }
    await revalidateSpotlight();

    const res = await authedFetch("/api/spotlight", callerCookie);
    const json = await res.json();
    expect(json.data.nodes.length).toBe(20);
    const counts = json.data.nodes.map(
      (n: { kudosCount: number }) => n.kudosCount,
    );
    for (let i = 1; i < counts.length; i++) {
      expect(counts[i - 1]).toBeGreaterThanOrEqual(counts[i]);
    }
  });

  // ---------------------------------------------------------------------------
  // SPOTLIGHT_10 — auth required
  // ---------------------------------------------------------------------------
  it("SPOTLIGHT_10: unauthenticated caller returns 401", async () => {
    const res = await fetch(`${BASE_URL}/api/spotlight`);
    expect(res.status).toBe(401);
  });

  // ---------------------------------------------------------------------------
  // SPOTLIGHT_13 — deleted-employee recipient excluded
  // ---------------------------------------------------------------------------
  it("SPOTLIGHT_13: kudos to a soft-deleted recipient are excluded from nodes", async () => {
    const id = await createKudo(callerCookie, {
      recipientId, titleId, hashtagId, body: "will delete recipient",
    });
    const admin = getTestAdminClient();
    await admin
      .from("employees")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", recipientId);
    await revalidateSpotlight();

    try {
      const res = await authedFetch("/api/spotlight", callerCookie);
      const json = await res.json();
      const nodeIds = (
        json.data.nodes as Array<{ id: number }>
      ).map((n) => n.id);
      expect(nodeIds).not.toContain(recipientId);
    } finally {
      await admin
        .from("employees")
        .update({ deleted_at: null })
        .eq("id", recipientId);
      await admin.from("kudos").delete().eq("id", id);
      await revalidateSpotlight();
    }
  });
});
