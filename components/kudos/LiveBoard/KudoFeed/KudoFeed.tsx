"use client";

import { useTranslations } from "next-intl";
import { KudoPost } from "./KudoPost";
import { useKudoFeed, type UseKudoFeedOptions } from "./use-kudo-feed";
import { EmptyState } from "@/components/kudos/LiveBoard/parts/EmptyState";

export type KudoFeedProps = UseKudoFeedOptions;

/**
 * ALL KUDOS (C.2) feed.
 *
 * Responsibilities:
 *   - Renders a simple vertical list of `<KudoPost>` cards backed by
 *     `useKudoFeed`.
 *   - Paginates via an explicit `Xem tiếp` button — 20 per page (user
 *     preference 2026-04-22). The previous version used
 *     `@tanstack/react-virtual` + an auto-loading sentinel, but the
 *     `parentRef` pointed at a non-scrolling div, so on `prepend` (after
 *     the Write Kudo modal dispatches `kudo:created`) the virtualizer's
 *     measurements desynced and cards overlapped. A plain list rebuilds
 *     cleanly on every render and dodges that class of bug entirely.
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
}: KudoFeedProps) {
  const emptyT = useTranslations("kudos.liveBoard.emptyStates");
  const allT = useTranslations("kudos.liveBoard.allKudos");
  const { items, isEnd, isLoading, isFiltering, loadMore } = useKudoFeed({
    initialFeed,
    initialNextCursor,
    hashtagId,
    departmentId,
    limit,
  });

  if (!isFiltering && items.length === 0) {
    return <EmptyState>{emptyT("feed")}</EmptyState>;
  }

  const canLoadMore = !isEnd && !isLoading && !isFiltering;

  return (
    <div
      className="w-full flex flex-col gap-6 items-center"
      data-testid="kudo-feed"
      aria-busy={isFiltering || isLoading || undefined}
    >
      <ol className="w-full flex flex-col gap-6 items-center list-none p-0 m-0">
        {items.map((kudo) => (
          <li key={kudo.id} className="w-full flex justify-center">
            <KudoPost kudo={kudo} />
          </li>
        ))}
      </ol>

      {!isEnd ? (
        <button
          type="button"
          onClick={() => void loadMore()}
          disabled={!canLoadMore}
          className="inline-flex items-center justify-center h-11 px-6 rounded-full bg-white/10 border border-white/30 text-white text-sm font-bold backdrop-blur transition-opacity hover:bg-white/15 disabled:opacity-60 disabled:cursor-not-allowed"
          data-testid="kudo-feed-load-more"
        >
          {isLoading ? allT("loading") : allT("loadMore")}
        </button>
      ) : null}
    </div>
  );
}
