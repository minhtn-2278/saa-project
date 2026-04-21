import { describe, expect, it } from "vitest";
import {
  decodeCursor,
  encodeCursor,
  InvalidCursorError,
} from "@/lib/kudos/cursor";

describe("lib/kudos/cursor", () => {
  it("round-trips a valid (createdAt, id) tuple", () => {
    const input = { createdAt: "2026-04-21T12:34:56.000Z", id: 42 };
    const encoded = encodeCursor(input);
    expect(typeof encoded).toBe("string");
    expect(encoded.length).toBeGreaterThan(0);
    // Opaque — not human-readable JSON.
    expect(encoded).not.toContain("{");
    expect(encoded).not.toContain('"');
    expect(decodeCursor(encoded)).toEqual(input);
  });

  it("is URL-safe (no +, /, or = characters)", () => {
    const encoded = encodeCursor({
      createdAt: "2026-04-21T12:34:56.000Z",
      id: 999999,
    });
    expect(encoded).not.toMatch(/[+/=]/);
  });

  it("produces different cursors for different ids at the same timestamp", () => {
    const createdAt = "2026-04-21T12:34:56.000Z";
    const a = encodeCursor({ createdAt, id: 1 });
    const b = encodeCursor({ createdAt, id: 2 });
    expect(a).not.toBe(b);
    expect(decodeCursor(a).id).toBe(1);
    expect(decodeCursor(b).id).toBe(2);
  });

  it("rejects empty cursor", () => {
    expect(() => decodeCursor("")).toThrow(InvalidCursorError);
  });

  it("rejects non-base64 input", () => {
    expect(() => decodeCursor("!!!not-base64!!!")).toThrow(InvalidCursorError);
  });

  it("rejects a base64 payload that isn't a 2-tuple", () => {
    const notATuple = Buffer.from(
      JSON.stringify({ createdAt: "x", id: 1 }),
      "utf8",
    )
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
    expect(() => decodeCursor(notATuple)).toThrow(InvalidCursorError);
  });

  it("rejects an unparseable date", () => {
    const bad = Buffer.from(
      JSON.stringify(["not-a-date", 1]),
      "utf8",
    )
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
    expect(() => decodeCursor(bad)).toThrow(InvalidCursorError);
  });

  it("rejects non-positive ids on encode", () => {
    expect(() =>
      encodeCursor({ createdAt: "2026-04-21T00:00:00Z", id: 0 }),
    ).toThrow(InvalidCursorError);
    expect(() =>
      encodeCursor({ createdAt: "2026-04-21T00:00:00Z", id: -5 }),
    ).toThrow(InvalidCursorError);
    expect(() =>
      encodeCursor({ createdAt: "2026-04-21T00:00:00Z", id: 1.5 }),
    ).toThrow(InvalidCursorError);
  });

  it("rejects empty createdAt on encode", () => {
    expect(() => encodeCursor({ createdAt: "", id: 1 })).toThrow(
      InvalidCursorError,
    );
  });
});
