"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { EMPLOYEE_SEARCH_DEBOUNCE_MS } from "@/lib/constants/kudos";
import type { EmployeePreview } from "./useKudoForm";

interface ApiEmployee {
  id: number;
  fullName: string;
  avatarUrl: string | null;
  department: string | null;
}

interface UseEmployeeSearchOptions {
  /** Include the current user in results (mention mode). Default false. */
  includeCaller?: boolean;
}

/**
 * Debounced employee autocomplete (TR-002: 250 ms debounce +
 * `AbortController` cancellation).
 *
 * Returns `{ results, loading, search }`. The caller is responsible for
 * calling `search(q)` from its onChange handler.
 */
export function useEmployeeSearch(options: UseEmployeeSearchOptions = {}) {
  const { includeCaller = false } = options;
  const [results, setResults] = useState<EmployeePreview[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const controllerRef = useRef<AbortController | null>(null);

  // Abort any inflight on unmount.
  useEffect(() => {
    return () => {
      controllerRef.current?.abort();
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const search = useCallback(
    (rawQuery: string) => {
      const q = rawQuery.trim();
      // Cancel inflight.
      controllerRef.current?.abort();
      if (debounceRef.current) clearTimeout(debounceRef.current);

      if (q.length === 0) {
        setResults([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      debounceRef.current = setTimeout(async () => {
        const controller = new AbortController();
        controllerRef.current = controller;
        try {
          const params = new URLSearchParams({
            q,
            ignore_caller: includeCaller ? "false" : "true",
          });
          const res = await fetch(`/api/employees/search?${params}`, {
            signal: controller.signal,
          });
          if (!res.ok) {
            setResults([]);
            return;
          }
          const json = (await res.json()) as { data: ApiEmployee[] };
          setResults(
            json.data.map((e) => ({
              id: e.id,
              fullName: e.fullName,
              avatarUrl: e.avatarUrl,
              department: e.department,
            })),
          );
        } catch (err) {
          if ((err as Error).name !== "AbortError") {
            console.error("useEmployeeSearch error", err);
          }
        } finally {
          if (controllerRef.current === controller) {
            setLoading(false);
            controllerRef.current = null;
          }
        }
      }, EMPLOYEE_SEARCH_DEBOUNCE_MS);
    },
    [includeCaller],
  );

  return { results, loading, search };
}
