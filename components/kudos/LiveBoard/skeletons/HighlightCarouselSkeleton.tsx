/**
 * Suspense fallback for the HIGHLIGHT KUDOS carousel (B.2). Renders three
 * faded Highlight-card placeholders so the row's height is stable while the
 * streamed `GET /api/kudos/highlight` response resolves.
 *
 * See plan `MaZUn5xHXZ-sun-kudos-live-board` § T023.
 */
export function HighlightCarouselSkeleton() {
  return (
    <div
      className="flex items-center justify-center gap-4 py-8"
      role="status"
      aria-label="Đang tải Highlight Kudos…"
    >
      {/* 3 cards — center one full-opacity, neighbours faded, matching the
          real carousel's center-focused layout (design-style.md § B.2). */}
      {[0.5, 1, 0.5].map((opacity, i) => (
        <div
          key={i}
          className="w-[528px] h-[420px] rounded-2xl border-4 animate-pulse"
          style={{
            opacity,
            background: "var(--color-live-accent-cream)",
            borderColor: "var(--color-live-accent-gold)",
            transform: i === 1 ? "scale(1)" : "scale(0.92)",
          }}
          aria-hidden="true"
        />
      ))}
    </div>
  );
}
