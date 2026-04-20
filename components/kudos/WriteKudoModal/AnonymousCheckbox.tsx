"use client";

import { useId } from "react";
import { useTranslations } from "next-intl";
import { CheckIcon } from "@/components/ui/icons/CheckIcon";

interface AnonymousCheckboxProps {
  checked: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
}

/**
 * Design-style § G — anonymous toggle.
 *
 * 20×20 checkbox + label. Label colour goes from muted grey → dark when
 * checked, matching the design. Toggling it drives the conditional
 * `AnonymousAliasInput` (G.1) in the parent modal.
 */
export function AnonymousCheckbox({
  checked,
  onChange,
  disabled,
}: AnonymousCheckboxProps) {
  const t = useTranslations("kudos.writeKudo.fields.anonymous");
  const inputId = useId();

  return (
    <div className="flex flex-row items-center gap-4 w-full">
      <div className="relative flex items-center">
        <input
          id={inputId}
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          disabled={disabled}
          className="peer appearance-none w-5 h-5 rounded border border-[#998C5F] bg-white checked:bg-[#FFEA9E] focus:outline-2 focus:outline-[#998C5F] focus:outline-offset-2 disabled:opacity-60 cursor-pointer"
        />
        {checked && (
          <CheckIcon
            size={14}
            className="pointer-events-none absolute left-[3px] top-[3px] text-[#00101A]"
          />
        )}
      </div>
      <label
        htmlFor={inputId}
        className={`text-[22px] leading-7 font-bold cursor-pointer ${
          checked ? "text-[#00101A]" : "text-[#999999]"
        }`}
      >
        {t("toggleLabel")}
      </label>
    </div>
  );
}
