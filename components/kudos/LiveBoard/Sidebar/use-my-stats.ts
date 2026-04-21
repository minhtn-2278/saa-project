"use client";

import { useCallback, useEffect, useState } from "react";
import type { MyStatsResponse } from "@/types/kudos";

type Stats = MyStatsResponse["data"];

interface UseMyStatsResult {
  stats: Stats | null;
  error: Error | null;
  refresh: () => void;
}

/**
 * Client-side `/api/me/stats` loader for the Live-board sidebar.
 *
 * Returns `stats: null` during the initial load + when the fetch fails —
 * `StatsPanel` renders `–` placeholders in that case. The `refresh`
 * callback re-fetches on demand (used by the US7 optimistic flow: after
 * `kudo:created` is dispatched by the Write modal, the sidebar refreshes
 * so `kudosSent` reconciles with server truth).
 *
 * We do NOT keep an optimistic counter here — the spec (§ US7 AS#2)
 * allows a small delay before the sidebar reflects the new send, so the
 * simpler refetch-on-event path is preferred over a custom optimistic
 * cache.
 */
export function useMyStats(): UseMyStatsResult {
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const load = useCallback(async (signal?: AbortSignal) => {
    try {
      const res = await fetch("/api/me/stats", {
        credentials: "include",
        signal,
      });
      if (!res.ok) throw new Error(`GET /api/me/stats ${res.status}`);
      const json = (await res.json()) as MyStatsResponse;
      if (signal?.aborted) return;
      setStats(json.data);
      setError(null);
    } catch (e) {
      if (signal?.aborted) return;
      if (e instanceof Error && e.name === "AbortError") return;
      setError(e instanceof Error ? e : new Error(String(e)));
    }
  }, []);

  useEffect(() => {
    const ctrl = new AbortController();
    void load(ctrl.signal);
    return () => ctrl.abort();
  }, [load]);

  // Refresh whenever the Write modal dispatches `kudo:created`.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const onCreated = () => {
      void load();
    };
    window.addEventListener("kudo:created", onCreated);
    return () => window.removeEventListener("kudo:created", onCreated);
  }, [load]);

  const refresh = useCallback(() => {
    void load();
  }, [load]);

  return { stats, error, refresh };
}
