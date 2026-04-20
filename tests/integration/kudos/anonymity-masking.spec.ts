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
 * SC-004: anonymous submissions MUST NOT leak the author's identity on the
 * public `/api/kudos` feed. The handler stores `author_id` for moderation
 * but `serializeKudo` masks it away.
 */

const AUTHOR_EMAIL = "tran.nhat.minh@sun-asterisk.com";
const VIEWER_EMAIL = "nguyen.thi.an@sun-asterisk.com";
const RECIPIENT_EMAIL = "pham.van.bach@sun-asterisk.com";

describe.skipIf(!runIntegration)("SC-004: anonymity masking", () => {
  let authorCookie: string;
  let viewerCookie: string;
  let recipientId: number;
  let titleId: number;
  let hashtagId: number;

  beforeEach(async () => {
    await resetKudoState();
    const a = await signInAsEmail(AUTHOR_EMAIL);
    authorCookie = a.cookieHeader;
    const v = await signInAsEmail(VIEWER_EMAIL);
    viewerCookie = v.cookieHeader;
    const r = await getEmployeeIdByEmail(RECIPIENT_EMAIL);
    if (!r) throw new Error("seed missing recipient");
    recipientId = r;

    const admin = getTestAdminClient();
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

  it("viewer never sees author_id or senderAvatarUrl on an anonymous kudo", async () => {
    const admin = getTestAdminClient();
    const authorId = await getEmployeeIdByEmail(AUTHOR_EMAIL);

    const postRes = await authedFetch("/api/kudos", authorCookie, {
      method: "POST",
      body: JSON.stringify({
        recipientId,
        titleId,
        body: plainBody("ẩn danh"),
        hashtags: [{ id: hashtagId }],
        isAnonymous: true,
        anonymousAlias: "Thỏ",
      }),
    });
    expect(postRes.status).toBe(201);
    const created = await postRes.json();
    const kudoId = created.data.id;

    // DB retains author_id.
    const { data: row } = await admin
      .from("kudos")
      .select("author_id, is_anonymous")
      .eq("id", kudoId)
      .maybeSingle();
    expect(row?.author_id).toBe(authorId);
    expect(row?.is_anonymous).toBe(true);

    // Viewer fetches the board feed.
    const listRes = await authedFetch("/api/kudos", viewerCookie);
    const list = await listRes.json();
    const found = list.data.find(
      (k: { id: number }) => k.id === kudoId,
    );
    expect(found).toBeTruthy();
    expect(found.isAnonymous).toBe(true);
    expect(found.senderName).toBe("Thỏ");
    expect(found.senderAvatarUrl).toBeNull();
    // author_id MUST NEVER appear on the wire.
    expect(JSON.stringify(found)).not.toContain(`"author_id"`);
  });
});
