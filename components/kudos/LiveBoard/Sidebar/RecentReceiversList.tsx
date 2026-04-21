"use client";

import { useTranslations } from "next-intl";
import { EmptyState } from "@/components/kudos/LiveBoard/parts/EmptyState";

/**
 * D.3 — "10 SUNNER NHẬN QUÀ MỚI NHẤT" panel.
 *
 * Always-empty this release (Secret Box feature deferred — plan § Feature
 * Defer Map). The container shell (gold title + bordered frame) is kept
 * so the sidebar visually matches the Figma design; populating the rows
 * is a follow-up when `secret_boxes` ships.
 */
export function RecentReceiversList() {
  const t = useTranslations("kudos.liveBoard.sidebar");
  const emptyCopy = useTranslations("kudos.liveBoard.emptyStates")(
    "receiverList",
  );

  return (
    <section
      aria-labelledby="live-board-recent-receivers-title"
      className="flex flex-col gap-3 p-6 rounded-2xl border"
      style={{
        background: "var(--color-live-stats-panel-bg)",
        borderColor: "var(--color-live-border-gold)",
      }}
    >
      <h3
        id="live-board-recent-receivers-title"
        className="text-lg font-bold tracking-wide"
        style={{
          color: "var(--color-live-accent-gold)",
          textShadow: "0 4px 4px rgba(0,0,0,0.25), 0 0 6px #FAE287",
        }}
      >
        {t("recentReceiversTitle")}
      </h3>
      <EmptyState className="!py-8 !text-white/60">{emptyCopy}</EmptyState>
    </section>
  );
}
