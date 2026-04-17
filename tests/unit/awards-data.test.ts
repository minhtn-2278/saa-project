import { describe, it, expect } from "vitest";
import { AWARDS, KUDOS_PROMO } from "@/lib/awards/data";
import { AwardsArraySchema, KudosPromoSchema } from "@/lib/awards/schema";
import viMessages from "@/messages/vi.json";

describe("AWARDS static data", () => {
  it("contains exactly 6 entries", () => {
    expect(AWARDS).toHaveLength(6);
  });

  it("has unique non-empty slugs", () => {
    const slugs = AWARDS.map((a) => a.slug);
    expect(new Set(slugs).size).toBe(AWARDS.length);
    slugs.forEach((s) => expect(s.length).toBeGreaterThan(0));
  });

  it("has unique displayOrder 1..6", () => {
    const orders = AWARDS.map((a) => a.displayOrder).sort();
    expect(orders).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it("alternates layouts: 0/2/4 = image-left; 1/3/5 = image-right", () => {
    AWARDS.forEach((a, idx) => {
      const expected = idx % 2 === 0 ? "image-left" : "image-right";
      expect(a.layout).toBe(expected);
    });
  });

  it("has positive quantity and valid value tiers", () => {
    AWARDS.forEach((a) => {
      expect(a.quantity).toBeGreaterThan(0);
      a.valueTiers.forEach((tier) => {
        expect(tier.valueVnd).toBeGreaterThan(0);
      });
    });
  });

  it("passes zod schema validation", () => {
    expect(() => AwardsArraySchema.parse(AWARDS)).not.toThrow();
  });

  it("all nameKey references resolve in vi.json (deep lookup)", () => {
    AWARDS.forEach((a) => {
      const value = resolveKey(viMessages, a.nameKey);
      expect(value, `missing ${a.nameKey}`).toBeTypeOf("string");
    });
  });

  it("all descriptionKey references resolve in vi.json (deep lookup)", () => {
    AWARDS.forEach((a) => {
      const value = resolveKey(viMessages, a.descriptionKey);
      expect(value, `missing ${a.descriptionKey}`).toBeTypeOf("string");
    });
  });

  it("Signature 2025 has a single combined quantity and two value tiers", () => {
    const sig = AWARDS.find((a) => a.slug === "signature-2025");
    expect(sig).toBeDefined();
    expect(sig!.quantity).toBe(1);
    expect(sig!.unit).toBe("ca_nhan_hoac_tap_the");
    expect(sig!.valueTiers).toHaveLength(2);
    expect(sig!.valueTiers[0].labelKey).toBe(
      "awardsPage.signature.forIndividual"
    );
    expect(sig!.valueTiers[1]?.labelKey).toBe(
      "awardsPage.signature.forGroup"
    );
  });

  it("non-signature awards have a single value tier without labelKey", () => {
    AWARDS.filter((a) => a.slug !== "signature-2025").forEach((a) => {
      expect(a.valueTiers).toHaveLength(1);
      expect(a.valueTiers[0].labelKey).toBeUndefined();
    });
  });
});

describe("KUDOS_PROMO", () => {
  it("passes zod schema validation", () => {
    expect(() => KudosPromoSchema.parse(KUDOS_PROMO)).not.toThrow();
  });

  it("points to /kudos", () => {
    expect(KUDOS_PROMO.ctaTargetHref).toBe("/kudos");
  });
});

function resolveKey(
  obj: Record<string, unknown>,
  path: string
): unknown {
  return path.split(".").reduce<unknown>((acc, key) => {
    if (acc && typeof acc === "object") {
      return (acc as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj);
}
