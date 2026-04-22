"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { PublicKudo } from "@/types/kudos";

export interface UseKudoFeedOptions {
  /** Initial page rendered by the Server Component. */
  initialFeed: PublicKudo[];
  /** Next cursor returned by the initial fetch. `null` means no more pages. */
  initialNextCursor: string | null;
  /** Current Hashtag filter — triggers a refetch when it changes. */
  hashtagId: number | null;
  /** Current Department filter — triggers a refetch when it changes. */
  departmentId: number | null;
  /** Page size. Default = 10 per page — the "Xem tiếp" button shows once
   *  the first page is full and the cursor is non-null. Caller can override. */
  limit?: number;
}

export interface UseKudoFeedResult {
  items: PublicKudo[];
  isLoading: boolean;
  isFiltering: boolean;
  /** Truthy when no more pages remain for the current filter combination. */
  isEnd: boolean;
  error: Error | null;
  /** Pull the next page. Safe to call repeatedly — no-op while loading / ended. */
  loadMore: () => Promise<void>;
  /**
   * Prepend a Kudo to the feed (optimistic prepend used by US7 after a
   * Viết Kudo submit). Caller is responsible for deduping.
   */
  prepend: (kudo: PublicKudo) => void;
}

/**
 * Cursor-based feed hook for the Live-board ALL KUDOS block (C.2).
 *
 * Responsibilities:
 *   - Seeds state from the Server Component's initial fetch.
 *   - Refetches from scratch when `hashtagId` / `departmentId` change.
 *   - Advances via `meta.nextCursor` through subsequent pages.
 *   - Exposes `prepend` for US7's optimistic "Kudo you just submitted"
 *     insert — keeps the new card at the top while the next server
 *     refresh resolves.
 *
 * Plan § T043.
 */
export function useKudoFeed({
  initialFeed,
  initialNextCursor,
  hashtagId,
  departmentId,
  limit = 10,
}: UseKudoFeedOptions): UseKudoFeedResult {
  const [items, setItems] = useState<PublicKudo[]>(initialFeed);
  const [cursor, setCursor] = useState<string | null>(initialNextCursor);
  const [isLoading, setIsLoading] = useState(false);
  const [isFiltering, setIsFiltering] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Tracks the filter combo that the current state reflects. When it
  // changes we refetch from scratch.
  const filterSigRef = useRef<string>(makeSig(hashtagId, departmentId));
  const initialSig = makeSig(null, null);
  // If the Server Component was passed filters via props (initial URL
  // params), the initial state already reflects them — don't refetch.
  const hasHydratedRef = useRef(false);

  // AbortController for the in-flight request. Always kill the previous
  // one before starting a new fetch (covers rapid filter toggles).
  const abortRef = useRef<AbortController | null>(null);

  const fetchPage = useCallback(
    async (
      hId: number | null,
      dId: number | null,
      pageCursor: string | null,
      mode: "replace" | "append",
    ) => {
      const controller = new AbortController();
      abortRef.current?.abort();
      abortRef.current = controller;

      const params = new URLSearchParams();
      params.set("limit", String(limit));
      if (pageCursor) params.set("cursor", pageCursor);
      if (hId !== null) params.set("hashtagId", String(hId));
      if (dId !== null) params.set("departmentId", String(dId));

      try {
        if (mode === "replace") setIsFiltering(true);
        else setIsLoading(true);
        const res = await fetch(`/api/kudos?${params.toString()}`, {
          signal: controller.signal,
          credentials: "include",
        });
        if (!res.ok) throw new Error(`GET /api/kudos ${res.status}`);
        const json = (await res.json()) as {
          data: PublicKudo[];
          meta: { limit: number; nextCursor: string | null };
        };
        // Abort guards — in case a later fetch superseded us.
        if (controller.signal.aborted) return;
        setItems((prev) =>
          mode === "replace" ? json.data : [...prev, ...json.data],
        );
        setCursor(json.meta.nextCursor ?? null);
        setError(null);
      } catch (e) {
        if (controller.signal.aborted) return;
        setError(e instanceof Error ? e : new Error(String(e)));
      } finally {
        if (controller.signal.aborted) return;
        setIsLoading(false);
        setIsFiltering(false);
      }
    },
    [limit],
  );

  // Refetch on filter change (but skip the very first render — the
  // Server Component already delivered the matching initial page).
  useEffect(() => {
    const sig = makeSig(hashtagId, departmentId);
    if (!hasHydratedRef.current) {
      hasHydratedRef.current = true;
      filterSigRef.current = sig;
      // Skip this pass — respect the initial props we were given.
      return;
    }
    if (sig === filterSigRef.current) return;
    filterSigRef.current = sig;
    void fetchPage(hashtagId, departmentId, null, "replace");
  }, [hashtagId, departmentId, fetchPage]);

  const loadMore = useCallback(async () => {
    if (isLoading || isFiltering || cursor === null) return;
    await fetchPage(hashtagId, departmentId, cursor, "append");
  }, [cursor, isLoading, isFiltering, hashtagId, departmentId, fetchPage]);

  const prepend = useCallback((kudo: PublicKudo) => {
    setItems((prev) => {
      if (prev.some((k) => k.id === kudo.id)) return prev;
      return [kudo, ...prev];
    });
  }, []);

  // US7 AS#2 — listen for the `kudo:created` window event dispatched by the
  // Viết Kudo modal on a successful submit, and optimistically prepend the
  // returned `PublicKudo` to the top of the feed. Dedupe-by-id via `prepend`
  // keeps this safe across duplicate dispatches + revalidation races.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const handler = (e: Event) => {
      const ce = e as CustomEvent<unknown>;
      if (isPublicKudo(ce.detail)) prepend(ce.detail);
    };
    window.addEventListener("kudo:created", handler as EventListener);
    return () => {
      window.removeEventListener("kudo:created", handler as EventListener);
    };
  }, [prepend]);

  // Tell the compiler our ref is used intentionally.
  void initialSig;

  return {
    items,
    isLoading,
    isFiltering,
    isEnd: cursor === null,
    error,
    loadMore,
    prepend,
  };
}

function makeSig(h: number | null, d: number | null): string {
  return `${h ?? ""}:${d ?? ""}`;
}

/**
 * Narrow duck-type check for the `kudo:created` custom-event payload.
 * Intentionally loose — we only validate the fields we read in the hook
 * (dedup by id) and the props `KudoPost` relies on.
 */
function isPublicKudo(value: unknown): value is PublicKudo {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return typeof v.id === "number" && typeof v.bodyPlain === "string";
}
