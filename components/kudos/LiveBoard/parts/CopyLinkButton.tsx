"use client";

import { useTranslations } from "next-intl";
import { LinkIcon } from "@/components/ui/icons/LinkIcon";

interface CopyLinkButtonProps {
  /** Reserved for the future enable path — current button discards it. */
  kudoId?: number;
  className?: string;
}

/**
 * "Copy Link" action on Highlight + Kudo Post cards (C.4.2 / B.4.4 right).
 *
 * **This release: permanently disabled** per plan.md Q-A1 resolution. The
 * Kudo detail page (`/kudos/[id]`) + clipboard handler are deferred; the
 * component stays in the project structure as a disabled shell so a future
 * release can enable it by (a) dropping the `disabled` attribute, (b)
 * adding the clipboard `onClick`, and (c) re-adding the toast plumbing.
 *
 * Plan § T039.
 */
export function CopyLinkButton({ className }: CopyLinkButtonProps) {
  const t = useTranslations("kudos.liveBoard.card");

  return (
    <button
      type="button"
      disabled
      aria-disabled="true"
      title={t("disabledTitle")}
      className={[
        "inline-flex items-center gap-1.5 text-sm md:text-base font-bold",
        "cursor-not-allowed opacity-50",
        "text-[var(--color-live-text-on-cream)]",
        className ?? "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <LinkIcon size={16} aria-hidden />
      <span>{t("copyLink")}</span>
    </button>
  );
}
