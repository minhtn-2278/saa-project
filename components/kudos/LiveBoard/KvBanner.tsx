import Image from "next/image";
import { useTranslations } from "next-intl";
import { WriteKudoCTA } from "@/components/kudos/WriteKudoCTA";
import { PencilIcon } from "@/components/ui/icons/PencilIcon";

/**
 * A — KV Kudos banner content. Screen MaZUn5xHXZ, block `A` (`2940:13437`).
 *
 * **Banner background** is intentionally NOT rendered here — it lives at the
 * page level (`app/(dashboard)/kudos/page.tsx`) so the watercolor hero image
 * can span the page's full viewport width like it does on the homepage,
 * rather than being confined to this component's rounded container.
 *
 * Content stack (left-aligned on top of the page-level hero bg):
 *   1. Small subtitle "Hệ thống ghi nhận lời cảm ơn" (design-style.md § Typography).
 *   2. Big stylised "KUDOS" wordmark — Figma-exported SVG at
 *      `/assets/kv-kudos-wordmark.svg` (593 × 106 viewBox).
 *   3. A.1 Pill input (738 × 72, radius 68, gold-tinted surface with a
 *      1px olive border + pencil leading icon) — wired to `WriteKudoCTA`
 *      which flips `?write=kudo` to open the already-mounted Viết Kudo modal.
 *
 * Server Component — no interactivity beyond the pill's link.
 *
 * Plan § T036 + Phase 4 visual-alignment fix (3rd pass — bg lifted to
 * page level to match the full-width homepage-hero pattern).
 */
export function KvBanner() {
  const t = useTranslations("kudos.liveBoard.kvBanner");

  return (
    <section
      aria-labelledby="kv-kudos-title"
      className="flex flex-col items-start gap-6 md:gap-8 pt-20 pb-10 md:pt-32 md:pb-14 max-w-[820px]"
    >
      <h1
        id="kv-kudos-title"
        className="text-2xl md:text-4xl leading-tight font-bold tracking-tight"
        style={{ color: "var(--color-live-accent-gold)" }}
      >
        {t("title")}
      </h1>
      <Image
        src="/assets/kv-kudos-wordmark.svg"
        alt="KUDOS"
        width={593}
        height={106}
        priority
        className="h-auto w-full max-w-[420px] md:max-w-[593px]"
      />
      <WriteKudoCTA
        className="mt-6 md:mt-10 inline-flex items-center gap-3 h-[72px] w-full max-w-[738px] px-4 py-6 rounded-[68px] text-base md:text-lg font-bold bg-[rgba(255,234,158,0.10)] hover:bg-[rgba(255,234,158,0.18)] border border-[var(--color-live-border-gold)] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-live-accent-gold)]"
      >
        <PencilIcon
          size={24}
          aria-hidden
          className="shrink-0 text-[var(--color-live-accent-gold)]"
        />
        <span
          className="truncate"
          style={{ color: "var(--color-live-text-secondary)" }}
        >
          {t("pillPlaceholder")}
        </span>
      </WriteKudoCTA>
    </section>
  );
}
