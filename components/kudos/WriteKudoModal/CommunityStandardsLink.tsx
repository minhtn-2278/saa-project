"use client";

import { useTranslations } from "next-intl";

interface CommunityStandardsLinkProps {
  href?: string;
  className?: string;
}

/**
 * Right-aligned link in the EditorToolbar row (FR-015).
 *
 * Always underlined to match the Figma frame (see
 * `.momorph/specs/ihQ26W78P2-viet-kudo/assets/frame.png`). The
 * design-style doc initially listed underline as hover-only, but the
 * Figma rendering has it underlined by default — Figma is the source
 * of truth for this link.
 *
 * Opens in a new tab (`target="_blank" rel="noopener noreferrer"`) and
 * preserves the modal state.
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
        // Last cell in the toolbar row — grows (`flex-1`) to fill the space
        // next to the Quote button so no gap remains, content centred, and
        // `-ml-px` collapses the shared 1px border with the adjacent button.
        // Same `h-10 + border #998C5F + rounded-tr-lg` treatment as the
        // rich-text toolbar buttons so the top row reads as one continuous
        // bar. Link-specific styling (red + underline) rides on top.
        "inline-flex flex-1 items-center justify-center h-10 px-4 -ml-px border border-[#998C5F] rounded-tr-lg bg-transparent text-base leading-6 font-bold tracking-[0.15px] text-[#E46060] underline underline-offset-2 hover:no-underline focus:outline-2 focus:outline-[#E46060] focus:outline-offset-2"
      }
    >
      {t("actions.communityStandards")}
    </a>
  );
}
