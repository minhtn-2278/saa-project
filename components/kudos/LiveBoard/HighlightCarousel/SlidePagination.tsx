"use client";

import { useTranslations } from "next-intl";
import { ChevronLeftIcon } from "@/components/ui/icons/ChevronLeftIcon";
import { ChevronRightIcon } from "@/components/ui/icons/ChevronRightIcon";

interface SlidePaginationProps {
  /** Current slide index (0-based). Displayed as `current + 1` per the `n/N` chip. */
  current: number;
  /** Total number of slides. When ≤ 1 the pagination is visually dimmed and the arrows are inert. */
  total: number;
  onPrev: () => void;
  onNext: () => void;
}

/**
 * B.5 — slide-nav chip below the Highlight carousel.
 *
 * Layout: `[◄]  <current>/<total>  [►]` — centered, 16 px gaps.
 *
 * The carousel in this project is **circular** (wrap-around on both ends),
 * per the user's explicit mid-implementation decision in Phase 5 — this
 * diverges from the original US3 acceptance that called for
 * `aria-disabled` at ends. Navigation therefore stays enabled as long as
 * `total > 1`; the arrows only go inert when there is nothing to navigate
 * to (`total ≤ 1`).
 *
 * Visual tokens per design-style.md § B.5:
 *   - Current number: `--color-live-accent-gold`
 *   - `/total`: white
 *   - Chevron arrows: 36 px round, white, border-less, 80 % opacity on hover
 */
export function SlidePagination({
  current,
  total,
  onPrev,
  onNext,
}: SlidePaginationProps) {
  const t = useTranslations("kudos.liveBoard.carousel");
  const canNavigate = total > 1;

  const arrowClass = [
    "inline-flex items-center justify-center h-9 w-9 rounded-full transition-opacity text-white",
    canNavigate
      ? "opacity-100 hover:opacity-80"
      : "opacity-30 cursor-not-allowed",
  ].join(" ");

  return (
    <div className="flex items-center justify-center gap-4">
      <button
        type="button"
        onClick={onPrev}
        disabled={!canNavigate}
        aria-label={t("prevAria")}
        className={arrowClass}
      >
        <ChevronLeftIcon size={20} />
      </button>
      <span
        className="text-2xl md:text-[28px] font-bold tabular-nums tracking-wide"
        data-testid="slide-pagination-chip"
      >
        <span style={{ color: "var(--color-live-accent-gold)" }}>
          {Math.min(current + 1, Math.max(total, 1))}
        </span>
        <span className="text-white">
          {" / "}
          {total}
        </span>
      </span>
      <button
        type="button"
        onClick={onNext}
        disabled={!canNavigate}
        aria-label={t("nextAria")}
        className={arrowClass}
      >
        <ChevronRightIcon size={20} />
      </button>
    </div>
  );
}
