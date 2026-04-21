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
 * Integration tests for `GET /api/kudos/highlight`.
 * See plan.md § T052 (HIGHLIGHT_01..12).
 *
 * Ordering contract: top-5 published Kudos ranked by `heartCount DESC`,
 * tie-break `created_at DESC` then `id DESC`. Hidden / soft-deleted Kudos
 * are excluded. Filters (`hashtagId`, `departmentId`) AND-combine like the
 * ALL KUDOS feed. Anonymous authors are masked.
 */

const CALLER_EMAIL = "tran.nhat.minh-b@sun-asterisk.com";
const RECIPIENT_EMAIL = "nguyen.thi.an@sun-asterisk.com";
const SECOND_RECIPIENT_EMAIL = "le.minh.chau@sun-asterisk.com";

async function addHeart(kudoId: number, employeeId: number) {
  const admin = getTestAdminClient();
  const { error } = await admin
    .from("kudo_hearts")
    .insert({ kudo_id: kudoId, employee_id: employeeId });
  if (error) throw new Error(`addHeart: ${error.message}`);
}

async function createKudo(
  cookie: string,
  opts: {
    recipientId: number;
    titleId: number;
    body: string;
    hashtagId: number;
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

describe.skipIf(!runIntegration)("GET /api/kudos/highlight", () => {
  let callerCookie: string;
  let callerId: number;
  let recipientId: number;
  let secondRecipientId: number;
  let titleId: number;
  let hashtagId: number;
  let otherHashtagId: number;
  /** A different employee that can like Kudos on behalf of the tests
   *  (INNER JOIN with kudo_hearts excludes 0-heart Kudos — tests that
   *  want a Kudo to appear must seed at least one heart for it). */
  let likerId: number;

  beforeEach(async () => {
    await resetKudoState();
    const admin = getTestAdminClient();

    const c = await signInAsEmail(CALLER_EMAIL);
    callerCookie = c.cookieHeader;
    callerId = c.employeeId;

    const r = await getEmployeeIdByEmail(RECIPIENT_EMAIL);
    if (!r) throw new Error("seed missing recipient");
    recipientId = r;
    const r2 = await getEmployeeIdByEmail(SECOND_RECIPIENT_EMAIL);
    if (!r2) throw new Error("seed missing second recipient");
    secondRecipientId = r2;
    likerId = r;

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
      .limit(2);
    hashtagId = (h?.[0]?.id as number) ?? -1;
    otherHashtagId = (h?.[1]?.id as number) ?? hashtagId;
  });

  // ---------------------------------------------------------------------------
  // HIGHLIGHT_01 — returns 0..5 items (top-5 ordering)
  // ---------------------------------------------------------------------------
  it("HIGHLIGHT_01: top-5 ordering by heart count desc", async () => {
    const ids: number[] = [];
    for (let i = 0; i < 6; i++) {
      ids.push(
        await createKudo(callerCookie, {
          recipientId,
          titleId,
          body: `kudo ${i}`,
          hashtagId,
        }),
      );
      await new Promise((r) => setTimeout(r, 10));
    }

    // Assign descending heart counts: ids[0]=5, ids[1]=4, ids[2]=3, ids[3]=2, ids[4]=1, ids[5]=0.
    const admin = getTestAdminClient();
    const { data: emps } = await admin
      .from("employees")
      .select("id")
      .is("deleted_at", null)
      .neq("id", callerId)
      .limit(10);
    const likerIds = (emps ?? []).map((e) => e.id as number);
    const counts = [5, 4, 3, 2, 1, 0];
    for (let i = 0; i < ids.length; i++) {
      for (let j = 0; j < counts[i]; j++) {
        await addHeart(ids[i], likerIds[j % likerIds.length]);
      }
    }

    const res = await authedFetch("/api/kudos/highlight", callerCookie);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data).toHaveLength(5);
    const returnedIds = json.data.map((k: { id: number }) => k.id);
    expect(returnedIds).toEqual(ids.slice(0, 5));
  });

  // ---------------------------------------------------------------------------
  // HIGHLIGHT_02 — tie-break by created_at desc then id desc
  // ---------------------------------------------------------------------------
  it("HIGHLIGHT_02: all-tied ties broken by created_at desc, id desc", async () => {
    const ids: number[] = [];
    for (let i = 0; i < 3; i++) {
      const id = await createKudo(callerCookie, {
        recipientId,
        titleId,
        body: `tie ${i}`,
        hashtagId,
      });
      // INNER JOIN excludes 0-heart Kudos — seed exactly 1 heart each so the
      // tie-break on `created_at DESC, id DESC` is what's under test.
      await addHeart(id, likerId);
      ids.push(id);
      await new Promise((r) => setTimeout(r, 15));
    }
    const res = await authedFetch("/api/kudos/highlight", callerCookie);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data.length).toBe(3);
    const returnedIds = json.data.map((k: { id: number }) => k.id);
    // Newest-first ordering — ids[2] created last.
    expect(returnedIds).toEqual([...ids].reverse());
  });

  // ---------------------------------------------------------------------------
  // HIGHLIGHT_03 — hashtag filter
  // ---------------------------------------------------------------------------
  it("HIGHLIGHT_03: hashtagId filter only returns Kudos carrying that hashtag", async () => {
    const tagAId = await createKudo(callerCookie, {
      recipientId,
      titleId,
      body: "tagA",
      hashtagId,
    });
    await addHeart(tagAId, likerId);
    if (otherHashtagId !== hashtagId) {
      const tagBId = await createKudo(callerCookie, {
        recipientId,
        titleId,
        body: "tagB",
        hashtagId: otherHashtagId,
      });
      await addHeart(tagBId, likerId);
    }

    const res = await authedFetch(
      `/api/kudos/highlight?hashtagId=${hashtagId}`,
      callerCookie,
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    for (const k of json.data) {
      const hashtagIds = k.hashtags.map(
        (h: { id: number }) => h.id,
      );
      expect(hashtagIds).toContain(hashtagId);
    }
  });

  // ---------------------------------------------------------------------------
  // HIGHLIGHT_04 — department filter
  // ---------------------------------------------------------------------------
  it("HIGHLIGHT_04: departmentId filter only returns Kudos whose recipient is in that department", async () => {
    const admin = getTestAdminClient();
    const { data: deptRow } = await admin
      .from("employees")
      .select("department_id")
      .eq("id", secondRecipientId)
      .single();
    const deptId = deptRow?.department_id as number | null;
    if (!deptId) throw new Error("seed: recipient missing department_id");

    const inDeptId = await createKudo(callerCookie, {
      recipientId: secondRecipientId,
      titleId,
      body: "in dept",
      hashtagId,
    });
    await addHeart(inDeptId, likerId);
    const otherDeptId = await createKudo(callerCookie, {
      recipientId,
      titleId,
      body: "other dept",
      hashtagId,
    });
    await addHeart(otherDeptId, likerId);

    const res = await authedFetch(
      `/api/kudos/highlight?departmentId=${deptId}`,
      callerCookie,
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    for (const k of json.data) {
      expect(k.recipientId).toBe(secondRecipientId);
    }
  });

  // ---------------------------------------------------------------------------
  // HIGHLIGHT_05 — combined filters AND
  // ---------------------------------------------------------------------------
  it("HIGHLIGHT_05: hashtagId + departmentId AND-combine", async () => {
    const admin = getTestAdminClient();
    const { data: deptRow } = await admin
      .from("employees")
      .select("department_id")
      .eq("id", secondRecipientId)
      .single();
    const deptId = deptRow?.department_id as number | null;
    if (!deptId) throw new Error("seed: recipient missing department_id");

    const matchId = await createKudo(callerCookie, {
      recipientId: secondRecipientId,
      titleId,
      body: "both match",
      hashtagId,
    });
    await addHeart(matchId, likerId);

    const res = await authedFetch(
      `/api/kudos/highlight?hashtagId=${hashtagId}&departmentId=${deptId}`,
      callerCookie,
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data.length).toBeGreaterThanOrEqual(1);
    const ids = json.data.map((k: { id: number }) => k.id);
    expect(ids).toContain(matchId);
  });

  // ---------------------------------------------------------------------------
  // HIGHLIGHT_06 — hidden / soft-deleted excluded
  // ---------------------------------------------------------------------------
  it("HIGHLIGHT_06: hidden and soft-deleted Kudos are excluded", async () => {
    const admin = getTestAdminClient();
    const visibleId = await createKudo(callerCookie, {
      recipientId,
      titleId,
      body: "visible",
      hashtagId,
    });
    await addHeart(visibleId, likerId);
    const hiddenId = await createKudo(callerCookie, {
      recipientId,
      titleId,
      body: "hidden",
      hashtagId,
    });
    await addHeart(hiddenId, likerId);
    const deletedId = await createKudo(callerCookie, {
      recipientId,
      titleId,
      body: "deleted",
      hashtagId,
    });
    await addHeart(deletedId, likerId);

    await admin.from("kudos").update({ status: "hidden" }).eq("id", hiddenId);
    await admin
      .from("kudos")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", deletedId);

    const res = await authedFetch("/api/kudos/highlight", callerCookie);
    const json = await res.json();
    const ids = json.data.map((k: { id: number }) => k.id);
    expect(ids).toContain(visibleId);
    expect(ids).not.toContain(hiddenId);
    expect(ids).not.toContain(deletedId);
  });

  // ---------------------------------------------------------------------------
  // HIGHLIGHT_07 — anonymous masking
  // ---------------------------------------------------------------------------
  it("HIGHLIGHT_07: anonymous Kudos mask sender name + avatar", async () => {
    const aliasId = await createKudo(callerCookie, {
      recipientId,
      titleId,
      body: "anon with alias",
      hashtagId,
      isAnonymous: true,
      anonymousAlias: "Người bí ẩn",
    });
    await addHeart(aliasId, likerId);
    const fallbackId = await createKudo(callerCookie, {
      recipientId,
      titleId,
      body: "anon no alias",
      hashtagId,
      isAnonymous: true,
    });
    await addHeart(fallbackId, likerId);

    const res = await authedFetch("/api/kudos/highlight", callerCookie);
    const json = await res.json();
    const alias = json.data.find(
      (k: { bodyPlain: string }) => k.bodyPlain === "anon with alias",
    );
    const fallback = json.data.find(
      (k: { bodyPlain: string }) => k.bodyPlain === "anon no alias",
    );
    expect(alias.senderName).toBe("Người bí ẩn");
    expect(alias.senderAvatarUrl).toBeNull();
    expect(fallback.senderName).toBe("Ẩn danh");
    expect(fallback.senderAvatarUrl).toBeNull();
  });

  // ---------------------------------------------------------------------------
  // HIGHLIGHT_08 — heart fields present
  // ---------------------------------------------------------------------------
  it("HIGHLIGHT_08: every card carries heartCount / heartedByMe / canHeart", async () => {
    const id = await createKudo(callerCookie, {
      recipientId,
      titleId,
      body: "heart fields",
      hashtagId,
    });
    await addHeart(id, likerId);
    const res = await authedFetch("/api/kudos/highlight", callerCookie);
    const json = await res.json();
    expect(json.data.length).toBeGreaterThan(0);
    for (const k of json.data) {
      expect(typeof k.heartCount).toBe("number");
      expect(typeof k.heartedByMe).toBe("boolean");
      expect(typeof k.canHeart).toBe("boolean");
    }
  });

  // ---------------------------------------------------------------------------
  // HIGHLIGHT_09 — heartedByMe reflects caller likes
  // ---------------------------------------------------------------------------
  it("HIGHLIGHT_09: heartedByMe is true only for kudos the caller has liked", async () => {
    const r2Cookie = (await signInAsEmail(RECIPIENT_EMAIL)).cookieHeader;
    // recipient authors a Kudo to caller so caller can like it
    const callerIdSelf = callerId;
    const selfRecipientRes = await authedFetch("/api/kudos", r2Cookie, {
      method: "POST",
      body: JSON.stringify({
        recipientId: callerIdSelf,
        titleId,
        body: plainBody("for caller"),
        hashtags: [{ id: hashtagId }],
      }),
    });
    const selfRecipient = await selfRecipientRes.json();
    const kudoId = selfRecipient.data.id as number;

    await addHeart(kudoId, callerId);

    const res = await authedFetch("/api/kudos/highlight", callerCookie);
    const json = await res.json();
    const liked = json.data.find((k: { id: number }) => k.id === kudoId);
    expect(liked).toBeDefined();
    expect(liked.heartedByMe).toBe(true);
    expect(liked.heartCount).toBeGreaterThanOrEqual(1);
  });

  // ---------------------------------------------------------------------------
  // HIGHLIGHT_10 — canHeart=false on caller's own Kudo
  // ---------------------------------------------------------------------------
  it("HIGHLIGHT_10: canHeart=false on Kudos authored by the caller", async () => {
    const id = await createKudo(callerCookie, {
      recipientId,
      titleId,
      body: "own kudo",
      hashtagId,
    });
    await addHeart(id, likerId);
    const res = await authedFetch("/api/kudos/highlight", callerCookie);
    const json = await res.json();
    const own = json.data.find(
      (k: { bodyPlain: string }) => k.bodyPlain === "own kudo",
    );
    expect(own).toBeDefined();
    expect(own.canHeart).toBe(false);
  });

  // ---------------------------------------------------------------------------
  // HIGHLIGHT_11 — empty result
  // ---------------------------------------------------------------------------
  it("HIGHLIGHT_11: empty Kudo set returns data=[]", async () => {
    const res = await authedFetch("/api/kudos/highlight", callerCookie);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data).toEqual([]);
  });

  // ---------------------------------------------------------------------------
  // HIGHLIGHT_12 — auth
  // ---------------------------------------------------------------------------
  it("HIGHLIGHT_12: unauthenticated caller returns 401", async () => {
    const res = await fetch(
      `${process.env.INTEGRATION_BASE_URL ?? "http://localhost:3000"}/api/kudos/highlight`,
    );
    expect(res.status).toBe(401);
  });
});
