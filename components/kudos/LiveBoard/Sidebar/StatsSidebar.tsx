"use client";

import { StatsPanel } from "@/components/kudos/LiveBoard/Sidebar/StatsPanel";
import { RecentReceiversList } from "@/components/kudos/LiveBoard/Sidebar/RecentReceiversList";
import { useMyStats } from "@/components/kudos/LiveBoard/Sidebar/use-my-stats";

/**
 * D — right-column sticky sidebar (desktop only, `hidden lg:flex`).
 *
 * Width is fixed at 422 px per design-style.md § D. Sidebar hides below
 * `lg` (1024 px) — iPad at 768 px doesn't leave room for the 680-px feed
 * card + 422-px sidebar without clipping content, so iPad sees the
 * `MobileStatsTrigger` pill + bottom-sheet instead.
 *
 * The sticky offset `top-[88px] lg:top-[104px]` clears the dashboard
 * header (plan § Risk: "Sticky sidebar overlaps fixed header").
 * `self-start` is required so the flex child doesn't stretch to its
 * container's full height and defeat the sticky positioning.
 */
export function StatsSidebar() {
  const { stats } = useMyStats();

  return (
    <aside
      aria-label="Thanh bên thống kê"
      className="hidden lg:flex w-[422px] shrink-0 flex-col gap-6 self-start sticky top-[88px] lg:top-[104px]"
    >
      <StatsPanel stats={stats} />
      <RecentReceiversList />
    </aside>
  );
}
