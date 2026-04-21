"use client";

import { useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";

interface HoaThiTooltipProps {
  /** Number of stars (1..3). 0 means "no rank yet" — renders children only. */
  stars: 0 | 1 | 2 | 3;
  /** The visual star markup (emoji, SVG, icon row, etc.). */
  children: ReactNode;
  className?: string;
}

/**
 * Tooltip for the "hoa thị" (star) rank next to a sender / recipient name.
 * Hover / focus shows the threshold description pulled from the
 * `kudos.liveBoard.hoaThi.*` i18n namespace.
 *
 * FR-015 thresholds:
 *   1 hoa thị → 10 Kudos
 *   2 hoa thị → 20 Kudos
 *   3 hoa thị → 50 Kudos
 *
 * Plan § T027.
 */
export function HoaThiTooltip({
  stars,
  children,
  className,
}: HoaThiTooltipProps) {
  const t = useTranslations("kudos.liveBoard.hoaThi");
  const [open, setOpen] = useState(false);

  const message =
    stars === 1 ? t("one") : stars === 2 ? t("two") : stars === 3 ? t("three") : null;

  if (stars === 0 || !message) {
    return <span className={className}>{children}</span>;
  }

  return (
    <span
      className={`relative inline-flex ${className ?? ""}`.trim()}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
    >
      <span
        tabIndex={0}
        aria-describedby={open ? "hoa-thi-tooltip" : undefined}
      >
        {children}
      </span>
      {open ? (
        <span
          id="hoa-thi-tooltip"
          role="tooltip"
          className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-max max-w-xs px-3 py-2 rounded-lg text-sm z-50 pointer-events-none"
          style={{
            background: "var(--color-live-surface-dark-1)",
            border: "1px solid var(--color-live-border-gold)",
            color: "var(--color-live-text-primary)",
          }}
        >
          {message}
        </span>
      ) : null}
    </span>
  );
}
