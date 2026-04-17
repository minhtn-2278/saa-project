import type { Award, KudosPromoContent } from "./types";
import { AwardsArraySchema, KudosPromoSchema } from "./schema";

export const AWARDS: readonly Award[] = [
  {
    slug: "top-talent",
    displayOrder: 1,
    layout: "image-left",
    imageUrl: "/images/awards/top-talent.png",
    nameKey: "homepage.awards.topTalent.name",
    descriptionKey: "awardsPage.topTalent.description",
    quantity: 10,
    unit: "don_vi",
    valueTiers: [{ valueVnd: 7_000_000 }],
  },
  {
    slug: "top-project",
    displayOrder: 2,
    layout: "image-right",
    imageUrl: "/images/awards/top-project.png",
    nameKey: "homepage.awards.topProject.name",
    descriptionKey: "awardsPage.topProject.description",
    quantity: 2,
    unit: "tap_the",
    valueTiers: [{ valueVnd: 15_000_000 }],
  },
  {
    slug: "top-project-leader",
    displayOrder: 3,
    layout: "image-left",
    imageUrl: "/images/awards/top-project-leader.png",
    nameKey: "homepage.awards.topProjectLeader.name",
    descriptionKey: "awardsPage.topProjectLeader.description",
    quantity: 3,
    unit: "ca_nhan",
    valueTiers: [{ valueVnd: 7_000_000 }],
  },
  {
    slug: "best-manager",
    displayOrder: 4,
    layout: "image-right",
    imageUrl: "/images/awards/best-manager.png",
    nameKey: "homepage.awards.bestManager.name",
    descriptionKey: "awardsPage.bestManager.description",
    quantity: 1,
    unit: "ca_nhan",
    valueTiers: [{ valueVnd: 10_000_000 }],
  },
  {
    slug: "signature-2025",
    displayOrder: 5,
    layout: "image-left",
    imageUrl: "/images/awards/signature-2025.png",
    nameKey: "homepage.awards.signature2025.name",
    descriptionKey: "awardsPage.signature2025.description",
    quantity: 1,
    unit: "ca_nhan_hoac_tap_the",
    valueTiers: [
      { valueVnd: 5_000_000, labelKey: "awardsPage.signature.forIndividual" },
      { valueVnd: 8_000_000, labelKey: "awardsPage.signature.forGroup" },
    ],
  },
  {
    slug: "mvp",
    displayOrder: 6,
    layout: "image-right",
    imageUrl: "/images/awards/mvp.png",
    nameKey: "homepage.awards.mvp.name",
    descriptionKey: "awardsPage.mvp.description",
    quantity: 1,
    unit: "ca_nhan",
    valueTiers: [{ valueVnd: 15_000_000 }],
  },
] as const;

export const KUDOS_PROMO: KudosPromoContent = {
  eyebrowKey: "awardsPage.kudos.eyebrow",
  titleKey: "awardsPage.kudos.title",
  descriptionKey: "awardsPage.kudos.description",
  ctaLabelKey: "awardsPage.kudos.cta",
  ctaTargetHref: "/kudos",
};

// Dev-mode validation: fail fast on authoring typos.
if (process.env.NODE_ENV !== "production") {
  AwardsArraySchema.parse(AWARDS);
  KudosPromoSchema.parse(KUDOS_PROMO);
}
