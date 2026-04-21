/**
 * Suspense fallback for the right-column sidebar (D). Renders the stats
 * panel + 10-receiver list containers with a shimmer.
 *
 * See plan `MaZUn5xHXZ-sun-kudos-live-board` § T023.
 */
export function SidebarSkeleton() {
  return (
    <div
      className="w-[422px] flex flex-col gap-6"
      role="status"
      aria-label="Đang tải thống kê…"
    >
      {/* D.1 stats panel + divider + Mở quà placeholder */}
      <div
        className="rounded-2xl border p-6 flex flex-col gap-4 animate-pulse"
        style={{
          background: "var(--color-live-stats-panel-bg)",
          borderColor: "var(--color-live-border-gold)",
        }}
      >
        {[0, 1, 2].map((i) => (
          <div
            key={`top-${i}`}
            className="h-5 rounded"
            style={{ background: "rgba(255,255,255,0.08)" }}
          />
        ))}
        <div
          className="h-px w-full"
          style={{ background: "var(--color-live-surface-muted)" }}
        />
        {[0, 1].map((i) => (
          <div
            key={`mid-${i}`}
            className="h-5 rounded"
            style={{ background: "rgba(255,255,255,0.08)" }}
          />
        ))}
        <div
          className="h-12 w-full rounded-lg"
          style={{ background: "var(--color-live-surface-muted)" }}
        />
      </div>
      {/* D.3 recent receivers placeholder */}
      <div
        className="rounded-2xl border p-6 flex flex-col gap-3 animate-pulse"
        style={{
          background: "var(--color-live-stats-panel-bg)",
          borderColor: "var(--color-live-border-gold)",
        }}
      >
        <div
          className="h-6 w-2/3 rounded"
          style={{ background: "rgba(255,255,255,0.08)" }}
        />
        {[0, 1, 2].map((i) => (
          <div
            key={`row-${i}`}
            className="h-10 rounded"
            style={{ background: "rgba(255,255,255,0.05)" }}
          />
        ))}
      </div>
    </div>
  );
}
