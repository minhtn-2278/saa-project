"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { GiftIcon } from "@/components/ui/icons/GiftIcon";
import { MobileStatsBottomSheet } from "@/components/kudos/LiveBoard/Sidebar/MobileStatsBottomSheet";

/**
 * Fixed-position pill (bottom-right) that opens the mobile + tablet
 * `<MobileStatsBottomSheet>`. Visible below `lg` (1024 px) — the sticky
 * `StatsSidebar` takes over at ≥ lg so iPad + phones share the same
 * bottom-sheet UX.
 *
 * The existing FAB (Viết Kudo) also lives at `bottom-6 right-6 z-40`,
 * so this pill sits slightly to its left (`right-[140px]`) to avoid
 * overlap. The two together cover the two most common mobile actions:
 * write a Kudo + peek at my stats.
 */
export function MobileStatsTrigger() {
  const t = useTranslations("kudos.liveBoard.sidebar");
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={t("mobileTrigger")}
        className="lg:hidden fixed bottom-6 right-[140px] z-40 inline-flex items-center gap-2 h-11 px-4 rounded-full bg-white/10 border border-white/30 text-white text-sm font-bold backdrop-blur shadow-md hover:bg-white/15 transition-colors"
      >
        <GiftIcon size={18} />
        {t("mobileTrigger")}
      </button>
      <MobileStatsBottomSheet open={open} onClose={() => setOpen(false)} />
    </>
  );
}
