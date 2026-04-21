"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { SendIcon } from "@/components/ui/icons/SendIcon";
import { ProfileHoverTarget } from "@/components/kudos/LiveBoard/parts/ProfileHoverTarget";
import { HashtagChip } from "@/components/kudos/LiveBoard/parts/HashtagChip";
import { AttachmentGrid } from "@/components/kudos/LiveBoard/parts/AttachmentGrid";
import { HeartsButton } from "@/components/kudos/LiveBoard/parts/HeartsButton";
import { CopyLinkButton } from "@/components/kudos/LiveBoard/parts/CopyLinkButton";
import type { PublicKudo } from "@/types/kudos";

interface HighlightCardProps {
  kudo: PublicKudo;
  /**
   * Whether this card is the currently-focused slide. Neighbours render at
   * half opacity + 92 % scale (see design-style.md § B.2). Passed by the
   * carousel wrapper so the card itself stays a pure render.
   */
  focused?: boolean;
}

/**
 * B.3 Highlight card — matches Figma node `1949-12832` (same Kudo visual
 * as [KudoPost], narrower 528 px width + gold border + 3-line body clamp).
 *
 * Structure mirrors `KudoPost`:
 *   1. Header — two centered columns + send icon.
 *   2. Divider.
 *   3. Time.
 *   4. Title (centered, uppercase).
 *   5. Content box (tinted, 3-line clamp).
 *   6. Attachment grid.
 *   7. Hashtags (red plain text).
 *   8. Divider.
 *   9. Footer — hearts + Copy Link.
 */
export function HighlightCard({ kudo, focused = true }: HighlightCardProps) {
  const t = useTranslations("kudos.liveBoard.card");
  const heartCount = kudo.heartCount ?? 0;
  const heartedByMe = kudo.heartedByMe ?? false;
  const canHeart = kudo.canHeart ?? false;

  const sender = {
    id: kudo.isAnonymous ? 0 : -1,
    name: kudo.senderName,
    avatarUrl: kudo.senderAvatarUrl,
    isAnonymous: kudo.isAnonymous,
    subtitle: kudo.senderDepartment,
  };
  const recipient = {
    id: kudo.recipientId,
    name: kudo.recipientName,
    avatarUrl: kudo.recipientAvatarUrl,
    isAnonymous: false,
    subtitle: kudo.recipientDepartment,
  };

  return (
    <article
      aria-labelledby={`highlight-${kudo.id}-sender`}
      aria-hidden={!focused || undefined}
      tabIndex={focused ? 0 : -1}
      className={[
        // Responsive width: fills its slot up to 640 px. Parent carousel
        // sizes the slot so one card fits on narrow viewports and the
        // neighbouring cards peek on wider ones.
        "w-full rounded-2xl p-5 md:p-6 flex flex-col gap-3 shrink-0",
        // Fixed vertical footprint — every card in the carousel is exactly
        // this tall regardless of content. `overflow-hidden` is the backstop
        // for very long hashtag rows / attachments; the body paragraph has
        // its own `line-clamp` so the primary truncation is a clean `…`.
        "h-[560px] max-h-[560px] overflow-hidden",
        "shadow-[0_4px_4px_rgba(0,0,0,0.25)]",
        // Non-focused cards render at full opacity + full scale so all
        // three visible cards look identical — requested by the user over
        // the original B.2 spec (which called for dim + 92 % neighbours).
        // `pointer-events-none` on unfocused cards keeps clicks/hovers
        // targeting the centre card only; tabIndex above handles keyboard.
        focused ? "" : "pointer-events-none",
      ].join(" ")}
      style={{
        background: "var(--color-live-accent-cream)",
        color: "var(--color-live-text-on-cream)",
        border: "4px solid var(--color-live-accent-gold)",
      }}
    >
      {/* 1. Header */}
      <header className="flex items-center gap-3">
        <PartyColumn
          labelId={`highlight-${kudo.id}-sender`}
          party={sender}
        />
        <span
          aria-hidden
          className="shrink-0 text-[var(--color-live-text-on-cream)]"
        >
          <SendIcon size={24} />
        </span>
        <PartyColumn party={recipient} />
      </header>

      {/* 2. Divider */}
      <hr
        aria-hidden
        className="w-full h-px border-0"
        style={{ background: "var(--color-live-divider-on-cream)" }}
      />

      {/* 3. Time */}
      <time
        dateTime={kudo.createdAt}
        className="text-sm"
        style={{ color: "rgba(0, 16, 26, 0.60)" }}
      >
        {formatTime(kudo.createdAt)}
      </time>

      {/* 4. Title */}
      <h3 className="text-center text-base md:text-lg font-bold tracking-[0.06em] uppercase">
        {kudo.title.name}
      </h3>

      {/* 5. Content box — fixed height, 4-line clamp + ellipsis */}
      <div
        className="rounded-xl px-5 py-4 h-[170px] overflow-hidden"
        style={{ background: "var(--color-live-content-tint)" }}
      >
        <p className="text-sm md:text-base font-bold leading-relaxed whitespace-pre-wrap line-clamp-4">
          {kudo.bodyPlain}
        </p>
      </div>

      {/* 6. Attachments */}
      {kudo.images.length > 0 ? <AttachmentGrid images={kudo.images} /> : null}

      {/* 7. Hashtags */}
      {kudo.hashtags.length > 0 ? (
        <ul
          className="flex flex-wrap gap-x-3 gap-y-1 line-clamp-2"
          aria-label="Hashtag"
        >
          {kudo.hashtags.map((h) => (
            <li key={h.id}>
              <HashtagChip id={h.id} label={h.label} variant="plain" />
            </li>
          ))}
        </ul>
      ) : null}

      {/* 8. Divider (mt-auto pushes divider + footer to the card's bottom) */}
      <hr
        aria-hidden
        className="w-full h-px border-0 mt-auto"
        style={{ background: "var(--color-live-divider-on-cream)" }}
      />

      {/* 9. Footer */}
      <footer className="flex items-center justify-between">
        <HeartsButton
          kudoId={kudo.id}
          count={heartCount}
          hearted={heartedByMe}
          canHeart={canHeart}
        />
        <div className="flex items-center gap-4">
          <CopyLinkButton kudoId={kudo.id} />
          <button
            type="button"
            disabled
            aria-disabled="true"
            title={t("disabledTitle")}
            className="text-sm md:text-base font-bold cursor-not-allowed opacity-50"
          >
            {t("viewDetail")}
          </button>
        </div>
      </footer>
    </article>
  );
}

// -----------------------------------------------------------------------------
// Sub-components
// -----------------------------------------------------------------------------

interface PartyColumnProps {
  labelId?: string;
  party: {
    id: number;
    name: string;
    avatarUrl: string | null;
    isAnonymous: boolean;
    subtitle: string | null;
  };
}

function PartyColumn({ labelId, party }: PartyColumnProps) {
  const hasProfile = !party.isAnonymous && party.id > 0;

  const content = (
    <div className="flex flex-col items-center gap-2 min-w-0">
      {party.avatarUrl ? (
        <Image
          src={party.avatarUrl}
          alt=""
          width={64}
          height={64}
          className="w-16 h-16 rounded-full object-cover"
          unoptimized
        />
      ) : (
        <span
          className="w-16 h-16 rounded-full"
          aria-hidden
          style={{ background: "var(--color-live-accent-gold)" }}
        />
      )}
      <span
        id={labelId}
        className="font-bold text-sm md:text-base text-center leading-snug line-clamp-1"
      >
        {party.name}
      </span>
      {party.subtitle ? (
        <span className="text-xs opacity-70 text-center leading-snug line-clamp-1">
          {party.subtitle}
        </span>
      ) : null}
    </div>
  );

  const columnClasses = "flex-1 basis-0 min-w-0";
  if (!hasProfile) return <div className={columnClasses}>{content}</div>;
  return (
    <ProfileHoverTarget employeeId={party.id} className={columnClasses}>
      {content}
    </ProfileHoverTarget>
  );
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  const MM = String(d.getMonth() + 1).padStart(2, "0");
  const DD = String(d.getDate()).padStart(2, "0");
  const YYYY = d.getFullYear();
  return `${hh}:${mm} - ${MM}/${DD}/${YYYY}`;
}
