"use client";

import { useContext } from "react";
import { LiveBoardFilterContext } from "@/components/kudos/LiveBoard/filter-reducer";

interface HashtagChipProps {
  id: number;
  label: string;
  /**
   * When true, clicking the chip dispatches a `setHashtag` action into the
   * shared `LiveBoardFilterContext`, applying that tag as the current filter
   * (FR-011). Defaults to true.
   *
   * Disabled rendering (no dispatcher context, or `interactive={false}`) is
   * useful for previews / tests.
   */
  interactive?: boolean;
  className?: string;
}

/**
 * Hashtag chip used inside Highlight cards (`B.4.3`) and Kudo Post cards
 * (`C.3.7`). Click applies the hashtag as a board-wide filter via the
 * shared dispatcher — see `LiveBoardFilterContext`. Typography + spacing
 * match design-style.md § Typography `--text-body-md` (Montserrat 16/700,
 * letter-spacing 0.5px).
 *
 * Plan § T037, FR-011.
 */
export function HashtagChip({
  id,
  label,
  interactive = true,
  className,
}: HashtagChipProps) {
  // Read the context directly so the chip can render without a provider
  // (tests, previews). The strict `useLiveBoardFilterDispatch` helper
  // throws in that case — we want a graceful fallback to a non-interactive
  // span instead.
  const dispatch = useContext(LiveBoardFilterContext);

  const display = label.startsWith("#") ? label : `#${label}`;
  const classes = [
    "inline-flex items-center px-2 py-1 rounded-full text-sm md:text-base font-bold tracking-[0.5px]",
    "bg-[var(--color-live-button-soft)] text-[var(--color-live-text-on-cream)]",
    "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-live-accent-gold)]",
    interactive && dispatch
      ? "cursor-pointer hover:bg-[var(--color-live-button-soft-hover)]"
      : "",
    className ?? "",
  ]
    .filter(Boolean)
    .join(" ");

  if (!interactive || !dispatch) {
    return <span className={classes}>{display}</span>;
  }

  return (
    <button
      type="button"
      className={classes}
      onClick={() => dispatch({ type: "setHashtag", id })}
      aria-label={`Lọc theo ${display}`}
    >
      {display}
    </button>
  );
}

