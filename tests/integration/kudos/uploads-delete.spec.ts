import { beforeEach, describe, expect, it } from "vitest";
import {
  authedFetch,
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

describe.skipIf(!runIntegration)("DELETE /api/uploads/[id]", () => {
  let cookie: string;
  let callerId: number;

  beforeEach(async () => {
    await resetKudoState();
    const c = await signInAsEmail(CALLER_EMAIL);
    cookie = c.cookieHeader;
    callerId = c.employeeId;
  });

  async function seedUpload(ownerId: number): Promise<number> {
    const admin = getTestAdminClient();
    const { data, error } = await admin
      .from("uploads")
      .insert({
        owner_id: ownerId,
        storage_key: `${ownerId}/test-${Date.now()}.jpg`,
        mime_type: "image/jpeg",
        byte_size: 1024,
      })
      .select("id")
      .single();
    if (error || !data) throw new Error(`seedUpload: ${error?.message}`);
    return data.id as number;
  }

  it("UPLOAD_DEL_01: owner deletes own unattached upload → 204", async () => {
    const id = await seedUpload(callerId);
    const res = await authedFetch(`/api/uploads/${id}`, cookie, {
      method: "DELETE",
    });
    expect(res.status).toBe(204);
  });

  it("UPLOAD_DEL_02: not found → 404", async () => {
    const res = await authedFetch("/api/uploads/999999", cookie, {
      method: "DELETE",
    });
    expect(res.status).toBe(404);
  });

  it("UPLOAD_DEL_03: not owner → 403", async () => {
    const otherId = await getEmployeeIdByEmail(OTHER_EMAIL);
    if (!otherId) return;
    const id = await seedUpload(otherId);
    const res = await authedFetch(`/api/uploads/${id}`, cookie, {
      method: "DELETE",
    });
    expect(res.status).toBe(403);
  });

  it("UPLOAD_DEL_06: no auth → 401", async () => {
    const res = await fetch("http://localhost:3000/api/uploads/1", {
      method: "DELETE",
    });
    expect(res.status).toBe(401);
  });
});
