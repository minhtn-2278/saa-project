import { beforeEach, describe, expect, it } from "vitest";
import {
  authedFetch,
  runIntegration,
  signInAsEmail,
} from "./_test-utils";
import { resetKudoState } from "../_helpers/db";

const CALLER_EMAIL = "tran.nhat.minh@sun-asterisk.com";

describe.skipIf(!runIntegration)("POST /api/uploads", () => {
  let cookie: string;

  beforeEach(async () => {
    await resetKudoState();
    const c = await signInAsEmail(CALLER_EMAIL);
    cookie = c.cookieHeader;
  });

  it("UPLOAD_01: valid JPG metadata → 201 with signed upload URL", async () => {
    const res = await authedFetch("/api/uploads", cookie, {
      method: "POST",
      body: JSON.stringify({
        fileName: "cat.jpg",
        mimeType: "image/jpeg",
        byteSize: 1200 * 1024,
      }),
    });
    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.data).toMatchObject({
      mimeType: "image/jpeg",
      byteSize: 1200 * 1024,
    });
    expect(typeof json.data.uploadUrl).toBe("string");
    expect(typeof json.data.id).toBe("number");
  });

  it("UPLOAD_05: 5 MB + 1 byte → 422 (zod size cap)", async () => {
    const res = await authedFetch("/api/uploads", cookie, {
      method: "POST",
      body: JSON.stringify({
        fileName: "big.jpg",
        mimeType: "image/jpeg",
        byteSize: 5 * 1024 * 1024 + 1,
      }),
    });
    expect([413, 422]).toContain(res.status);
  });

  it("UPLOAD_06: 0-byte file → 422", async () => {
    const res = await authedFetch("/api/uploads", cookie, {
      method: "POST",
      body: JSON.stringify({
        fileName: "zero.jpg",
        mimeType: "image/jpeg",
        byteSize: 0,
      }),
    });
    expect(res.status).toBe(422);
  });

  it("UPLOAD_07: PDF mimeType rejected → 422", async () => {
    const res = await authedFetch("/api/uploads", cookie, {
      method: "POST",
      body: JSON.stringify({
        fileName: "doc.pdf",
        mimeType: "application/pdf",
        byteSize: 100,
      }),
    });
    expect(res.status).toBe(422);
  });

  it("UPLOAD_13: no auth → 401", async () => {
    const res = await fetch("http://localhost:3000/api/uploads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fileName: "x.jpg",
        mimeType: "image/jpeg",
        byteSize: 10,
      }),
    });
    expect(res.status).toBe(401);
  });
});
