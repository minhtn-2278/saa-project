"use client";

import { HeartFilledIcon } from "@/components/ui/icons/HeartFilledIcon";
import { HeartOutlineIcon } from "@/components/ui/icons/HeartOutlineIcon";

interface HeartsButtonProps {
  /** Kudo id — used by the Phase 6 interactive variant; rendered as data-* for tests. */
  kudoId: number;
  /** Current total heart count on the kudo. */
  count: number;
  /** Whether the caller has already liked this kudo. */
  hearted: boolean;
  /**
   * Whether the caller is allowed to toggle the heart. `false` when the
   * caller is the author of the Kudo (server-enforced; this disables the
   * UI as a usability hint).
   */
  canHeart: boolean;
}

/**
 * Heart (thả tim) button inside Kudo Post + Highlight cards
 * (`C.4.1` / `B.4.4`).
 *
 * **Phase 3 (US1 Browse) scope**: render-only skeleton. Shows the right
 * icon + count and applies the correct disabled styling when
 * `canHeart === false`. The optimistic POST/DELETE wiring to
 * `/api/kudos/[id]/like` is added in Phase 6 (US4 Like) by extending this
 * same component with local state + `fetch` — no structural change to
 * callers.
 *
 * Plan § T040.
 */
export function HeartsButton({
  kudoId,
  count,
  hearted,
  canHeart,
}: HeartsButtonProps) {
  const disabled = !canHeart;
  const Icon = hearted ? HeartFilledIcon : HeartOutlineIcon;
  const iconColor = hearted
    ? "var(--color-live-heart-active)"
    : "var(--color-live-heart-inactive)";

  return (
    <button
      type="button"
      disabled={disabled}
      aria-disabled={disabled || undefined}
      aria-pressed={hearted}
      aria-label={
        hearted ? "Bỏ thả tim (sắp ra mắt)" : "Thả tim (sắp ra mắt)"
      }
      data-kudo-id={kudoId}
      className={[
        "inline-flex items-center gap-1.5 h-10 px-3 rounded-full text-sm md:text-base font-bold",
        "transition-colors",
        disabled ? "cursor-not-allowed opacity-60" : "hover:bg-black/5",
      ].join(" ")}
    >
      <span
        aria-hidden
        className="inline-flex"
        style={{ color: iconColor }}
      >
        <Icon size={20} aria-hidden />
      </span>
      <span style={{ color: hearted ? iconColor : "var(--color-live-text-on-cream)" }}>
        {count}
      </span>
    </button>
  );
}
