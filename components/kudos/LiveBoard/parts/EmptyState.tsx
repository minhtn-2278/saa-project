import type { ReactNode } from "react";

interface EmptyStateProps {
  /** Body copy. Can be a plain string or a rich React node. */
  children: ReactNode;
  /** Optional extra className for alignment / spacing overrides. */
  className?: string;
}

/**
 * Shared empty-state block for the Live board. Used by:
 *   - ALL KUDOS feed (C.2) when the filter result is empty
 *     ("Hiện tại chưa có Kudos nào.")
 *   - Recent receivers list (D.3) when Secret Box data is deferred
 *     ("Chưa có dữ liệu")
 *   - Spotlight canvas (B.7) during a quiet 24h window
 *     ("Chưa có Kudos nào trong 24 giờ qua — hãy là người mở màn!")
 *
 * Intentionally minimal — the dark dashboard palette does most of the
 * visual work. Exposed as a primitive so copy changes land in one place.
 *
 * See plan `MaZUn5xHXZ-sun-kudos-live-board` § T025.
 */
export function EmptyState({ children, className }: EmptyStateProps) {
  return (
    <p
      className={`text-center text-base md:text-lg text-white/60 py-20 px-6 ${
        className ?? ""
      }`.trim()}
      role="status"
    >
      {children}
    </p>
  );
}
