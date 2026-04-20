"use client";

import { useTranslations } from "next-intl";
import { PlusIcon } from "@/components/ui/icons/PlusIcon";

interface ComboboxCreateRowProps {
  /** The label the user has typed (trimmed). */
  label: string;
  onCreate: (label: string) => void;
  /** When set, render disabled with this helper (e.g. "Charset invalid"). */
  helperError?: string;
  /** Highlighted by keyboard nav. */
  highlighted?: boolean;
  onHover?: () => void;
}

/**
 * "Tạo mới: {label}" sticky row shown at the bottom of a combobox popover
 * when the user types a label that has no match (FR-006 / FR-006a).
 * Design-style § E.2.
 */
export function ComboboxCreateRow({
  label,
  onCreate,
  helperError,
  highlighted,
  onHover,
}: ComboboxCreateRowProps) {
  const t = useTranslations("kudos.writeKudo");
  const disabled = Boolean(helperError);

  return (
    <li
      role="option"
      aria-selected={highlighted}
      aria-disabled={disabled || undefined}
      onMouseEnter={onHover}
      onMouseDown={(e) => {
        e.preventDefault();
        if (!disabled) onCreate(label);
      }}
      className={`sticky bottom-0 flex items-center gap-2 px-4 py-3 border-t border-[#998C5F] bg-[#FFF8E1] text-[#00101A] ${
        disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer"
      } ${highlighted && !disabled ? "bg-[#FFEA9E]" : ""}`}
    >
      <PlusIcon size={14} />
      <span className="font-bold">
        {t("actions.createNew", { label })}
      </span>
      {helperError && (
        <span className="ml-2 text-xs text-[#CF1322]">{helperError}</span>
      )}
    </li>
  );
}
