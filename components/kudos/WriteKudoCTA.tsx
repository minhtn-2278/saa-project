"use client";

import { useTranslations } from "next-intl";
import type { ReactNode } from "react";

interface WriteKudoCTAProps {
  children?: ReactNode;
  className?: string;
}

/**
 * Shared CTA that opens the Write-Kudo modal by firing a `kudo:open` window
 * event — listened to by `WriteKudoModalMount`. No URL change, so the host
 * page's Server Component (which reads `searchParams`) does NOT re-render
 * when the user clicks. Deep-links via `?write=kudo` are still honoured by
 * Mount's URL-sync effect.
 */
export function WriteKudoCTA({ children, className }: WriteKudoCTAProps) {
  const t = useTranslations("kudos.writeKudo");

  return (
    <button
      type="button"
      onClick={() => {
        window.dispatchEvent(new CustomEvent("kudo:open"));
      }}
      className={
        className ??
        "inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#FFEA9E] text-[#00101A] font-bold"
      }
    >
      {children ?? t("openCta")}
    </button>
  );
}
