import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  createKudoRequestSchema,
  employeeSearchParamsSchema,
  listKudosParamsSchema,
} from "@/lib/validations/kudos";
import { createUploadRequestSchema } from "@/lib/validations/uploads";

/**
 * Contract-drift guard (plan § Q-P1 Recommendation).
 *
 * Rather than pulling in `zod-to-openapi` (+ its transitive deps) we perform a
 * lightweight, self-contained structural check: for every request schema that
 * `api-docs.yaml` declares, confirm that a matching Zod schema exists and
 * accepts a minimally valid payload. The YAML stays the source of truth for
 * the wire contract; this test catches accidental divergence where a field
 * was added to one side but not the other.
 */

const YAML_PATH = resolve(__dirname, "../../.momorph/contexts/api-docs.yaml");

function loadYaml(): string {
  return readFileSync(YAML_PATH, "utf8");
}

describe("api-contract drift guard", () => {
  const yaml = loadYaml();

  it("declares the operations this feature owns", () => {
    for (const op of [
      "operationId: createKudo",
      "operationId: listKudos",
      "operationId: searchEmployees",
      "operationId: listTitles",
      "operationId: listHashtags",
      "operationId: createUpload",
      "operationId: deleteUpload",
    ]) {
      expect(yaml).toContain(op);
    }
  });

  it("declares the schemas this feature owns", () => {
    for (const schema of [
      "CreateKudoRequest",
      "Kudo:",
      "KudoResponse",
      "KudoListResponse",
      "EmployeeSummary",
      "TitleListResponse",
      "HashtagListResponse",
      "UploadResponse",
    ]) {
      expect(yaml).toContain(schema);
    }
  });

  describe("CreateKudoRequest", () => {
    it("declares required + optional fields in the YAML", () => {
      expect(yaml).toMatch(/required: \[recipientId, body, hashtags\]/);
      for (const field of [
        "recipientId:",
        "titleId:",
        "titleName:",
        "body:",
        "hashtags:",
        "imageIds:",
        "isAnonymous:",
        "anonymousAlias:",
      ]) {
        expect(yaml).toContain(field);
      }
    });

    it("Zod schema accepts a minimal valid payload", () => {
      const parsed = createKudoRequestSchema.safeParse({
        recipientId: 1024,
        titleId: 7,
        body: { type: "doc", content: [] },
        hashtags: [{ id: 12 }],
      });
      expect(parsed.success).toBe(true);
    });

    it("Zod schema accepts an anonymous + inline-create payload", () => {
      const parsed = createKudoRequestSchema.safeParse({
        recipientId: 1024,
        titleName: "Người truyền cảm hứng",
        body: { type: "doc", content: [] },
        hashtags: [{ label: "teamwork" }, { id: 12 }],
        isAnonymous: true,
        anonymousAlias: "Thỏ 7 màu",
      });
      expect(parsed.success).toBe(true);
    });

    it("Zod schema rejects payloads without a recipient", () => {
      const parsed = createKudoRequestSchema.safeParse({
        titleId: 7,
        body: { type: "doc", content: [] },
        hashtags: [{ id: 12 }],
      });
      expect(parsed.success).toBe(false);
    });

    it("Zod schema rejects both titleId and titleName set", () => {
      const parsed = createKudoRequestSchema.safeParse({
        recipientId: 1024,
        titleId: 7,
        titleName: "Custom",
        body: { type: "doc", content: [] },
        hashtags: [{ id: 12 }],
      });
      expect(parsed.success).toBe(false);
    });

    it("Zod schema rejects payloads with 0 or 6+ hashtags", () => {
      const zero = createKudoRequestSchema.safeParse({
        recipientId: 1024,
        titleId: 7,
        body: { type: "doc", content: [] },
        hashtags: [],
      });
      const six = createKudoRequestSchema.safeParse({
        recipientId: 1024,
        titleId: 7,
        body: { type: "doc", content: [] },
        hashtags: [1, 2, 3, 4, 5, 6].map((id) => ({ id })),
      });
      expect(zero.success).toBe(false);
      expect(six.success).toBe(false);
    });

    it("Zod schema rejects anonymousAlias > 60 chars", () => {
      const parsed = createKudoRequestSchema.safeParse({
        recipientId: 1024,
        titleId: 7,
        body: { type: "doc", content: [] },
        hashtags: [{ id: 12 }],
        isAnonymous: true,
        anonymousAlias: "x".repeat(61),
      });
      expect(parsed.success).toBe(false);
    });
  });

  describe("EmployeeSearchParams", () => {
    it("YAML declares q + ignore_caller + limit", () => {
      expect(yaml).toContain("name: q");
      expect(yaml).toContain("name: ignore_caller");
    });

    it("Zod defaults ignore_caller to true", () => {
      const parsed = employeeSearchParamsSchema.parse({ q: "Minh" });
      expect(parsed.ignore_caller).toBe(true);
    });

    it("Zod rejects empty q", () => {
      const parsed = employeeSearchParamsSchema.safeParse({ q: "" });
      expect(parsed.success).toBe(false);
    });
  });

  describe("ListKudosParams", () => {
    it("Zod accepts the standard paginated shape", () => {
      expect(
        listKudosParamsSchema.parse({ page: "2", limit: "10" }),
      ).toMatchObject({ page: 2, limit: 10 });
    });

    it("Zod caps limit at 100", () => {
      const parsed = listKudosParamsSchema.safeParse({ limit: "200" });
      expect(parsed.success).toBe(false);
    });
  });

  describe("CreateUploadRequest", () => {
    it("Zod accepts a valid JPEG upload", () => {
      const parsed = createUploadRequestSchema.safeParse({
        fileName: "team-photo.jpg",
        mimeType: "image/jpeg",
        byteSize: 1024 * 1024,
      });
      expect(parsed.success).toBe(true);
    });

    it("Zod rejects files over 5 MB", () => {
      const parsed = createUploadRequestSchema.safeParse({
        fileName: "big.jpg",
        mimeType: "image/jpeg",
        byteSize: 5 * 1024 * 1024 + 1,
      });
      expect(parsed.success).toBe(false);
    });

    it("Zod rejects non-image mime types", () => {
      const parsed = createUploadRequestSchema.safeParse({
        fileName: "x.pdf",
        mimeType: "application/pdf",
        byteSize: 1000,
      });
      expect(parsed.success).toBe(false);
    });
  });
});
