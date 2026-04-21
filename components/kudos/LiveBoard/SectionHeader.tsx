import type { ReactNode } from "react";

interface SectionHeaderProps {
  /** Small eyebrow (e.g. "Sun* Annual Awards 2025") — rendered as-is, not uppercased. */
  eyebrow: string;
  /** Big gold display title (e.g. "HIGHLIGHT KUDOS"). */
  title: string;
  /** Optional trailing slot — used by B.1 for the filter triggers. */
  trailing?: ReactNode;
  /** Optional heading level override (defaults to h2). */
  as?: "h1" | "h2" | "h3";
  className?: string;
}

/**
 * Shared eyebrow + display-title row used by B.1 (HIGHLIGHT KUDOS),
 * B.6 (SPOTLIGHT BOARD), and C.1 (ALL KUDOS). Typography matches
 * design-style.md § Typography (`--text-h4` eyebrow + `--text-display` 57/700
 * gold title with glow shadow).
 *
 * Visual per Figma (MaZUn5xHXZ):
 *   eyebrow           ← rendered as-is (no uppercase transform)
 *   ──────  ⟵ thin olive divider between the two lines
 *   TITLE (gold)
 *
 * See plan `MaZUn5xHXZ-sun-kudos-live-board` § T024.
 */
export function SectionHeader({
  eyebrow,
  title,
  trailing,
  as: HeadingTag = "h2",
  className,
}: SectionHeaderProps) {
  return (
    <header
      className={`flex flex-col gap-2 ${
        trailing ? "md:flex-row md:items-end md:justify-between md:gap-6" : ""
      } ${className ?? ""}`.trim()}
    >
      <div className="flex flex-col gap-3">
        <p className="text-white/80 text-xl font-bold tracking-wide">
          {eyebrow}
        </p>
        {/* Figma divider (B.1 / B.6 / C.1 — full-width thin light-grey rule
            between the eyebrow and the big display title). Spans the
            header's container width so it visually separates the two
            rows. Subtle low-alpha white on the dark page bg. */}
        <hr
          aria-hidden="true"
          className="w-full h-px border-0"
          style={{ background: "rgba(255, 255, 255, 0.2)" }}
        />
        <HeadingTag
          className="text-[40px] md:text-[57px] leading-[1.12] font-black tracking-[0.02em]"
          style={{
            color: "var(--color-live-accent-gold)",
            textShadow: "var(--glow-live-gold-lg)",
          }}
        >
          {title}
        </HeadingTag>
      </div>
      {trailing ? (
        <div className="flex items-center gap-4 flex-wrap">{trailing}</div>
      ) : null}
    </header>
  );
}
