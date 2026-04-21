"use client";

import { useTranslations } from "next-intl";
import { GiftIcon } from "@/components/ui/icons/GiftIcon";

/**
 * D.1.8 `Mở quà` button — **permanently disabled** this release.
 *
 * The Secret Box feature is deferred (spec § Out of Scope, plan § Feature
 * Defer Map). The disabled styling is the default because it is the ONLY
 * state that ever renders in production right now. Enabled-state tokens
 * live in design-style.md § D.1.8 for when the feature ships.
 *
 * Intentionally takes NO props: there's no click handler to pass. When
 * the Secret Box ships, that will be a deliberate breaking change that
 * forces every call site to wire the `onClick`.
 */
export function OpenSecretBoxButton() {
  const t = useTranslations("kudos.liveBoard.sidebar");
  const disabledTitle = useTranslations("kudos.liveBoard.card")("disabledTitle");

  return (
    <button
      type="button"
      disabled
      aria-disabled="true"
      title={disabledTitle}
      className="flex items-center justify-center gap-2 h-12 w-full rounded-lg font-bold text-[22px] cursor-not-allowed"
      style={{
        background: "var(--color-live-surface-muted)",
        color: "var(--color-live-text-secondary)",
      }}
    >
      <GiftIcon size={20} />
      {t("openGift")}
    </button>
  );
}
