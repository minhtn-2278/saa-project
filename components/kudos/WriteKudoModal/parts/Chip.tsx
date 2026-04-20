"use client";

import { CloseIcon } from "@/components/ui/icons/CloseIcon";

export interface ChipProps {
  label: string;
  onRemove?: () => void;
  removeAriaLabel?: string;
  variant?: "default" | "pending";
}

/**
 * Hashtag / tag chip. Matches design-style.md § E.2:
 *   bg #FFEA9E, border 1px #998C5F, radius 9999, padding 8/12,
 *   Montserrat 14/20 700 #00101A, trailing ✕ (16×16).
 */
export function Chip({
  label,
  onRemove,
  removeAriaLabel,
  variant = "default",
}: ChipProps) {
  const base =
    "inline-flex items-center gap-2 px-3 py-2 rounded-full border border-[#998C5F] text-sm leading-5 font-bold";
  const bg = variant === "pending" ? "bg-[#FFF8E1]" : "bg-[#FFEA9E]";
  return (
    <span role="listitem" className={`${base} ${bg} text-[#00101A]`}>
      <span>{label}</span>
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          aria-label={removeAriaLabel ?? `Xoá ${label}`}
          className="inline-flex items-center justify-center w-4 h-4 text-[#00101A] hover:opacity-70 focus:outline-2 focus:outline-[#998C5F] focus:outline-offset-2"
        >
          <CloseIcon size={12} />
        </button>
      )}
    </span>
  );
}
