"use client";

import { useTranslations } from "next-intl";
import { OpenSecretBoxButton } from "@/components/kudos/LiveBoard/Sidebar/OpenSecretBoxButton";
import type { MyStatsResponse } from "@/types/kudos";

interface StatsPanelProps {
  /**
   * Server-truth stats. Parent fetches `/api/me/stats` and passes the
   * `data` payload down — or `null` while loading / errored so the rows
   * show a `–` placeholder instead of stale numbers.
   */
  stats: MyStatsResponse["data"] | null;
}

/**
 * D.1 stats panel — 5 numeric rows + a divider between rows 3 and 4
 * (kudosReceived / kudosSent / heartsReceived | boxesOpened / boxesUnopened).
 *
 * Visual tokens per design-style.md § D:
 *   - Background `--color-live-stats-panel-bg` (rgba(16,20,23,0.80))
 *   - Border 1px `--color-live-border-gold` (#998C5F)
 *   - Radius 16, padding 24, gap 16
 *   - Each row is `flex justify-between` with label left / value right
 *   - Divider: 1px `--color-live-surface-muted` (#2E3940)
 *
 * Box rows show `0` this release (feature deferred — see plan § Feature
 * Defer Map). When `stats === null` every value renders as `–` so the
 * UI doesn't flash zeros during load.
 */
export function StatsPanel({ stats }: StatsPanelProps) {
  const t = useTranslations("kudos.liveBoard.sidebar.stats");

  const fmt = (v: number | undefined): string =>
    typeof v === "number" ? v.toLocaleString("vi-VN") : "–";

  const topRows: Array<{ key: string; label: string; value: number | undefined }> = [
    { key: "kudosReceived", label: t("kudosReceived"), value: stats?.kudosReceived },
    { key: "kudosSent", label: t("kudosSent"), value: stats?.kudosSent },
    { key: "heartsReceived", label: t("heartsReceived"), value: stats?.heartsReceived },
  ];
  const bottomRows: Array<{ key: string; label: string; value: number }> = [
    { key: "boxesOpened", label: t("boxesOpened"), value: 0 },
    { key: "boxesUnopened", label: t("boxesUnopened"), value: 0 },
  ];

  return (
    <section
      aria-label="Thống kê cá nhân"
      className="flex flex-col gap-4 p-6 rounded-2xl border"
      style={{
        background: "var(--color-live-stats-panel-bg)",
        borderColor: "var(--color-live-border-gold)",
      }}
    >
      {topRows.map((row) => (
        <StatRow key={row.key} label={row.label} value={fmt(row.value)} />
      ))}
      <hr
        aria-hidden
        className="w-full h-px border-0"
        style={{ background: "var(--color-live-surface-muted)" }}
      />
      {bottomRows.map((row) => (
        <StatRow key={row.key} label={row.label} value={fmt(row.value)} />
      ))}
      {/* D.1.8 `Mở quà` — nested inside the D.1 panel per design-style.md
          (always-disabled this release; feature deferred). */}
      <OpenSecretBoxButton />
    </section>
  );
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 text-base">
      <span className="text-white/90">{label}</span>
      <span
        className="font-bold tabular-nums"
        style={{ color: "var(--color-live-accent-gold)" }}
      >
        {value}
      </span>
    </div>
  );
}
