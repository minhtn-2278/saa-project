"use client";

import type { SpotlightNode } from "@/types/kudos";

interface SpotlightCanvasProps {
  nodes: SpotlightNode[];
  /** Normalised highlight query; empty string = no highlight. */
  highlightQuery?: string;
}

/**
 * B.7 — Spotlight word-cloud layer (pure render).
 *
 * Matches Figma `2940:14174`: plain white text labels scattered across the
 * canvas at the `{x, y}` positions computed server-side. No avatars, no
 * pills — the Figma shows text-only. Matching the search query flips the
 * label red; non-matches dim to 40 %.
 *
 * Renders as a transparent absolute-positioned layer so the parent
 * `SpotlightBoard` can overlay the total, search, log, etc. on top.
 */
export function SpotlightCanvas({
  nodes,
  highlightQuery = "",
}: SpotlightCanvasProps) {
  const normQuery = highlightQuery.trim().toLocaleLowerCase();
  const maxCount = nodes.reduce((m, n) => Math.max(m, n.kudosCount), 1);

  return (
    <div
      className="absolute inset-0 pointer-events-none"
      aria-label="Spotlight word cloud"
    >
      {nodes.map((node) => {
        const matches =
          normQuery.length > 0 &&
          node.name.toLocaleLowerCase().includes(normQuery);
        const dimmed = normQuery.length > 0 && !matches;
        // 0.85x (quiet) → 1.2x (hottest) font weight on the text node.
        const scale = 0.85 + 0.35 * (node.kudosCount / maxCount);
        const fontSizePx = Math.round(13 * scale);

        return (
          <span
            key={node.id}
            role="note"
            title={`${node.name} — ${node.kudosCount} Kudos`}
            className="absolute -translate-x-1/2 -translate-y-1/2 whitespace-nowrap font-semibold transition-[left,top,opacity,color] duration-500 ease-out"
            style={{
              left: `${node.x * 100}%`,
              top: `${node.y * 100}%`,
              fontSize: `${fontSizePx}px`,
              color: matches
                ? "var(--color-live-accent-red, #B72927)"
                : "rgba(255, 255, 255, 0.85)",
              opacity: dimmed ? 0.4 : 1,
              textShadow: matches
                ? "0 0 8px rgba(183, 41, 39, 0.6)"
                : "0 1px 2px rgba(0, 0, 0, 0.6)",
            }}
          >
            {node.name}
          </span>
        );
      })}
    </div>
  );
}
