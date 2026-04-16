import { describe, it, expect } from "vitest";
import { emailDomainSchema } from "@/lib/validations/auth";

describe("emailDomainSchema", () => {
  it("accepts valid Sun* email", () => {
    const result = emailDomainSchema.safeParse("user@sun-asterisk.com");
    expect(result.success).toBe(true);
  });

  it("accepts Sun* email with subdomain-like local part", () => {
    const result = emailDomainSchema.safeParse(
      "first.last@sun-asterisk.com"
    );
    expect(result.success).toBe(true);
  });

  it("accepts Sun* email with plus addressing", () => {
    const result = emailDomainSchema.safeParse(
      "user+tag@sun-asterisk.com"
    );
    expect(result.success).toBe(true);
  });

  it("rejects non-Sun* domain", () => {
    const result = emailDomainSchema.safeParse("user@gmail.com");
    expect(result.success).toBe(false);
  });

  it("rejects similar domain (sun-asterisk.org)", () => {
    const result = emailDomainSchema.safeParse("user@sun-asterisk.org");
    expect(result.success).toBe(false);
  });

  it("rejects subdomain of Sun* domain", () => {
    const result = emailDomainSchema.safeParse(
      "user@mail.sun-asterisk.com"
    );
    expect(result.success).toBe(false);
  });

  it("rejects domain that contains sun-asterisk.com as substring", () => {
    const result = emailDomainSchema.safeParse(
      "user@notsun-asterisk.com"
    );
    expect(result.success).toBe(false);
  });

  it("rejects empty string", () => {
    const result = emailDomainSchema.safeParse("");
    expect(result.success).toBe(false);
  });

  it("rejects invalid email format", () => {
    const result = emailDomainSchema.safeParse("not-an-email");
    expect(result.success).toBe(false);
  });

  it("is case-insensitive for domain", () => {
    const result = emailDomainSchema.safeParse(
      "user@Sun-Asterisk.COM"
    );
    expect(result.success).toBe(true);
  });
});
