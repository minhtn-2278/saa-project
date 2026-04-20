"use client";

import { useTranslations } from "next-intl";

interface CommunityStandardsLinkProps {
  href?: string;
  className?: string;
}

/**
 * Right-aligned link in the EditorToolbar row (FR-015).
 * Opens in a new tab (`target="_blank" rel="noopener noreferrer"`) and
 * preserves the modal state. Colour from design-style.md (#E46060 with
 * underline-on-hover to meet WCAG AA on the cream modal surface).
 */
export function CommunityStandardsLink({
  href = "/community-standards",
  className,
}: CommunityStandardsLinkProps) {
  const t = useTranslations("kudos.writeKudo");
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={t("actions.communityStandardsAria")}
      className={
        className ??
        "text-base leading-6 font-bold tracking-[0.15px] text-[#E46060] hover:underline focus:underline focus:outline-2 focus:outline-[#E46060] focus:outline-offset-2"
      }
    >
      {t("actions.communityStandards")}
    </a>
  );
}
