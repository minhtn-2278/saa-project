"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { SendIcon } from "@/components/ui/icons/SendIcon";
import { ProfileHoverTarget } from "@/components/kudos/LiveBoard/parts/ProfileHoverTarget";
import { HashtagChip } from "@/components/kudos/LiveBoard/parts/HashtagChip";
import { AttachmentGrid } from "@/components/kudos/LiveBoard/parts/AttachmentGrid";
import { HeartsButton } from "@/components/kudos/LiveBoard/parts/HeartsButton";
import { CopyLinkButton } from "@/components/kudos/LiveBoard/parts/CopyLinkButton";
import { KudoBody } from "@/components/kudos/LiveBoard/parts/KudoBody";
import type { PublicKudo } from "@/types/kudos";

interface KudoPostProps {
  kudo: PublicKudo;
}

/**
 * ALL KUDOS feed card — laid out to match Figma node `1949-12832`.
 *
 * Structure (top → bottom):
 *   1. Header row — two centered columns (sender / recipient) separated by
 *      a paper-plane icon. Each column stacks avatar → name → sub-line
 *      (department code · gamification tier / job title).
 *   2. Divider (1 px, `--color-live-divider-on-cream`).
 *   3. Time — muted, left-aligned.
 *   4. Title (`kudo.title.name`) — centered, uppercase, bold.
 *   5. Content box — softer cream tint, rounded, bold body text with a
 *      5-line clamp.
 *   6. Attachment grid (up to 5 × 80 px thumbs).
 *   7. Hashtags — plain red bold text, wrap.
 *   8. Divider.
 *   9. Footer — hearts (L) + Copy Link (R). `Xem chi tiết` removed per Q-A1.
 *
 * Visual tokens follow design-style.md § C.3 refreshed to the 1949-12832
 * node. Anonymity masking already applied by the serializer.
 */
export function KudoPost({ kudo }: KudoPostProps) {
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

  // Recipient sub-line mirrors the Figma `CEVC10 · Legend Hero` layout —
  // we display the recipient's department code here; the tier / "Legend
  // Hero" badge is a future gamification feature (Q-P4).
  const recipient = {
    id: kudo.recipientId,
    name: kudo.recipientName,
    avatarUrl: kudo.recipientAvatarUrl,
    isAnonymous: false,
    subtitle: kudo.recipientDepartment,
  };

  return (
    <article
      aria-labelledby={`kudo-${kudo.id}-sender`}
      className="w-full max-w-[680px] rounded-3xl p-6 md:p-8 flex flex-col gap-5"
      style={{
        background: "var(--color-live-accent-cream)",
        color: "var(--color-live-text-on-cream)",
        boxShadow: "var(--shadow-live-card)",
      }}
    >
      {/* 1. Header — two columns + centered send icon */}
      <header className="flex items-center gap-3">
        <PartyColumn labelId={`kudo-${kudo.id}-sender`} party={sender} />
        <span
          aria-hidden
          className="shrink-0 text-[var(--color-live-text-on-cream)]"
        >
          <SendIcon size={28} />
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
        className="text-sm md:text-base"
        style={{ color: "rgba(0, 16, 26, 0.60)" }}
      >
        {formatTime(kudo.createdAt)}
      </time>

      {/* 4. Title */}
      <h3 className="text-center text-lg md:text-xl font-bold tracking-[0.06em] uppercase">
        {kudo.title.name}
      </h3>

      {/* 5. Content box (tinted) */}
      <div
        className="rounded-2xl px-6 py-5"
        style={{ background: "var(--color-live-content-tint)" }}
      >
        <KudoBody
          body={kudo.body}
          bodyPlain={kudo.bodyPlain}
          className="text-base md:text-lg font-bold leading-relaxed line-clamp-5"
        />
      </div>

      {/* 6. Attachments */}
      {kudo.images.length > 0 ? <AttachmentGrid images={kudo.images} /> : null}

      {/* 7. Hashtags — red plain text */}
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

      {/* 8. Divider */}
      <hr
        aria-hidden
        className="w-full h-px border-0"
        style={{ background: "var(--color-live-divider-on-cream)" }}
      />

      {/* 9. Footer — hearts left, Copy Link + Xem chi tiết right */}
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
          width={80}
          height={80}
          className="w-20 h-20 rounded-full object-cover"
          unoptimized
        />
      ) : (
        <span
          className="w-20 h-20 rounded-full"
          aria-hidden
          style={{ background: "var(--color-live-accent-gold)" }}
        />
      )}
      <span
        id={labelId}
        className="font-bold text-base md:text-lg text-center leading-snug line-clamp-1"
      >
        {party.name}
      </span>
      {party.subtitle ? (
        <span className="text-xs md:text-sm opacity-70 text-center leading-snug line-clamp-1">
          {party.subtitle}
        </span>
      ) : null}
    </div>
  );

  const columnClasses = "flex-1 basis-0 min-w-0";

  if (!hasProfile) {
    return <div className={columnClasses}>{content}</div>;
  }

  return (
    <ProfileHoverTarget employeeId={party.id} className={columnClasses}>
      {content}
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
