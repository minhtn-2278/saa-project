"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { HighlightCard } from "@/components/kudos/LiveBoard/HighlightCarousel/HighlightCard";
import { SlidePagination } from "@/components/kudos/LiveBoard/HighlightCarousel/SlidePagination";
import { HighlightCarouselSkeleton } from "@/components/kudos/LiveBoard/skeletons/HighlightCarouselSkeleton";
import { ChevronLeftIcon } from "@/components/ui/icons/ChevronLeftIcon";
import { ChevronRightIcon } from "@/components/ui/icons/ChevronRightIcon";
import { useLiveBoardFilterDispatch } from "@/components/kudos/LiveBoard/filter-reducer";
import type { PublicKudo } from "@/types/kudos";

export interface HighlightCarouselProps {
  /** Current Hashtag filter — triggers a refetch when it changes. */
  hashtagId: number | null;
  /** Current Department filter — triggers a refetch when it changes. */
  departmentId: number | null;
  /** Reducer-owned slide index (always ≥ 0 and clamped by totalSlides). */
  carouselIndex: number;
}

/** Auto-advance interval (ms) between circular slides. */
const AUTO_SLIDE_INTERVAL_MS = 5000;
/** Slide duration — CSS transition on `transform`. */
const SLIDE_ANIMATION_MS = 600;
/** Max card width (px) at the widest breakpoint. Narrower viewports shrink
 *  the slot to fit — see `slotWidth` calc in the component body. */
const CARD_WIDTH_MAX = 640;
/** Gap between cards in the strip. */
const CARD_GAP = 24;
/** Horizontal breathing room reserved on either side of a shrunken slot
 *  so the card doesn't touch the viewport edges on small screens. */
const SLOT_SIDE_PADDING = 16;

/**
 * B.2 — Highlight carousel (Figma screen MaZUn5xHXZ).
 *
 * **Circular carousel** with smooth horizontal gliding.
 *
 * NOTE on divergence from the original US3 spec: the acceptance scenarios
 * in spec.md § US3 called for arrows to be `aria-disabled` at index 0
 * and N-1. During Phase 5 the user explicitly re-specced the navigation
 * as infinite / wrap-around so the auto-slide loop is seamless. Arrows
 * therefore remain enabled whenever `total > 1` and wrap via the reducer
 * (`(idx ± 1 + N) % N`). Disabled-at-ends styling is kept in the code as
 * the `!canNavigate` branch so a single-item feed (total ≤ 1) still has
 * inert arrows.
 *
 * Implementation — "extended strip with boundary clones":
 *   - DOM strip is `[items[N-1], items[0], …, items[N-1], items[0]]`
 *     (N + 2 cards) so the neighbours of the first and last items are
 *     always real DOM nodes.
 *   - `displayPosition` is **derived** from `clampedIndex` (+ an optional
 *     `wrapOverride` during the wrap transition) — no duplicated state,
 *     no effect-ordering pitfalls.
 *   - CSS `transition: transform 600ms ease-out` animates the whole strip
 *     sliding as `translateX` changes.
 *   - Wrap (`N-1 → 0` or `0 → N-1`) glides into the corresponding clone,
 *     then after the transition snaps back to the real item with
 *     `transition: none`. Visually it looks like a normal one-card step.
 *
 * **Auto-slide**: dispatches `nextSlide` every 5 s, paused on hover/focus.
 */
export function HighlightCarousel({
  hashtagId,
  departmentId,
  carouselIndex,
}: HighlightCarouselProps) {
  const t = useTranslations("kudos.liveBoard");
  const carouselT = useTranslations("kudos.liveBoard.carousel");
  const dispatch = useLiveBoardFilterDispatch();

  const [items, setItems] = useState<PublicKudo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  // Responsive slot sizing — we measure the viewport that houses the strip
  // and clamp slot width to `min(CARD_WIDTH_MAX, viewport - 2*padding)`.
  // Updates via ResizeObserver so the translate math follows the card size
  // as the window shrinks. `viewportWidth = 0` during the first paint — we
  // fall back to `CARD_WIDTH_MAX` so the DOM doesn't render 0-wide slots.
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const [viewportWidth, setViewportWidth] = useState(0);
  useEffect(() => {
    const el = viewportRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const update = () => setViewportWidth(el.offsetWidth);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const slotWidth =
    viewportWidth > 0
      ? Math.min(CARD_WIDTH_MAX, viewportWidth - SLOT_SIDE_PADDING * 2)
      : CARD_WIDTH_MAX;

  const load = useCallback(
    async (hId: number | null, dId: number | null) => {
      const ctrl = new AbortController();
      abortRef.current?.abort();
      abortRef.current = ctrl;

      const params = new URLSearchParams();
      if (hId !== null) params.set("hashtagId", String(hId));
      if (dId !== null) params.set("departmentId", String(dId));

      try {
        setIsLoading(true);
        const url = params.toString()
          ? `/api/kudos/highlight?${params.toString()}`
          : "/api/kudos/highlight";
        const res = await fetch(url, {
          signal: ctrl.signal,
          credentials: "include",
        });
        if (!res.ok) throw new Error(`GET /api/kudos/highlight ${res.status}`);
        const json = (await res.json()) as { data: PublicKudo[] };
        if (ctrl.signal.aborted) return;
        setItems(json.data);
        setError(null);
      } catch (e) {
        if (ctrl.signal.aborted) return;
        setError(e instanceof Error ? e : new Error(String(e)));
      } finally {
        if (!ctrl.signal.aborted) setIsLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    void load(hashtagId, departmentId);
  }, [hashtagId, departmentId, load]);

  const total = items.length;
  const clampedIndex =
    total > 0 ? Math.min(Math.max(0, carouselIndex), total - 1) : 0;
  const canNavigate = total > 1;

  // Wrap mechanics:
  //   - `wrapOverride` holds the strip slot we glide to during a wrap
  //     transition (the clone slot).
  //   - `snap` disables CSS transition for the single frame where we jump
  //     from the clone back to the real item.
  const [wrapOverride, setWrapOverride] = useState<number | null>(null);
  const [snap, setSnap] = useState(false);
  const prevIndexRef = useRef<number>(clampedIndex);
  const wrapTimerRef = useRef<number | null>(null);

  useEffect(() => {
    const prev = prevIndexRef.current;
    const cur = clampedIndex;
    if (prev === cur || total <= 1) {
      prevIndexRef.current = cur;
      return;
    }

    // Cancel any pending wrap follow-up — a rapid second navigation should
    // override the in-flight snap.
    if (wrapTimerRef.current !== null) {
      window.clearTimeout(wrapTimerRef.current);
      wrapTimerRef.current = null;
    }

    const isForwardWrap = prev === total - 1 && cur === 0;
    const isBackwardWrap = prev === 0 && cur === total - 1;

    if (isForwardWrap) {
      // Glide into the trailing clone (strip slot = total + 1).
      setSnap(false);
      setWrapOverride(total + 1);
      wrapTimerRef.current = window.setTimeout(() => {
        // Snap back to the real items[0] slot without transition.
        setSnap(true);
        setWrapOverride(null);
        wrapTimerRef.current = null;
        // Re-enable transition on the next frame so future steps animate.
        window.requestAnimationFrame(() => setSnap(false));
      }, SLIDE_ANIMATION_MS);
    } else if (isBackwardWrap) {
      // Glide into the leading clone (strip slot = 0).
      setSnap(false);
      setWrapOverride(0);
      wrapTimerRef.current = window.setTimeout(() => {
        setSnap(true);
        setWrapOverride(null);
        wrapTimerRef.current = null;
        window.requestAnimationFrame(() => setSnap(false));
      }, SLIDE_ANIMATION_MS);
    } else {
      // Normal single-step — no wrap. Derivation handles the rest.
      setSnap(false);
      setWrapOverride(null);
    }

    prevIndexRef.current = cur;
  }, [clampedIndex, total]);

  // Auto-advance. Restarts on every slide change + pauses on hover.
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!canNavigate || isPaused) return;
    const id = window.setTimeout(() => {
      dispatch({ type: "nextSlide", totalSlides: total });
    }, AUTO_SLIDE_INTERVAL_MS);
    return () => window.clearTimeout(id);
  }, [total, clampedIndex, isPaused, canNavigate, dispatch]);

  // Cleanup wrap timer on unmount.
  useEffect(() => {
    return () => {
      if (wrapTimerRef.current !== null) {
        window.clearTimeout(wrapTimerRef.current);
      }
    };
  }, []);

  if (isLoading && items.length === 0) {
    return <HighlightCarouselSkeleton />;
  }
  if (error && items.length === 0) {
    return null;
  }
  if (total === 0) {
    return null;
  }

  // Extended strip with boundary clones. For a single item we skip the
  // clones — nothing to wrap around.
  const extendedStrip: Array<{ key: string; kudo: PublicKudo; stripIndex: number }> =
    total === 1
      ? [{ key: `single-${items[0].id}`, kudo: items[0], stripIndex: 0 }]
      : [
          { key: `lastclone-${items[total - 1].id}`, kudo: items[total - 1], stripIndex: 0 },
          ...items.map((kudo, i) => ({
            key: `item-${i}-${kudo.id}`,
            kudo,
            stripIndex: i + 1,
          })),
          { key: `firstclone-${items[0].id}`, kudo: items[0], stripIndex: total + 1 },
        ];

  // Derived display slot (no duplicated state).
  const baseDisplayPosition = total === 1 ? 0 : clampedIndex + 1;
  const displayPosition = wrapOverride ?? baseDisplayPosition;

  const STEP = slotWidth + CARD_GAP;
  // CSS-only centering: the strip's x=0 anchor is placed at the viewport's
  // horizontal centre via `left: 50%`, then the transform shifts the strip
  // so the focused card's centre lands on that anchor. `slotWidth` is
  // dynamic (shrinks on narrow viewports), so STEP must be recomputed from
  // the measured value — a hard-coded 640 px meant cards overflowed on
  // mobile when the viewport was narrower than a single card.
  const translateX = -(displayPosition * STEP + slotWidth / 2);

  return (
    <section
      aria-label={t("highlight.ariaLabel")}
      className="flex flex-col gap-4"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocus={() => setIsPaused(true)}
      onBlur={() => setIsPaused(false)}
    >
      <div className="flex items-center gap-4">
        <NavArrowButton
          direction="prev"
          disabled={!canNavigate}
          label={carouselT("prevAria")}
          onClick={() => dispatch({ type: "prevSlide", totalSlides: total })}
        />
        <div
          ref={viewportRef}
          className="flex-1 min-w-0 overflow-hidden py-6"
        >
          <div
            aria-live="polite"
            className="flex items-stretch will-change-transform relative"
            style={{
              left: "50%",
              width: "max-content",
              gap: `${CARD_GAP}px`,
              transform: `translate3d(${translateX}px, 0, 0)`,
              transition: snap
                ? "none"
                : `transform ${SLIDE_ANIMATION_MS}ms ease-out`,
            }}
          >
            {extendedStrip.map(({ key, kudo, stripIndex }) => (
              <div
                key={key}
                className="shrink-0"
                style={{ width: `${slotWidth}px` }}
                aria-hidden={stripIndex !== displayPosition || undefined}
              >
                <HighlightCard
                  kudo={kudo}
                  focused={stripIndex === displayPosition}
                />
              </div>
            ))}
          </div>
        </div>
        <NavArrowButton
          direction="next"
          disabled={!canNavigate}
          label={carouselT("nextAria")}
          onClick={() => dispatch({ type: "nextSlide", totalSlides: total })}
        />
      </div>

      {/* B.5 slide nav — extracted so the chrome is unit-testable in
          isolation and easy to swap into other contexts (e.g. Spotlight
          prev/next). */}
      <SlidePagination
        current={clampedIndex}
        total={total}
        onPrev={() => dispatch({ type: "prevSlide", totalSlides: total })}
        onNext={() => dispatch({ type: "nextSlide", totalSlides: total })}
      />
    </section>
  );
}

// -----------------------------------------------------------------------------
// Sub-components
// -----------------------------------------------------------------------------

interface NavArrowButtonProps {
  direction: "prev" | "next";
  disabled: boolean;
  label: string;
  onClick: () => void;
}

function NavArrowButton({
  direction,
  disabled,
  label,
  onClick,
}: NavArrowButtonProps) {
  const Icon = direction === "prev" ? ChevronLeftIcon : ChevronRightIcon;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-disabled={disabled || undefined}
      aria-label={label}
      className={[
        "inline-flex items-center justify-center h-12 w-12 shrink-0 rounded-full",
        "text-white bg-transparent border-0",
        "transition-opacity",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/60",
        disabled
          ? "opacity-30 cursor-not-allowed"
          : "opacity-100 hover:opacity-80",
      ].join(" ")}
    >
      <Icon size={28} />
    </button>
  );
}
