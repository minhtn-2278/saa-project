"use client";

import { useTranslations } from "next-intl";

export interface RecentReceiverEntry {
  /** Unique key for React (uses `kudo_id` so duplicate names still render). */
  kudoId: number;
  /** Display name (recipient is always shown by real name per FR-002). */
  recipientName: string;
  /** ISO timestamp of when we saw the event — rendered as `HH:MM`. */
  seenAt: string;
}

interface RecentReceiverLogProps {
  /** Newest-first list. Parent trims to ~10 entries. */
  entries: RecentReceiverEntry[];
}

/**
 * B.7.4 — animated vertical log at the bottom-left of the Spotlight canvas.
 *
 * Figma row format (`2940:14170` detail view):
 *   `HH:MM  <Name> đã nhận được một Kudo mới`
 *
 * Time renders in a muted gold tint; message in white with the name bold.
 * New entries fade in via the shared `animate-fade-in-log` keyframes in
 * `app/globals.css`; older rows drift down and get clipped by the top
 * fade-mask (so the log always feels "live" without a height jump).
 */
export function RecentReceiverLog({ entries }: RecentReceiverLogProps) {
  const t = useTranslations("kudos.liveBoard.spotlight");

  if (entries.length === 0) return null;

  return (
    <ul
      aria-live="polite"
      aria-label="Người vừa nhận Kudo"
      className="absolute left-6 bottom-6 w-[320px] max-h-[140px] overflow-hidden flex flex-col gap-1.5 text-xs pointer-events-none"
      style={{
        maskImage:
          "linear-gradient(to bottom, transparent 0, black 24px, black 100%)",
        WebkitMaskImage:
          "linear-gradient(to bottom, transparent 0, black 24px, black 100%)",
      }}
    >
      {entries.map((entry) => (
        <li
          key={entry.kudoId}
          className="flex items-baseline gap-2 opacity-0 animate-fade-in-log"
          style={{ animationFillMode: "forwards" }}
        >
          <time
            dateTime={entry.seenAt}
            className="shrink-0 tabular-nums font-bold"
            style={{ color: "rgba(255, 234, 158, 0.85)" }}
          >
            {formatHHMM(entry.seenAt)}
          </time>
          <span className="text-white/90 truncate">
            {t("recentReceiverMessage", { name: entry.recipientName })}
          </span>
        </li>
      ))}
    </ul>
  );
}

function formatHHMM(iso: string): string {
  const d = new Date(iso);
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}
