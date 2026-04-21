import type { ReactNode } from "react";

interface SectionHeaderProps {
  /** Small uppercase eyebrow (e.g. "Sun* Annual Awards 2025"). */
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
      <div className="flex flex-col gap-1">
        <p className="text-white/80 text-xl font-bold tracking-wide uppercase">
          {eyebrow}
        </p>
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
