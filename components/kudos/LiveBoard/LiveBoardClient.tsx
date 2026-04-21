"use client";

import { useEffect, useMemo, useReducer } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { SectionHeader } from "@/components/kudos/LiveBoard/SectionHeader";
import { KudoFeed } from "@/components/kudos/LiveBoard/KudoFeed/KudoFeed";
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
 * **Phase 3 scope (MVP — US1 Browse + US7 Write entry)**: only the ALL
 * KUDOS feed + its enclosing `SectionHeader(C.1)` are mounted. Phase 4–9
 * will bolt on `FilterBar`, `HighlightCarousel`, `StatsSidebar`, and the
 * Spotlight board alongside this island — no rewrite needed.
 *
 * Responsibilities:
 *   - Owns the filter-reducer state + dispatcher context (plan § T044).
 *   - Mirrors the reducer state to the URL (`?hashtagId=&departmentId=`)
 *     so filters survive refresh + deep-link.
 *   - Seeds the reducer from URL params at mount via `hydrate`.
 *
 * Plan § T044.
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
  // Runs on every change after mount; skips the initial sync since the URL
  // is already the source of truth at hydration time.
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

  // Prepend-on-submit bridge — when the Viết Kudo modal dispatches a
  // `kudo:created` window event, inject the new row at the top of the feed
  // via the `useKudoFeed` hook's `prepend` API. Plan § T050 wires this up
  // in Phase 4 (US7 Write entry); Phase 3 mounts the bridge as a no-op so
  // later phases only add, never restructure. Currently the bridge is
  // owned by `KudoFeed` internally (not exposed here) — we keep this
  // effect as a future hook point.
  useMemo(() => state, [state]); // no-op retention; intentionally narrow state exposure

  return (
    <LiveBoardFilterContext.Provider value={dispatch}>
      <section
        aria-labelledby="all-kudos-heading"
        className="flex flex-col gap-6 py-10"
      >
        <SectionHeader
          eyebrow={t("eyebrow")}
          title={t("allKudos.title")}
          as="h2"
        />
        <KudoFeed
          initialFeed={initialFeed}
          initialNextCursor={initialNextCursor}
          hashtagId={state.hashtagId}
          departmentId={state.departmentId}
        />
      </section>
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
