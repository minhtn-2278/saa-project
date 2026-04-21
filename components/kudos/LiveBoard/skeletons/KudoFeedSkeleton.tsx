interface KudoFeedSkeletonProps {
  /** Number of card placeholders to render. Defaults to 3 for the initial
   *  viewport; caller can raise it for tests. */
  count?: number;
}

/**
 * Suspense fallback for the ALL KUDOS feed (C.2). Renders `count` cream
 * card placeholders so the feed's height is stable while the streamed
 * `GET /api/kudos` response resolves.
 *
 * See plan `MaZUn5xHXZ-sun-kudos-live-board` § T023.
 */
export function KudoFeedSkeleton({ count = 3 }: KudoFeedSkeletonProps) {
  return (
    <div
      className="flex flex-col gap-6"
      role="status"
      aria-label="Đang tải danh sách Kudos…"
    >
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="w-[680px] h-[400px] rounded-3xl animate-pulse"
          style={{ background: "var(--color-live-accent-cream)" }}
          aria-hidden="true"
        />
      ))}
    </div>
  );
}
