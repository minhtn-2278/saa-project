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

describe.skipIf(!runIntegration)("POST /api/kudos", () => {
  let callerCookie: string;
  let callerId: number;
  let recipientId: number;
  let titleId: number;
  let hashtagIds: number[];

  beforeEach(async () => {
    await resetKudoState();
    const admin = getTestAdminClient();

    const caller = await signInAsEmail(CALLER_EMAIL);
    callerCookie = caller.cookieHeader;
    callerId = caller.employeeId;

    const foundRecipient = await getEmployeeIdByEmail(RECIPIENT_EMAIL);
    if (!foundRecipient) throw new Error(`seed missing ${RECIPIENT_EMAIL}`);
    recipientId = foundRecipient;

    const { data: titles } = await admin
      .from("titles")
      .select("id")
      .is("deleted_at", null)
      .limit(1);
    if (!titles?.[0]) throw new Error("seed must contain at least 1 title");
    titleId = titles[0].id as number;

    const { data: hashtags } = await admin
      .from("hashtags")
      .select("id")
      .is("deleted_at", null)
      .limit(5);
    hashtagIds = (hashtags ?? []).map((h) => h.id as number);
    if (hashtagIds.length < 2) {
      throw new Error("seed must contain at least 2 hashtags");
    }
  });

  it("KUDO_CREATE_02: minimum valid payload → 201", async () => {
    const res = await authedFetch("/api/kudos", callerCookie, {
      method: "POST",
      body: JSON.stringify({
        recipientId,
        titleId,
        body: plainBody("Cám ơn đồng đội"),
        hashtags: [{ id: hashtagIds[0] }],
      }),
    });
    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.data).toMatchObject({
      recipientId,
      isAnonymous: false,
    });
    expect(json.data.id).toBeTypeOf("number");
  });

  it("KUDO_CREATE_01: full valid payload w/ 2 hashtags → 201", async () => {
    const res = await authedFetch("/api/kudos", callerCookie, {
      method: "POST",
      body: JSON.stringify({
        recipientId,
        titleId,
        body: plainBody("Cám ơn cả nhà"),
        hashtags: [{ id: hashtagIds[0] }, { id: hashtagIds[1] }],
      }),
    });
    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.data.hashtags).toHaveLength(2);
  });

  it("KUDO_CREATE_05: boundary — exactly 5 hashtags → 201", async () => {
    if (hashtagIds.length < 5) {
      return; // seed-dependent skip
    }
    const res = await authedFetch("/api/kudos", callerCookie, {
      method: "POST",
      body: JSON.stringify({
        recipientId,
        titleId,
        body: plainBody("Năm hashtag"),
        hashtags: hashtagIds.slice(0, 5).map((id) => ({ id })),
      }),
    });
    expect(res.status).toBe(201);
  });

  it("KUDO_CREATE_06: missing recipientId → 422", async () => {
    const res = await authedFetch("/api/kudos", callerCookie, {
      method: "POST",
      body: JSON.stringify({
        titleId,
        body: plainBody("x"),
        hashtags: [{ id: hashtagIds[0] }],
      }),
    });
    expect(res.status).toBe(422);
    const json = await res.json();
    expect(json.error.code).toBe("VALIDATION_ERROR");
    expect(json.error.details.recipientId).toBeDefined();
  });

  it("KUDO_CREATE_07: missing both titleId and titleName → 422", async () => {
    const res = await authedFetch("/api/kudos", callerCookie, {
      method: "POST",
      body: JSON.stringify({
        recipientId,
        body: plainBody("no title"),
        hashtags: [{ id: hashtagIds[0] }],
      }),
    });
    expect(res.status).toBe(422);
    const json = await res.json();
    expect(json.error.code).toBe("VALIDATION_ERROR");
  });

  it("KUDO_CREATE_08: empty body → 422", async () => {
    const res = await authedFetch("/api/kudos", callerCookie, {
      method: "POST",
      body: JSON.stringify({
        recipientId,
        titleId,
        body: { type: "doc", content: [] },
        hashtags: [{ id: hashtagIds[0] }],
      }),
    });
    expect(res.status).toBe(422);
  });

  it("KUDO_CREATE_09: zero hashtags → 422", async () => {
    const res = await authedFetch("/api/kudos", callerCookie, {
      method: "POST",
      body: JSON.stringify({
        recipientId,
        titleId,
        body: plainBody("hi"),
        hashtags: [],
      }),
    });
    expect(res.status).toBe(422);
  });

  it("KUDO_CREATE_12: duplicate hashtag ids → 422", async () => {
    const res = await authedFetch("/api/kudos", callerCookie, {
      method: "POST",
      body: JSON.stringify({
        recipientId,
        titleId,
        body: plainBody("hi"),
        hashtags: [{ id: hashtagIds[0] }, { id: hashtagIds[0] }],
      }),
    });
    expect(res.status).toBe(422);
  });

  it("KUDO_CREATE_13: self-Kudo → 422", async () => {
    const res = await authedFetch("/api/kudos", callerCookie, {
      method: "POST",
      body: JSON.stringify({
        recipientId: callerId,
        titleId,
        body: plainBody("hi"),
        hashtags: [{ id: hashtagIds[0] }],
      }),
    });
    expect(res.status).toBe(422);
    const json = await res.json();
    expect(json.error.details.recipientId).toBeDefined();
  });

  it("KUDO_CREATE_15: nonexistent recipient → 422", async () => {
    const res = await authedFetch("/api/kudos", callerCookie, {
      method: "POST",
      body: JSON.stringify({
        recipientId: 999999,
        titleId,
        body: plainBody("hi"),
        hashtags: [{ id: hashtagIds[0] }],
      }),
    });
    expect(res.status).toBe(422);
  });

  it("KUDO_CREATE_23: no auth → 401", async () => {
    const res = await fetch("http://localhost:3000/api/kudos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        recipientId,
        titleId,
        body: plainBody("hi"),
        hashtags: [{ id: hashtagIds[0] }],
      }),
    });
    expect(res.status).toBe(401);
  });

  it("KUDO_CREATE_14: deactivated recipient → 422", async () => {
    const admin = getTestAdminClient();
    const { data: deactivated } = await admin
      .from("employees")
      .select("id")
      .not("deleted_at", "is", null)
      .limit(1)
      .maybeSingle();
    if (!deactivated?.id) return; // seed skip
    const res = await authedFetch("/api/kudos", callerCookie, {
      method: "POST",
      body: JSON.stringify({
        recipientId: deactivated.id,
        titleId,
        body: plainBody("hi"),
        hashtags: [{ id: hashtagIds[0] }],
      }),
    });
    expect(res.status).toBe(422);
  });

  // ---------------------------------------------------------------------------
  // Phase 4 (US2) — T092: mentions + body sanitisation
  // ---------------------------------------------------------------------------

  it("KUDO_CREATE_04: body with @mention → mentions persisted", async () => {
    // Pick a valid mention target different from caller + recipient.
    const admin = getTestAdminClient();
    const { data: third } = await admin
      .from("employees")
      .select("id, full_name")
      .neq("id", recipientId)
      .neq("id", callerId)
      .is("deleted_at", null)
      .limit(1)
      .maybeSingle();
    if (!third?.id) return;

    const body = {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [
            { type: "text", text: "Cám ơn " },
            { type: "mention", attrs: { id: third.id, label: third.full_name } },
          ],
        },
      ],
    };

    const res = await authedFetch("/api/kudos", callerCookie, {
      method: "POST",
      body: JSON.stringify({
        recipientId,
        titleId,
        body,
        hashtags: [{ id: hashtagIds[0] }],
      }),
    });
    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.data.mentions.map((m: { id: number }) => m.id)).toContain(
      third.id,
    );
  });

  it("KUDO_CREATE_20: body with <script> node → stripped, kudo created 201", async () => {
    const body = {
      type: "doc",
      content: [
        { type: "script", content: [{ type: "text", text: "alert(1)" }] },
        { type: "paragraph", content: [{ type: "text", text: "safe" }] },
      ],
    };
    const res = await authedFetch("/api/kudos", callerCookie, {
      method: "POST",
      body: JSON.stringify({
        recipientId,
        titleId,
        body,
        hashtags: [{ id: hashtagIds[0] }],
      }),
    });
    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.data.bodyPlain).toBe("safe");
  });

  it("KUDO_CREATE_21: body is a plain string → 422", async () => {
    const res = await authedFetch("/api/kudos", callerCookie, {
      method: "POST",
      body: JSON.stringify({
        recipientId,
        titleId,
        body: "just a string",
        hashtags: [{ id: hashtagIds[0] }],
      }),
    });
    expect(res.status).toBe(422);
  });

  it("KUDO_CREATE_22: body_plain > 5000 chars → 422", async () => {
    const longText = "a".repeat(5001);
    const res = await authedFetch("/api/kudos", callerCookie, {
      method: "POST",
      body: JSON.stringify({
        recipientId,
        titleId,
        body: plainBody(longText),
        hashtags: [{ id: hashtagIds[0] }],
      }),
    });
    expect(res.status).toBe(422);
  });

  it("KUDO_CREATE_11: 6 imageIds → 422", async () => {
    const res = await authedFetch("/api/kudos", callerCookie, {
      method: "POST",
      body: JSON.stringify({
        recipientId,
        titleId,
        body: plainBody("hi"),
        hashtags: [{ id: hashtagIds[0] }],
        imageIds: [1, 2, 3, 4, 5, 6],
      }),
    });
    expect(res.status).toBe(422);
  });

  // ---------------------------------------------------------------------------
  // Phase 5 (US3) — T108: inline-create + T109: anonymous
  // ---------------------------------------------------------------------------

  it("KUDO_CREATE_04a: inline-create titleName → new title row", async () => {
    const admin = getTestAdminClient();
    const name = `E2E Title ${Date.now()}`;

    const res = await authedFetch("/api/kudos", callerCookie, {
      method: "POST",
      body: JSON.stringify({
        recipientId,
        titleName: name,
        body: plainBody("hi"),
        hashtags: [{ id: hashtagIds[0] }],
      }),
    });
    expect(res.status).toBe(201);

    const { data: row } = await admin
      .from("titles")
      .select("id, name")
      .eq("name", name)
      .maybeSingle();
    expect(row).toBeTruthy();
    expect(row!.name).toBe(name);
  });

  it("KUDO_CREATE_04b: inline-create hashtag {label} → new hashtag row", async () => {
    const admin = getTestAdminClient();
    const label = `tag_${Date.now().toString(36)}`;

    const res = await authedFetch("/api/kudos", callerCookie, {
      method: "POST",
      body: JSON.stringify({
        recipientId,
        titleId,
        body: plainBody("hi"),
        hashtags: [{ label }],
      }),
    });
    expect(res.status).toBe(201);

    const { data: row } = await admin
      .from("hashtags")
      .select("id, label, slug, usage_count")
      .eq("label", label)
      .maybeSingle();
    expect(row).toBeTruthy();
    expect(row!.slug).toBe(label);
    expect(row!.usage_count).toBeGreaterThanOrEqual(1);
  });

  it("KUDO_CREATE_16a: titleName too short → 422", async () => {
    const res = await authedFetch("/api/kudos", callerCookie, {
      method: "POST",
      body: JSON.stringify({
        recipientId,
        titleName: "A",
        body: plainBody("hi"),
        hashtags: [{ id: hashtagIds[0] }],
      }),
    });
    expect(res.status).toBe(422);
  });

  it("KUDO_CREATE_17a: hashtag label invalid charset → 422", async () => {
    const res = await authedFetch("/api/kudos", callerCookie, {
      method: "POST",
      body: JSON.stringify({
        recipientId,
        titleId,
        body: plainBody("hi"),
        hashtags: [{ label: "team work!" }],
      }),
    });
    expect(res.status).toBe(422);
  });

  it("KUDO_CREATE_03: anonymous submit with alias → persisted + masked", async () => {
    const res = await authedFetch("/api/kudos", callerCookie, {
      method: "POST",
      body: JSON.stringify({
        recipientId,
        titleId,
        body: plainBody("cám ơn ẩn danh"),
        hashtags: [{ id: hashtagIds[0] }],
        isAnonymous: true,
        anonymousAlias: "Thỏ 7 màu",
      }),
    });
    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.data.isAnonymous).toBe(true);
    expect(json.data.senderName).toBe("Thỏ 7 màu");
    expect(json.data.senderAvatarUrl).toBeNull();
  });

  it("KUDO_CREATE_19a: anonymousAlias > 60 chars → 422", async () => {
    const res = await authedFetch("/api/kudos", callerCookie, {
      method: "POST",
      body: JSON.stringify({
        recipientId,
        titleId,
        body: plainBody("hi"),
        hashtags: [{ id: hashtagIds[0] }],
        isAnonymous: true,
        anonymousAlias: "a".repeat(61),
      }),
    });
    expect(res.status).toBe(422);
  });

  it("KUDO_CREATE_19b: anonymousAlias with isAnonymous=false → 422", async () => {
    const res = await authedFetch("/api/kudos", callerCookie, {
      method: "POST",
      body: JSON.stringify({
        recipientId,
        titleId,
        body: plainBody("hi"),
        hashtags: [{ id: hashtagIds[0] }],
        isAnonymous: false,
        anonymousAlias: "Thỏ",
      }),
    });
    expect(res.status).toBe(422);
  });
});
