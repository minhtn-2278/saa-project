"use client";

import { useEffect, useReducer } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { SectionHeader } from "@/components/kudos/LiveBoard/SectionHeader";
import { KudoFeed } from "@/components/kudos/LiveBoard/KudoFeed/KudoFeed";
import { FilterBar } from "@/components/kudos/LiveBoard/FilterBar";
import { HighlightCarousel } from "@/components/kudos/LiveBoard/HighlightCarousel/HighlightCarousel";
import { StatsSidebar } from "@/components/kudos/LiveBoard/Sidebar/StatsSidebar";
import { MobileStatsTrigger } from "@/components/kudos/LiveBoard/Sidebar/MobileStatsTrigger";
import {
  LiveBoardFilterContext,
  initialLiveBoardFilterState,
  liveBoardFilterReducer,
} from "@/components/kudos/LiveBoard/filter-reducer";
import type { PublicKudo } from "@/types/kudos";

export interface LiveBoardClientProps {
  /** Newest-first first page (10 items by default). */
  initialFeed: PublicKudo[];
  /** Next cursor from the initial fetch (null = no more pages). */
  initialNextCursor: string | null;
  /** URL-derived initial filter state — Server Component reads `?hashtagId=&departmentId=` and passes it here. */
  initialHashtagId: number | null;
  initialDepartmentId: number | null;
}

/**
 * Top-level client island for the Sun* Kudos Live board.
 *
 * Phase 5 scope (plan § T064):
 *   - HIGHLIGHT KUDOS (B.1) header row + B.1 filter bar + B.3 carousel.
 *   - ALL KUDOS (C.1) header row + C.2 feed.
 *
 * Responsibilities:
 *   - Owns the filter-reducer state + dispatcher context (plan § T030).
 *   - Mirrors the reducer state to the URL (`?hashtagId=&departmentId=`)
 *     so filters survive refresh + deep-link.
 *   - Sibling components (HighlightCarousel, useKudoFeed) re-read when the
 *     reducer state changes — one dispatch triggers both refetches.
 *   - Hashtag chips inside any card dispatch into the same reducer via
 *     `LiveBoardFilterContext`.
 */
export function LiveBoardClient({
  initialFeed,
  initialNextCursor,
  initialHashtagId,
  initialDepartmentId,
}: LiveBoardClientProps) {
  const t = useTranslations("kudos.liveBoard");
  const router = useRouter();
  const searchParams = useSearchParams();

  const [state, dispatch] = useReducer(liveBoardFilterReducer, {
    ...initialLiveBoardFilterState,
    hashtagId: initialHashtagId,
    departmentId: initialDepartmentId,
  });

  // URL mirror — keep `?hashtagId=&departmentId=` in sync with reducer state.
  useEffect(() => {
    const next = new URLSearchParams(searchParams.toString());
    writeParam(next, "hashtagId", state.hashtagId);
    writeParam(next, "departmentId", state.departmentId);

    const nextQs = next.toString();
    const currentQs = searchParams.toString();
    if (nextQs === currentQs) return;

    router.replace(`?${nextQs}`, { scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.hashtagId, state.departmentId]);

  return (
    <LiveBoardFilterContext.Provider value={dispatch}>
      <section
        aria-labelledby="highlight-kudos-heading"
        className="flex flex-col gap-6 pt-16 pb-10"
      >
        <SectionHeader
          eyebrow={t("eyebrow")}
          title={t("highlight.title")}
          as="h2"
          trailing={
            <FilterBar
              hashtagId={state.hashtagId}
              departmentId={state.departmentId}
            />
          }
        />
        <HighlightCarousel
          hashtagId={state.hashtagId}
          departmentId={state.departmentId}
          carouselIndex={state.carouselIndex}
        />
      </section>

      <section
        aria-labelledby="all-kudos-heading"
        className="flex flex-col gap-6 py-10"
      >
        <SectionHeader
          eyebrow={t("eyebrow")}
          title={t("allKudos.title")}
          as="h2"
        />
        {/* 2-col on lg+: feed (up to 680 px) left, sidebar (422 px) right.
            Below lg (iPad + mobile) the sidebar is hidden and
            `MobileStatsTrigger` brings it back as a bottom-sheet pill —
            iPad at 768 px doesn't leave enough room for both the 680-px
            feed card and the 422-px sidebar, so we collapse earlier than
            the old `md` breakpoint. `min-w-0` on the feed column lets it
            shrink so the sidebar keeps its fixed width. */}
        <div className="flex flex-col lg:flex-row lg:items-start gap-8">
          <div className="flex-1 min-w-0">
            <KudoFeed
              initialFeed={initialFeed}
              initialNextCursor={initialNextCursor}
              hashtagId={state.hashtagId}
              departmentId={state.departmentId}
            />
          </div>
          <StatsSidebar />
        </div>
      </section>

      <MobileStatsTrigger />
    </LiveBoardFilterContext.Provider>
  );
}

function writeParam(
  params: URLSearchParams,
  key: string,
  value: number | null,
): void {
  if (value === null) {
    params.delete(key);
  } else {
    params.set(key, String(value));
  }
}
