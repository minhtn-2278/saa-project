import { z } from "zod";

const UnitKeySchema = z.enum([
  "don_vi",
  "ca_nhan",
  "tap_the",
  "ca_nhan_hoac_tap_the",
]);

const AwardSlugSchema = z.enum([
  "top-talent",
  "top-project",
  "top-project-leader",
  "best-manager",
  "signature-2025",
  "mvp",
]);

const AwardLayoutSchema = z.enum(["image-left", "image-right"]);

export const ValueTierSchema = z.object({
  valueVnd: z.number().int().positive(),
  labelKey: z.string().min(1).optional(),
});

export const AwardSchema = z.object({
  slug: AwardSlugSchema,
  displayOrder: z.union([
    z.literal(1),
    z.literal(2),
    z.literal(3),
    z.literal(4),
    z.literal(5),
    z.literal(6),
  ]),
  layout: AwardLayoutSchema,
  imageUrl: z.string().min(1),
  nameKey: z.string().min(1),
  descriptionKey: z.string().min(1),
  quantity: z.number().int().positive(),
  unit: UnitKeySchema,
  valueTiers: z.union([
    z.tuple([ValueTierSchema]),
    z.tuple([ValueTierSchema, ValueTierSchema]),
  ]),
});

export const AwardsArraySchema = z
  .array(AwardSchema)
  .length(6)
  .refine(
    (items) => new Set(items.map((a) => a.slug)).size === items.length,
    { message: "Slugs must be unique" }
  )
  .refine(
    (items) =>
      new Set(items.map((a) => a.displayOrder)).size === items.length,
    { message: "displayOrder must be unique" }
  )
  .refine(
    (items) =>
      items.every((a, idx) => {
        const expected = idx % 2 === 0 ? "image-left" : "image-right";
        return a.layout === expected;
      }),
    {
      message:
        "layout must alternate: index 0/2/4 = image-left; 1/3/5 = image-right",
    }
  );

export const KudosPromoSchema = z.object({
  eyebrowKey: z.string().min(1),
  titleKey: z.string().min(1),
  descriptionKey: z.string().min(1),
  ctaLabelKey: z.string().min(1),
  ctaTargetHref: z.literal("/kudos"),
});
