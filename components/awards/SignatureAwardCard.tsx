import type { Award } from "@/lib/awards/types";
import type { SupportedLocale } from "@/lib/utils/format";
import { AwardCard } from "./AwardCard";

interface Props {
  award: Award;
  locale: SupportedLocale;
}

/**
 * Signature 2025 – Creator variant. Re-uses AwardCard but is a dedicated
 * component for clarity and future variant-specific extension. The dual-tier
 * rendering is driven by the `prizeTiers` data (2 tiers + `tierLabelKey`).
 */
export function SignatureAwardCard({ award, locale }: Props) {
  return <AwardCard award={award} locale={locale} />;
}
