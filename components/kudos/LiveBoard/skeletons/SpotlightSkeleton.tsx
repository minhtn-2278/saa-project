/**
 * Suspense fallback for the Spotlight board (B.7). Renders the canvas
 * outline with a pulsing gold border so the row's height is stable while
 * `GET /api/spotlight` resolves.
 *
 * See plan `MaZUn5xHXZ-sun-kudos-live-board` § T023, § B.7 Loading state.
 */
export function SpotlightSkeleton() {
  return (
    <div
      className="w-full max-w-[1157px] h-[548px] mx-auto rounded-[47.14px] border animate-pulse"
      style={{
        borderColor: "var(--color-live-border-gold)",
        background:
          "radial-gradient(ellipse at center, rgba(9,36,50,0.5), var(--color-live-page-bg) 75%)",
      }}
      role="status"
      aria-label="Đang tải Spotlight…"
    />
  );
}
