"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";

interface WriteKudoCTAProps {
  children?: ReactNode;
  className?: string;
}

/**
 * Shared CTA that opens the Write-Kudo modal by appending `?write=kudo` to
 * the current route. Reused from the FAB, Kudos board, and future Profile
 * "Gửi lời chúc" entry.
 */
export function WriteKudoCTA({ children, className }: WriteKudoCTAProps) {
  const t = useTranslations("kudos.writeKudo");
  const pathname = usePathname();
  const params = useSearchParams();

  const next = new URLSearchParams(params.toString());
  next.set("write", "kudo");

  return (
    <Link
      href={`${pathname}?${next.toString()}`}
      scroll={false}
      className={
        className ??
        "inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#FFEA9E] text-[#00101A] font-bold"
      }
    >
      {children ?? t("openCta")}
    </Link>
  );
}
