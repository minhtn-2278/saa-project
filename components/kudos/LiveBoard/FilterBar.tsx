"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { AnchoredSingleSelect } from "@/components/kudos/LiveBoard/parts/AnchoredSingleSelect";
import { useLiveBoardFilterDispatch } from "@/components/kudos/LiveBoard/filter-reducer";

interface HashtagOption {
  id: number;
  label: string;
}

interface DepartmentOption {
  id: number;
  code: string;
  name: string | null;
}

export interface FilterBarProps {
  /** Current Hashtag filter (reducer state). */
  hashtagId: number | null;
  /** Current Department filter (reducer state). */
  departmentId: number | null;
  /** Trailing slot inside the Highlight section header row. */
  className?: string;
}

/**
 * B.1 Filter bar — Hashtag (B.1.1) + Phòng ban (B.1.2) dropdowns that apply
 * to BOTH the Highlight carousel and the ALL KUDOS feed via the shared
 * `LiveBoardFilterContext` reducer.
 *
 * Per plan Q-A2: Hashtag dropdown limits to the top-10 most-used tags
 * (`?sort=usage&limit=10`). Department dropdown loads the full flat list
 * from `GET /api/departments` (cached server-side via `unstable_cache`).
 *
 * Plan § T062.
 */
export function FilterBar({ hashtagId, departmentId, className }: FilterBarProps) {
  const t = useTranslations("kudos.liveBoard.filter");
  const dispatch = useLiveBoardFilterDispatch();

  const [hashtags, setHashtags] = useState<HashtagOption[]>([]);
  const [departments, setDepartments] = useState<DepartmentOption[]>([]);

  useEffect(() => {
    const ctrl = new AbortController();
    void (async () => {
      try {
        const res = await fetch("/api/hashtags?limit=10&sort=usage", {
          signal: ctrl.signal,
          credentials: "include",
        });
        if (!res.ok) return;
        const json = (await res.json()) as {
          data: Array<{ id: number; label: string }>;
        };
        if (ctrl.signal.aborted) return;
        setHashtags(json.data);
      } catch {
        // Silent — dropdown just stays empty; filter still usable via URL.
      }
    })();
    return () => ctrl.abort();
  }, []);

  useEffect(() => {
    const ctrl = new AbortController();
    void (async () => {
      try {
        const res = await fetch("/api/departments", {
          signal: ctrl.signal,
          credentials: "include",
        });
        if (!res.ok) return;
        const json = (await res.json()) as {
          data: Array<{ id: number; code: string; name: string | null }>;
        };
        if (ctrl.signal.aborted) return;
        setDepartments(json.data);
      } catch {
        // Silent for the same reason as above.
      }
    })();
    return () => ctrl.abort();
  }, []);

  const hashtagItems = useMemo(
    () =>
      hashtags.map((h) => ({
        value: h.id,
        label: h.label.startsWith("#") ? h.label : `#${h.label}`,
      })),
    [hashtags],
  );

  const departmentItems = useMemo(
    () =>
      departments.map((d) => ({
        value: d.id,
        label: d.code,
      })),
    [departments],
  );

  return (
    <div className={["flex items-center gap-4 flex-wrap", className ?? ""].join(" ")}>
      <AnchoredSingleSelect
        triggerLabel={t("hashtag")}
        items={hashtagItems}
        value={hashtagId}
        onChange={(next) =>
          dispatch({ type: "setHashtag", id: next === null ? null : (next as number) })
        }
        ariaLabel={t("hashtag")}
      />
      <AnchoredSingleSelect
        triggerLabel={t("department")}
        items={departmentItems}
        value={departmentId}
        onChange={(next) =>
          dispatch({
            type: "setDepartment",
            id: next === null ? null : (next as number),
          })
        }
        ariaLabel={t("department")}
      />
    </div>
  );
}
