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
 * Integration tests for `POST /api/kudos/[id]/like` and
 * `DELETE /api/kudos/[id]/like` (plan.md § T068, T069).
 *
 * Contracts:
 *   - Both endpoints return `{data: {kudoId, heartCount, heartedByMe}}`
 *     reflecting post-operation state for optimistic UI reconciliation.
 *   - POST is idempotent via the `(kudo_id, employee_id)` PK on `kudo_hearts`.
 *   - DELETE is idempotent (0-row delete is not an error).
 *   - `kudos.author_id === caller.id` → 403 SELF_LIKE_FORBIDDEN on POST only.
 *   - Missing / soft-deleted / `status = 'hidden'` Kudos return 404.
 *
 * Gated behind `RUN_INTEGRATION_TESTS=true` (same as every other HTTP-level
 * integration spec — needs the Next.js dev server and the Supabase test
 * project).
 */

const CALLER_EMAIL = "tran.nhat.minh-b@sun-asterisk.com";
const AUTHOR_EMAIL = "nguyen.thi.an@sun-asterisk.com";
const THIRD_EMAIL = "le.minh.chau@sun-asterisk.com";

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

async function addHeart(kudoId: number, employeeId: number): Promise<void> {
  const admin = getTestAdminClient();
  const { error } = await admin
    .from("kudo_hearts")
    .insert({ kudo_id: kudoId, employee_id: employeeId });
  if (error && error.code !== "23505") {
    throw new Error(`addHeart: ${error.message}`);
  }
}

async function countHearts(kudoId: number): Promise<number> {
  const admin = getTestAdminClient();
  const { count, error } = await admin
    .from("kudo_hearts")
    .select("*", { count: "exact", head: true })
    .eq("kudo_id", kudoId);
  if (error) throw new Error(`countHearts: ${error.message}`);
  return count ?? 0;
}

describe.skipIf(!runIntegration)("POST|DELETE /api/kudos/[id]/like", () => {
  let callerCookie: string;
  let callerId: number;
  let authorCookie: string;
  let authorId: number;
  let thirdId: number;
  let titleId: number;
  let hashtagId: number;

  beforeEach(async () => {
    await resetKudoState();
    const admin = getTestAdminClient();

    const c = await signInAsEmail(CALLER_EMAIL);
    callerCookie = c.cookieHeader;
    callerId = c.employeeId;

    const a = await signInAsEmail(AUTHOR_EMAIL);
    authorCookie = a.cookieHeader;
    authorId = a.employeeId;

    const t = await getEmployeeIdByEmail(THIRD_EMAIL);
    if (!t) throw new Error("seed missing third employee");
    thirdId = t;

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
  // LIKE_POST_01 — first-time like by non-author
  // ---------------------------------------------------------------------------
  it("LIKE_POST_01: first-time like increments heartCount and sets heartedByMe=true", async () => {
    // Author creates the Kudo; caller (different employee) likes it.
    const kudoId = await createKudo(authorCookie, {
      recipientId: callerId,
      titleId,
      hashtagId,
      body: "thanks",
    });
    const before = await countHearts(kudoId);

    const res = await authedFetch(`/api/kudos/${kudoId}/like`, callerCookie, {
      method: "POST",
    });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data).toMatchObject({
      kudoId,
      heartCount: before + 1,
      heartedByMe: true,
    });
  });

  // ---------------------------------------------------------------------------
  // LIKE_POST_02 — idempotent re-like
  // ---------------------------------------------------------------------------
  it("LIKE_POST_02: re-liking is idempotent (no duplicate row, count unchanged)", async () => {
    const kudoId = await createKudo(authorCookie, {
      recipientId: callerId,
      titleId,
      hashtagId,
      body: "idempotent",
    });
    await addHeart(kudoId, callerId);
    const before = await countHearts(kudoId);

    const res = await authedFetch(`/api/kudos/${kudoId}/like`, callerCookie, {
      method: "POST",
    });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data).toMatchObject({
      kudoId,
      heartCount: before,
      heartedByMe: true,
    });
    expect(await countHearts(kudoId)).toBe(before);
  });

  // ---------------------------------------------------------------------------
  // LIKE_POST_03 — self-like forbidden (403)
  // ---------------------------------------------------------------------------
  it("LIKE_POST_03: caller = author returns 403 SELF_LIKE_FORBIDDEN", async () => {
    // Caller creates their own Kudo, then tries to like it.
    const kudoId = await createKudo(callerCookie, {
      recipientId: authorId,
      titleId,
      hashtagId,
      body: "mine",
    });

    const res = await authedFetch(`/api/kudos/${kudoId}/like`, callerCookie, {
      method: "POST",
    });
    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json.error.code).toBe("SELF_LIKE_FORBIDDEN");
    // No row created.
    expect(await countHearts(kudoId)).toBe(0);
  });

  // ---------------------------------------------------------------------------
  // LIKE_POST_04 — kudo id does not exist
  // ---------------------------------------------------------------------------
  it("LIKE_POST_04: non-existent kudo returns 404 NOT_FOUND", async () => {
    const res = await authedFetch(`/api/kudos/999999999/like`, callerCookie, {
      method: "POST",
    });
    expect(res.status).toBe(404);
    const json = await res.json();
    expect(json.error.code).toBe("NOT_FOUND");
  });

  // ---------------------------------------------------------------------------
  // LIKE_POST_05 — soft-deleted kudo returns 404
  // ---------------------------------------------------------------------------
  it("LIKE_POST_05: soft-deleted kudo returns 404", async () => {
    const kudoId = await createKudo(authorCookie, {
      recipientId: callerId,
      titleId,
      hashtagId,
      body: "to-delete",
    });
    const admin = getTestAdminClient();
    await admin
      .from("kudos")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", kudoId);

    const res = await authedFetch(`/api/kudos/${kudoId}/like`, callerCookie, {
      method: "POST",
    });
    expect(res.status).toBe(404);
  });

  // ---------------------------------------------------------------------------
  // LIKE_POST_06 — hidden kudo returns 404 (Q-P3 unified)
  // ---------------------------------------------------------------------------
  it("LIKE_POST_06: status=hidden kudo returns 404", async () => {
    const kudoId = await createKudo(authorCookie, {
      recipientId: callerId,
      titleId,
      hashtagId,
      body: "hidden",
    });
    const admin = getTestAdminClient();
    await admin.from("kudos").update({ status: "hidden" }).eq("id", kudoId);

    const res = await authedFetch(`/api/kudos/${kudoId}/like`, callerCookie, {
      method: "POST",
    });
    expect(res.status).toBe(404);
  });

  // ---------------------------------------------------------------------------
  // LIKE_POST_07 — id = 0 → validation error
  // ---------------------------------------------------------------------------
  it("LIKE_POST_07: id=0 returns 422 VALIDATION_ERROR", async () => {
    const res = await authedFetch(`/api/kudos/0/like`, callerCookie, {
      method: "POST",
    });
    expect(res.status).toBe(422);
  });

  // ---------------------------------------------------------------------------
  // LIKE_POST_08 — non-numeric id → validation error
  // ---------------------------------------------------------------------------
  it("LIKE_POST_08: non-numeric id returns 422 VALIDATION_ERROR", async () => {
    const res = await authedFetch(`/api/kudos/abc/like`, callerCookie, {
      method: "POST",
    });
    expect(res.status).toBe(422);
  });

  // ---------------------------------------------------------------------------
  // LIKE_POST_09 — auth required
  // ---------------------------------------------------------------------------
  it("LIKE_POST_09: unauthenticated caller returns 401", async () => {
    const kudoId = await createKudo(authorCookie, {
      recipientId: callerId,
      titleId,
      hashtagId,
      body: "need-auth",
    });
    // No cookie header.
    const res = await fetch(
      `${process.env.INTEGRATION_BASE_URL ?? "http://localhost:3000"}/api/kudos/${kudoId}/like`,
      { method: "POST" },
    );
    expect(res.status).toBe(401);
  });

  // ---------------------------------------------------------------------------
  // LIKE_POST_10 — race: concurrent double-click
  // ---------------------------------------------------------------------------
  it("LIKE_POST_10: concurrent POSTs both succeed with the same post-state count", async () => {
    const kudoId = await createKudo(authorCookie, {
      recipientId: callerId,
      titleId,
      hashtagId,
      body: "race",
    });
    const before = await countHearts(kudoId);

    const [r1, r2] = await Promise.all([
      authedFetch(`/api/kudos/${kudoId}/like`, callerCookie, { method: "POST" }),
      authedFetch(`/api/kudos/${kudoId}/like`, callerCookie, { method: "POST" }),
    ]);
    expect(r1.status).toBe(200);
    expect(r2.status).toBe(200);
    const [j1, j2] = await Promise.all([r1.json(), r2.json()]);
    expect(j1.data.heartCount).toBe(before + 1);
    expect(j2.data.heartCount).toBe(before + 1);
    expect(await countHearts(kudoId)).toBe(before + 1);
  });

  // ---------------------------------------------------------------------------
  // LIKE_POST_11 — count increments accurately across distinct users
  // ---------------------------------------------------------------------------
  it("LIKE_POST_11: distinct users each add exactly 1 heart", async () => {
    const kudoId = await createKudo(authorCookie, {
      recipientId: callerId,
      titleId,
      hashtagId,
      body: "multi",
    });
    const before = await countHearts(kudoId);

    const r1 = await authedFetch(`/api/kudos/${kudoId}/like`, callerCookie, {
      method: "POST",
    });
    expect(r1.status).toBe(200);
    expect((await r1.json()).data.heartCount).toBe(before + 1);

    // Third employee likes via admin to sidestep a second sign-in hop.
    await addHeart(kudoId, thirdId);
    expect(await countHearts(kudoId)).toBe(before + 2);
  });

  // ---------------------------------------------------------------------------
  // LIKE_DEL_01 — un-like after a like
  // ---------------------------------------------------------------------------
  it("LIKE_DEL_01: un-like decrements heartCount and sets heartedByMe=false", async () => {
    const kudoId = await createKudo(authorCookie, {
      recipientId: callerId,
      titleId,
      hashtagId,
      body: "unlike",
    });
    await addHeart(kudoId, callerId);
    const before = await countHearts(kudoId);

    const res = await authedFetch(`/api/kudos/${kudoId}/like`, callerCookie, {
      method: "DELETE",
    });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data).toMatchObject({
      kudoId,
      heartCount: before - 1,
      heartedByMe: false,
    });
  });

  // ---------------------------------------------------------------------------
  // LIKE_DEL_02 — idempotent no-op (never liked)
  // ---------------------------------------------------------------------------
  it("LIKE_DEL_02: un-like when no row exists is a no-op (200, unchanged)", async () => {
    const kudoId = await createKudo(authorCookie, {
      recipientId: callerId,
      titleId,
      hashtagId,
      body: "noop",
    });
    const before = await countHearts(kudoId);

    const res = await authedFetch(`/api/kudos/${kudoId}/like`, callerCookie, {
      method: "DELETE",
    });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data).toMatchObject({
      kudoId,
      heartCount: before,
      heartedByMe: false,
    });
  });

  // ---------------------------------------------------------------------------
  // LIKE_DEL_03 — kudo not found
  // ---------------------------------------------------------------------------
  it("LIKE_DEL_03: non-existent kudo returns 404", async () => {
    const res = await authedFetch(`/api/kudos/999999999/like`, callerCookie, {
      method: "DELETE",
    });
    expect(res.status).toBe(404);
  });

  // ---------------------------------------------------------------------------
  // LIKE_DEL_04 — soft-deleted kudo returns 404
  // ---------------------------------------------------------------------------
  it("LIKE_DEL_04: soft-deleted kudo returns 404", async () => {
    const kudoId = await createKudo(authorCookie, {
      recipientId: callerId,
      titleId,
      hashtagId,
      body: "sd",
    });
    const admin = getTestAdminClient();
    await admin
      .from("kudos")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", kudoId);

    const res = await authedFetch(`/api/kudos/${kudoId}/like`, callerCookie, {
      method: "DELETE",
    });
    expect(res.status).toBe(404);
  });

  // ---------------------------------------------------------------------------
  // LIKE_DEL_05 — auth required
  // ---------------------------------------------------------------------------
  it("LIKE_DEL_05: unauthenticated caller returns 401", async () => {
    const kudoId = await createKudo(authorCookie, {
      recipientId: callerId,
      titleId,
      hashtagId,
      body: "auth",
    });
    const res = await fetch(
      `${process.env.INTEGRATION_BASE_URL ?? "http://localhost:3000"}/api/kudos/${kudoId}/like`,
      { method: "DELETE" },
    );
    expect(res.status).toBe(401);
  });

  // ---------------------------------------------------------------------------
  // LIKE_DEL_06 — count never goes below 0
  // ---------------------------------------------------------------------------
  it("LIKE_DEL_06: un-liking twice floors heartCount at 0", async () => {
    const kudoId = await createKudo(authorCookie, {
      recipientId: callerId,
      titleId,
      hashtagId,
      body: "floor",
    });
    await addHeart(kudoId, callerId);

    const r1 = await authedFetch(`/api/kudos/${kudoId}/like`, callerCookie, {
      method: "DELETE",
    });
    expect((await r1.json()).data.heartCount).toBe(0);

    const r2 = await authedFetch(`/api/kudos/${kudoId}/like`, callerCookie, {
      method: "DELETE",
    });
    expect(r2.status).toBe(200);
    expect((await r2.json()).data.heartCount).toBe(0);
  });

  // ---------------------------------------------------------------------------
  // LIKE_DEL_07 — like then un-like back to initial state
  // ---------------------------------------------------------------------------
  it("LIKE_DEL_07: POST then DELETE leaves the kudo in its initial state", async () => {
    const kudoId = await createKudo(authorCookie, {
      recipientId: callerId,
      titleId,
      hashtagId,
      body: "loop",
    });
    const initial = await countHearts(kudoId);

    const r1 = await authedFetch(`/api/kudos/${kudoId}/like`, callerCookie, {
      method: "POST",
    });
    expect((await r1.json()).data.heartedByMe).toBe(true);
    const r2 = await authedFetch(`/api/kudos/${kudoId}/like`, callerCookie, {
      method: "DELETE",
    });
    const j2 = await r2.json();
    expect(j2.data.heartedByMe).toBe(false);
    expect(j2.data.heartCount).toBe(initial);
    expect(await countHearts(kudoId)).toBe(initial);
  });
});
