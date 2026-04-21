"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { ArrowRightIcon } from "@/components/ui/icons/ArrowRightIcon";
import { ProfileHoverTarget } from "@/components/kudos/LiveBoard/parts/ProfileHoverTarget";
import { HashtagChip } from "@/components/kudos/LiveBoard/parts/HashtagChip";
import { AttachmentGrid } from "@/components/kudos/LiveBoard/parts/AttachmentGrid";
import { HeartsButton } from "@/components/kudos/LiveBoard/parts/HeartsButton";
import { CopyLinkButton } from "@/components/kudos/LiveBoard/parts/CopyLinkButton";
import type { PublicKudo } from "@/types/kudos";

interface KudoPostProps {
  kudo: PublicKudo;
}

/**
 * ALL KUDOS feed card (`C.3` — `3127:21871`).
 *
 * Design-style.md § C.3 structure (top → bottom):
 *   1. Sender block (ProfileHoverTarget) → C.3.2 sent-icon → Recipient block.
 *   2. C.3.4 time.
 *   3. C.3.5 content — 5-line clamp + `…`.
 *   4. C.3.6 attachment grid — up to 5 × 80px thumbnails.
 *   5. C.3.7 hashtag chips — wrap, clickable → apply filter (FR-011).
 *   6. C.4 action bar — HeartsButton (left) + CopyLinkButton + "Xem chi tiết"
 *      (right). `Xem chi tiết` and Copy Link are both **always disabled**
 *      this release per Q-A1.
 *
 * Visual tokens: 680 × auto cream card (radius 24), padding 40/40/16/40,
 * box-shadow `--shadow-live-card`. Anonymity masking already applied by
 * the serializer — this component just renders whatever `senderName` /
 * `senderAvatarUrl` the API returned.
 *
 * Plan § T041.
 */
export function KudoPost({ kudo }: KudoPostProps) {
  const t = useTranslations("kudos.liveBoard.card");
  const heartCount = kudo.heartCount ?? 0;
  const heartedByMe = kudo.heartedByMe ?? false;
  const canHeart = kudo.canHeart ?? false;

  return (
    <article
      aria-labelledby={`kudo-${kudo.id}-sender`}
      className="w-full max-w-[680px] rounded-3xl p-6 md:p-10 pb-4 flex flex-col gap-4 shadow-[0_4px_4px_rgba(0,0,0,0.25)]"
      style={{
        background: "var(--color-live-accent-cream)",
        color: "var(--color-live-text-on-cream)",
      }}
    >
      {/* 1. Sender → arrow → Recipient */}
      <header className="flex items-center gap-3">
        <SenderBlock
          id={`kudo-${kudo.id}-sender`}
          name={kudo.senderName}
          avatarUrl={kudo.senderAvatarUrl}
          isAnonymous={kudo.isAnonymous}
          // When anonymous, there's no profile to link to — ProfileHoverTarget
          // gets 0 which skips the Link wrapper (handled inside).
          employeeId={kudo.isAnonymous ? 0 : -1}
        />
        <ArrowRightIcon size={16} aria-hidden className="shrink-0 opacity-60" />
        <RecipientBlock
          name={kudo.recipientName}
          avatarUrl={kudo.recipientAvatarUrl}
          employeeId={kudo.recipientId}
        />
      </header>

      {/* 2. Time (C.3.4) */}
      <time
        dateTime={kudo.createdAt}
        className="text-sm opacity-70"
      >
        {formatTime(kudo.createdAt)}
      </time>

      {/* 3. Content (C.3.5) — 5-line clamp */}
      <p className="text-base md:text-lg leading-relaxed whitespace-pre-wrap line-clamp-5">
        {kudo.bodyPlain}
      </p>

      {/* 4. Attachments (C.3.6) */}
      {kudo.images.length > 0 ? <AttachmentGrid images={kudo.images} /> : null}

      {/* 5. Hashtags (C.3.7) */}
      {kudo.hashtags.length > 0 ? (
        <ul className="flex flex-wrap gap-2" aria-label="Hashtag">
          {kudo.hashtags.slice(0, 5).map((h) => (
            <li key={h.id}>
              <HashtagChip id={h.id} label={h.label} />
            </li>
          ))}
        </ul>
      ) : null}

      {/* 6. Action bar (C.4) */}
      <footer className="mt-auto flex items-center justify-between pt-2">
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
// Helpers
// -----------------------------------------------------------------------------

interface SenderBlockProps {
  id: string;
  name: string;
  avatarUrl: string | null;
  isAnonymous: boolean;
  /** 0 for anonymous senders (hover/click disabled); real id otherwise. */
  employeeId: number;
}

function SenderBlock({
  id,
  name,
  avatarUrl,
  isAnonymous,
  employeeId,
}: SenderBlockProps) {
  const content = (
    <span className="inline-flex items-center gap-2 min-w-0">
      {avatarUrl ? (
        <Image
          src={avatarUrl}
          alt=""
          width={40}
          height={40}
          className="w-10 h-10 rounded-full object-cover"
          unoptimized
        />
      ) : (
        <span
          className="w-10 h-10 rounded-full"
          aria-hidden
          style={{ background: "var(--color-live-accent-gold)" }}
        />
      )}
      <span id={id} className="font-bold truncate">
        {name}
      </span>
    </span>
  );

  // Anonymous senders have no resolvable profile — render without a link.
  if (isAnonymous || employeeId <= 0) return content;

  return (
    <ProfileHoverTarget employeeId={employeeId} className="min-w-0">
      {content}
    </ProfileHoverTarget>
  );
}

interface RecipientBlockProps {
  name: string;
  avatarUrl: string | null;
  employeeId: number;
}

function RecipientBlock({ name, avatarUrl, employeeId }: RecipientBlockProps) {
  return (
    <ProfileHoverTarget employeeId={employeeId} className="min-w-0">
      <span className="inline-flex items-center gap-2 min-w-0">
        {avatarUrl ? (
          <Image
            src={avatarUrl}
            alt=""
            width={40}
            height={40}
            className="w-10 h-10 rounded-full object-cover"
            unoptimized
          />
        ) : (
          <span
            className="w-10 h-10 rounded-full"
            aria-hidden
            style={{ background: "var(--color-live-accent-gold)" }}
          />
        )}
        <span className="font-bold truncate">{name}</span>
      </span>
    </ProfileHoverTarget>
  );
}

/** Format an ISO timestamp as `HH:mm - MM/DD/YYYY` per design-style.md § B.4.1. */
function formatTime(iso: string): string {
  const d = new Date(iso);
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  const MM = String(d.getMonth() + 1).padStart(2, "0");
  const DD = String(d.getDate()).padStart(2, "0");
  const YYYY = d.getFullYear();
  return `${hh}:${mm} - ${MM}/${DD}/${YYYY}`;
}
