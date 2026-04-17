export type UnitKey =
  | "don_vi"
  | "ca_nhan"
  | "tap_the"
  | "ca_nhan_hoac_tap_the";

export type AwardSlug =
  | "top-talent"
  | "top-project"
  | "top-project-leader"
  | "best-manager"
  | "signature-2025"
  | "mvp";

export type AwardLayout = "image-left" | "image-right";

export interface ValueTier {
  readonly valueVnd: number;
  readonly labelKey?: string;
}

export interface Award {
  readonly slug: AwardSlug;
  readonly displayOrder: 1 | 2 | 3 | 4 | 5 | 6;
  readonly layout: AwardLayout;
  readonly imageUrl: string;
  readonly nameKey: string;
  readonly descriptionKey: string;
  readonly quantity: number;
  readonly unit: UnitKey;
  readonly valueTiers: readonly [ValueTier] | readonly [ValueTier, ValueTier];
}

export interface KudosPromoContent {
  readonly eyebrowKey: string;
  readonly titleKey: string;
  readonly descriptionKey: string;
  readonly ctaLabelKey: string;
  readonly ctaTargetHref: "/kudos";
}
