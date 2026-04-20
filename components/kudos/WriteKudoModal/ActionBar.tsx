"use client";

import { useTranslations } from "next-intl";
import { LoadingSpinner } from "@/components/ui/icons/LoadingSpinner";

interface ActionBarProps {
  canSubmit: boolean;
  submitting: boolean;
  onCancel: () => void;
  onSubmit: () => void;
}

/**
 * Bottom action bar. Design-style § H.
 *
 * Submit button stays disabled while inflight (spec FR-012 — client-side
 * button-disable lock is the sole duplicate-prevention in rev 3).
 */
export function ActionBar({
  canSubmit,
  submitting,
  onCancel,
  onSubmit,
}: ActionBarProps) {
  const t = useTranslations("kudos.writeKudo");
  return (
    <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-start gap-3 sm:gap-6 w-full">
      <button
        type="button"
        onClick={onCancel}
        disabled={submitting}
        className="w-full sm:w-auto px-6 sm:px-10 py-4 rounded-sm border border-[#998C5F] bg-[#FFEA9E]/10 text-base leading-6 font-bold text-[#00101A] hover:bg-[#FFEA9E]/20 focus:outline-2 focus:outline-[#998C5F] focus:outline-offset-2 disabled:opacity-60"
      >
        {t("actions.cancel")}
      </button>
      <button
        type="button"
        onClick={onSubmit}
        disabled={!canSubmit || submitting}
        aria-busy={submitting || undefined}
        className="flex-1 h-[60px] p-4 rounded-lg bg-[#FFEA9E] text-[22px] leading-7 font-bold text-[#00101A] hover:bg-[#F7D872] active:bg-[#E6C651] focus:outline-2 focus:outline-[#998C5F] focus:outline-offset-2 disabled:bg-[#FFEA9E]/40 disabled:text-[#00101A]/40 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
      >
        {submitting && <LoadingSpinner size={20} />}
        <span>{t("actions.submit")}</span>
      </button>
    </div>
  );
}
