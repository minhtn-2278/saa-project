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
  /**
   * Visual variant. Defaults to `"chip"` — the gold-tinted pill used outside
   * cards. `"plain"` renders the hash+label as red bold text (Figma node
   * 1949-12832 — hashtags inside Kudo cards).
   */
  variant?: "chip" | "plain";
  className?: string;
}

/**
 * Hashtag chip used inside Highlight cards (`B.4.3`) and Kudo Post cards
 * (`C.3.7`). Click applies the hashtag as a board-wide filter via the
 * shared dispatcher — see `LiveBoardFilterContext`.
 *
 * Plan § T037, FR-011.
 */
export function HashtagChip({
  id,
  label,
  interactive = true,
  variant = "chip",
  className,
}: HashtagChipProps) {
  const dispatch = useContext(LiveBoardFilterContext);

  const display = label.startsWith("#") ? label : `#${label}`;

  const baseClasses =
    variant === "plain"
      ? [
          "text-base md:text-lg font-bold tracking-[0.5px]",
          "text-[var(--color-live-accent-red)]",
          "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-live-accent-red)]",
          interactive && dispatch
            ? "cursor-pointer hover:underline"
            : "",
        ]
      : [
          "inline-flex items-center px-2 py-1 rounded-full text-sm md:text-base font-bold tracking-[0.5px]",
          "bg-[var(--color-live-button-soft)] text-[var(--color-live-text-on-cream)]",
          "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-live-accent-gold)]",
          interactive && dispatch
            ? "cursor-pointer hover:bg-[var(--color-live-button-soft-hover)]"
            : "",
        ];

  const classes = [...baseClasses, className ?? ""].filter(Boolean).join(" ");

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
