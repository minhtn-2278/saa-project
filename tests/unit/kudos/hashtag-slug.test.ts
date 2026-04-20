import { describe, it, expect } from "vitest";
import {
  hashtagSlug,
  titleSlug,
  validateHashtagLabel,
} from "@/lib/kudos/hashtag-slug";

describe("validateHashtagLabel", () => {
  it("accepts a simple lowercase label", () => {
    expect(validateHashtagLabel("teamwork")).toBeNull();
  });

  it("accepts underscore + digits", () => {
    expect(validateHashtagLabel("saa_2025")).toBeNull();
  });

  it("accepts Vietnamese unicode letters", () => {
    expect(validateHashtagLabel("camơn")).toBeNull();
    expect(validateHashtagLabel("truyền_động_lực")).toBeNull();
  });

  it("rejects whitespace", () => {
    expect(validateHashtagLabel("team work")).toBe("charset");
  });

  it("rejects `#` prefix", () => {
    expect(validateHashtagLabel("#teamwork")).toBe("charset");
  });

  it("rejects other punctuation", () => {
    expect(validateHashtagLabel("team-work")).toBe("charset");
    expect(validateHashtagLabel("team.work")).toBe("charset");
    expect(validateHashtagLabel("team!")).toBe("charset");
  });

  it("rejects labels shorter than 2 chars", () => {
    expect(validateHashtagLabel("a")).toBe("charset");
    expect(validateHashtagLabel("")).toBe("charset");
  });

  it("rejects labels longer than 32 chars", () => {
    expect(validateHashtagLabel("a".repeat(33))).toBe("charset");
  });

  it("accepts exactly 2 and 32 chars (boundary)", () => {
    expect(validateHashtagLabel("ab")).toBeNull();
    expect(validateHashtagLabel("a".repeat(32))).toBeNull();
  });
});

describe("hashtagSlug", () => {
  it("lowercases while preserving diacritics (Unicode NFC)", () => {
    expect(hashtagSlug("TeamWork")).toBe("teamwork");
    expect(hashtagSlug("CảmƠn")).toBe("cảmơn");
  });

  it("trims leading/trailing whitespace before validation", () => {
    // The trim happens inside hashtagSlug; validator runs on trimmed value.
    expect(hashtagSlug("  teamwork  ")).toBe("teamwork");
  });

  it("normalises NFC so composed + decomposed collapse to the same slug", () => {
    // "ê" as a single NFC codepoint vs e + combining circumflex
    const composed = "cảmơn"; // NFC
    const decomposed = "c\u1ea3m\u01a1n"; // same but pre-composed already
    expect(hashtagSlug(composed)).toBe(hashtagSlug(decomposed));
  });

  it("throws on invalid charset", () => {
    expect(() => hashtagSlug("team work")).toThrow(/charset/);
    expect(() => hashtagSlug("#tag")).toThrow(/charset/);
  });
});

describe("titleSlug", () => {
  it("converts spaces to hyphens", () => {
    expect(titleSlug("Người truyền động lực cho tôi")).toBe(
      "người-truyền-động-lực-cho-tôi",
    );
  });

  it("preserves diacritics and lowercases", () => {
    expect(titleSlug("Ngôi sao của team")).toBe("ngôi-sao-của-team");
  });

  it("collapses consecutive whitespace into one hyphen", () => {
    expect(titleSlug("A   B")).toBe("a-b");
  });

  it("throws on length < 2 or > 60", () => {
    expect(() => titleSlug("A")).toThrow(/length/);
    expect(() => titleSlug("x".repeat(61))).toThrow(/length/);
  });

  it("accepts exactly 2 and 60 chars", () => {
    expect(titleSlug("AB")).toBe("ab");
    expect(titleSlug("x".repeat(60))).toBe("x".repeat(60));
  });
});
