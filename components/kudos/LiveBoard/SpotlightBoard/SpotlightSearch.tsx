"use client";

import { useTranslations } from "next-intl";

interface SpotlightSearchProps {
  value: string;
  onChange: (next: string) => void;
}

/**
 * B.7.3 search input — filters the Spotlight canvas by name.
 *
 * Lean on the input's built-in `maxLength` (100 chars per the spec) and
 * the native browser clear affordance; the parent manages the value so
 * debouncing / highlighting / recentre-on-Enter can share one state.
 */
export function SpotlightSearch({ value, onChange }: SpotlightSearchProps) {
  const t = useTranslations("kudos.liveBoard.spotlight");

  return (
    <input
      type="search"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      maxLength={100}
      placeholder={t("searchPlaceholder")}
      aria-label={t("searchPlaceholder")}
      className="w-full md:w-80 h-10 px-4 rounded-full bg-white/10 text-white placeholder:text-white/60 border border-white/20 focus:outline-2 focus:outline-[var(--color-live-accent-gold)]"
    />
  );
}
