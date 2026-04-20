"use client";

import { useId } from "react";
import { useTranslations } from "next-intl";
import { FieldLabel } from "./parts/FieldLabel";
import { MaskIcon } from "@/components/ui/icons/MaskIcon";
import { useErrorResolver } from "./parts/resolveError";
import { MAX_ANONYMOUS_ALIAS_LENGTH } from "@/lib/constants/kudos";

interface AnonymousAliasInputProps {
  /** `true` when the anonymous checkbox is checked — drives the reveal. */
  visible: boolean;
  value: string;
  onChange: (next: string) => void;
  error?: string | null;
  disabled?: boolean;
}

/**
 * Design-style § G.1 — conditional alias input revealed when the anonymous
 * toggle is checked. `ic-mask` prefix, 60-char counter, 180 ms max-height
 * reveal transition.
 *
 * Alias is optional (FR-008b): empty → server falls back to "Ẩn danh".
 * Uses Unicode-aware codepoint counting (surrogate pairs = 1) so the
 * counter matches the server-side validator.
 */
export function AnonymousAliasInput({
  visible,
  value,
  onChange,
  error,
  disabled,
}: AnonymousAliasInputProps) {
  const t = useTranslations("kudos.writeKudo.fields.anonymous");
  const resolveError = useErrorResolver();
  const labelId = useId();
  const inputId = useId();
  const errorId = useId();

  // Codepoint-aware length (matches the server: surrogate pairs → 1).
  const codepointLen = [...value].length;
  const over = codepointLen > MAX_ANONYMOUS_ALIAS_LENGTH;

  return (
    <div
      aria-hidden={!visible}
      className={`w-full motion-safe:transition-[max-height,opacity] motion-safe:duration-[180ms] motion-safe:ease-out overflow-hidden ${
        visible ? "max-h-40 opacity-100 mt-4" : "max-h-0 opacity-0"
      }`}
    >
      {visible && (
        <div
          className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 w-full"
          role="group"
          aria-labelledby={labelId}
        >
          <FieldLabel id={labelId} htmlFor={inputId} className="sm:w-[146px] shrink-0">
            {t("aliasLabel")}
          </FieldLabel>
          <div className="flex-1 w-full">
            <div className="relative">
              <MaskIcon
                size={24}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#998C5F]"
              />
              <input
                id={inputId}
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                maxLength={MAX_ANONYMOUS_ALIAS_LENGTH * 2}
                disabled={disabled}
                aria-invalid={!!error || over || undefined}
                aria-describedby={error ? errorId : undefined}
                placeholder={t("aliasPlaceholder")}
                className={`w-full h-14 pl-14 pr-4 py-4 bg-white border rounded-lg text-base leading-6 font-bold text-[#00101A] placeholder:text-[#999999] focus:outline-2 focus:outline-[#998C5F] focus:outline-offset-2 disabled:opacity-60 ${
                  error || over ? "border-[#CF1322]" : "border-[#998C5F]"
                }`}
              />
            </div>
            <div className="mt-1 flex items-center justify-between">
              {error ? (
                <p id={errorId} role="alert" className="text-sm text-[#CF1322]">
                  {resolveError(error)}
                </p>
              ) : over ? (
                <p className="text-sm text-[#CF1322]">
                  {resolveError("anonymousAlias.maxLength")}
                </p>
              ) : (
                <span />
              )}
              <span
                className={`text-sm font-bold ${
                  over ? "text-[#CF1322]" : "text-[#999999]"
                }`}
              >
                {codepointLen} / {MAX_ANONYMOUS_ALIAS_LENGTH}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
