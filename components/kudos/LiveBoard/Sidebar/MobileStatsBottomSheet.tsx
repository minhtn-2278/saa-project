"use client";

import { useEffect, useRef } from "react";
import { StatsPanel } from "@/components/kudos/LiveBoard/Sidebar/StatsPanel";
import { RecentReceiversList } from "@/components/kudos/LiveBoard/Sidebar/RecentReceiversList";
import { useMyStats } from "@/components/kudos/LiveBoard/Sidebar/use-my-stats";

interface MobileStatsBottomSheetProps {
  open: boolean;
  onClose: () => void;
}

/**
 * Mobile variant of the D sidebar — same three panels, packaged in a
 * `<dialog>` that slides up from the bottom. Dismiss via:
 *   - close button ("×" in the sheet header)
 *   - Esc key (native `<dialog>` behaviour)
 *   - backdrop click (we listen on the `<dialog>` itself and close when
 *     the click target IS the dialog, not its content — the same trick
 *     HTMLDialogElement examples use)
 *
 * Matches design-style.md § Responsive / Mobile — the full-desktop
 * sidebar is hidden below 768 px and this sheet stands in.
 */
export function MobileStatsBottomSheet({
  open,
  onClose,
}: MobileStatsBottomSheetProps) {
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const { stats } = useMyStats();

  // Sync `open` ↔ the native `<dialog>` methods.
  useEffect(() => {
    const d = dialogRef.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  // Native `<dialog>` fires `close` when Esc is pressed or close() runs —
  // mirror that back to the caller so local state stays in sync.
  useEffect(() => {
    const d = dialogRef.current;
    if (!d) return;
    const handleClose = () => onClose();
    d.addEventListener("close", handleClose);
    return () => d.removeEventListener("close", handleClose);
  }, [onClose]);

  function handleBackdropClick(e: React.MouseEvent<HTMLDialogElement>) {
    // If the click target is the dialog element itself (not the content
    // panel inside it) then it was on the backdrop.
    if (e.target === dialogRef.current) {
      onClose();
    }
  }

  return (
    <dialog
      ref={dialogRef}
      aria-label="Thống kê cá nhân"
      onClick={handleBackdropClick}
      className="backdrop:bg-black/60 p-0 m-0 mt-auto w-full max-w-full rounded-t-3xl bg-transparent"
    >
      <div
        className="flex flex-col gap-4 p-5 max-h-[80vh] overflow-y-auto"
        style={{ background: "var(--color-live-page-bg)" }}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">Thống kê</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng"
            className="text-white/70 hover:text-white text-2xl leading-none w-8 h-8 inline-flex items-center justify-center"
          >
            ×
          </button>
        </div>
        <StatsPanel stats={stats} />
        <RecentReceiversList />
      </div>
    </dialog>
  );
}
