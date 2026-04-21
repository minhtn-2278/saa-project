"use client";

import { useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { useVirtualizer } from "@tanstack/react-virtual";
import { KudoPost } from "./KudoPost";
import { useKudoFeed, type UseKudoFeedOptions } from "./use-kudo-feed";
import { EmptyState } from "@/components/kudos/LiveBoard/parts/EmptyState";

export interface KudoFeedProps extends UseKudoFeedOptions {
  /** Estimated per-row height, used by react-virtual before measurement. */
  estimatedRowHeight?: number;
}

/**
 * ALL KUDOS (C.2) virtualised feed.
 *
 * Responsibilities:
 *   - Renders a vertical list of `<KudoPost>` cards backed by `useKudoFeed`.
 *   - Uses `@tanstack/react-virtual` to keep DOM node count bounded as
 *     users scroll past hundreds of Kudos (plan.md § T042).
 *   - Observes a trailing sentinel with `IntersectionObserver` to auto-load
 *     the next cursor page (US1 AS#4 infinite scroll).
 *   - Shows the empty state when the filter yields no results.
 *
 * Plan § T042.
 */
export function KudoFeed({
  initialFeed,
  initialNextCursor,
  hashtagId,
  departmentId,
  limit,
  estimatedRowHeight = 680,
}: KudoFeedProps) {
  const t = useTranslations("kudos.liveBoard.emptyStates");
  const { items, isEnd, isLoading, isFiltering, loadMore } = useKudoFeed({
    initialFeed,
    initialNextCursor,
    hashtagId,
    departmentId,
    limit,
  });

  // Window scrolling: pass `window` as the scroll parent so the feed
  // participates in the normal page scroll. react-virtual ≥ 3.x supports
  // `useWindowVirtualizer` but using `useVirtualizer` with `getScrollElement`
  // pointing at the inner container keeps the hook consistent with future
  // changes (e.g. if the feed scrolls inside its own container on mobile).
  const parentRef = useRef<HTMLDivElement | null>(null);
  const rowVirtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => estimatedRowHeight,
    overscan: 2,
    measureElement: (el) => el.getBoundingClientRect().height,
  });

  // Sentinel — IntersectionObserver triggers `loadMore` when the bottom
  // placeholder enters the viewport. Plan § T042.
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!sentinelRef.current || isEnd) return;
    const el = sentinelRef.current;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          void loadMore();
        }
      },
      { rootMargin: "400px 0px 400px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [isEnd, loadMore]);

  if (!isFiltering && items.length === 0) {
    return <EmptyState>{t("feed")}</EmptyState>;
  }

  return (
    <div
      ref={parentRef}
      className="relative w-full"
      data-testid="kudo-feed"
      aria-busy={isFiltering || isLoading || undefined}
    >
      <ol
        className="relative list-none p-0 m-0"
        style={{ height: rowVirtualizer.getTotalSize() }}
      >
        {rowVirtualizer.getVirtualItems().map((row) => {
          const kudo = items[row.index];
          if (!kudo) return null;
          return (
            <li
              key={kudo.id}
              data-index={row.index}
              ref={rowVirtualizer.measureElement}
              className="absolute left-0 right-0 flex justify-center pb-6"
              style={{ transform: `translateY(${row.start}px)` }}
            >
              <KudoPost kudo={kudo} />
            </li>
          );
        })}
      </ol>
      {!isEnd ? (
        <div
          ref={sentinelRef}
          aria-hidden
          className="h-1 w-full"
          data-testid="kudo-feed-sentinel"
        />
      ) : null}
      {isLoading && !isFiltering ? (
        <p className="py-6 text-center text-white/60" role="status">
          …
        </p>
      ) : null}
    </div>
  );
}
