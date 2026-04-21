"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { HeartFilledIcon } from "@/components/ui/icons/HeartFilledIcon";
import { HeartOutlineIcon } from "@/components/ui/icons/HeartOutlineIcon";

interface HeartsButtonProps {
  /** Kudo id — also rendered as `data-kudo-id` for E2E locators. */
  kudoId: number;
  /** Current total heart count on the kudo (server-side truth). */
  count: number;
  /** Whether the caller has already liked this kudo (server-side truth). */
  hearted: boolean;
  /**
   * Whether the caller is allowed to toggle the heart. `false` when the
   * caller is the author of the Kudo (server-enforced; this disables the
   * UI as a usability hint — the actual authorisation is in the Route
   * Handler, see plan.md § Risk: self-like enforcement leak).
   */
  canHeart: boolean;
}

interface LikePostState {
  kudoId: number;
  heartCount: number;
  heartedByMe: boolean;
}

/**
 * Heart (thả tim) button inside Kudo Post + Highlight cards
 * (`C.4.1` / `B.4.4`).
 *
 * **Optimistic flow (plan § Phase 6, T072)**:
 *   1. Click → flip local `{count, hearted}` immediately.
 *   2. `fetch('POST'|'DELETE' /api/kudos/{id}/like)` based on the
 *      *prior* state (so the request matches the intent, not the
 *      optimistic projection).
 *   3. On 2xx, reconcile from server `{heartCount, heartedByMe}` — this
 *      is idempotent so simultaneous clicks settle cleanly.
 *   4. On non-2xx, roll back to the pre-click state and show the
 *      `toasts.heartError` copy.
 *
 * Props remain the server-side truth; when the parent re-renders with
 * fresh props (e.g. after a feed refetch) local state re-syncs so the
 * button can't drift from reality.
 */
export function HeartsButton({
  kudoId,
  count,
  hearted,
  canHeart,
}: HeartsButtonProps) {
  const t = useTranslations("kudos.liveBoard.toasts");
  const [localCount, setLocalCount] = useState(count);
  const [localHearted, setLocalHearted] = useState(hearted);
  const [pending, setPending] = useState(false);
  const [pulse, setPulse] = useState(false);

  // Re-sync with server props when they change (feed refetch, realtime).
  useEffect(() => {
    setLocalCount(count);
  }, [count]);
  useEffect(() => {
    setLocalHearted(hearted);
  }, [hearted]);

  const disabled = !canHeart || pending;
  const Icon = localHearted ? HeartFilledIcon : HeartOutlineIcon;
  const iconColor = localHearted
    ? "var(--color-live-heart-active)"
    : "var(--color-live-heart-inactive)";

  async function handleClick() {
    if (!canHeart || pending) return;

    const prevHearted = localHearted;
    const prevCount = localCount;
    const nextHearted = !prevHearted;
    // Floor at 0 locally — the server also enforces this (LIKE_DEL_06).
    const nextCount = nextHearted
      ? prevCount + 1
      : Math.max(0, prevCount - 1);

    setLocalHearted(nextHearted);
    setLocalCount(nextCount);
    setPulse(true);
    window.setTimeout(() => setPulse(false), 200);
    setPending(true);

    try {
      const res = await fetch(`/api/kudos/${kudoId}/like`, {
        method: prevHearted ? "DELETE" : "POST",
        credentials: "include",
      });
      if (!res.ok) {
        setLocalHearted(prevHearted);
        setLocalCount(prevCount);
        toast.error(t("heartError"));
        return;
      }
      const json = (await res.json()) as { data: LikePostState };
      setLocalHearted(json.data.heartedByMe);
      setLocalCount(json.data.heartCount);
    } catch {
      setLocalHearted(prevHearted);
      setLocalCount(prevCount);
      toast.error(t("heartError"));
    } finally {
      setPending(false);
    }
  }

  return (
    <button
      type="button"
      disabled={disabled}
      aria-disabled={disabled || undefined}
      aria-pressed={localHearted}
      aria-label={localHearted ? "Bỏ thả tim" : "Thả tim"}
      data-kudo-id={kudoId}
      onClick={handleClick}
      className={[
        "inline-flex items-center gap-1.5 h-10 px-3 rounded-full text-sm md:text-base font-bold",
        "transition-colors",
        disabled ? "cursor-not-allowed opacity-60" : "hover:bg-black/5",
      ].join(" ")}
    >
      <span
        aria-hidden
        className={[
          "inline-flex transition-transform duration-150 ease-out",
          pulse ? "scale-125" : "scale-100",
        ].join(" ")}
        style={{ color: iconColor }}
      >
        <Icon size={20} aria-hidden />
      </span>
      <span
        style={{
          color: localHearted ? iconColor : "var(--color-live-text-on-cream)",
        }}
      >
        {localCount}
      </span>
    </button>
  );
}
