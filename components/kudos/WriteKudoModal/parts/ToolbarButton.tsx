"use client";

import type { ReactNode } from "react";

export interface ToolbarButtonProps {
  active: boolean;
  onClick: () => void;
  ariaLabel: string;
  children: ReactNode;
  position?: "first" | "middle" | "last";
  disabled?: boolean;
}

/**
 * Single toolbar button primitive. Design-style § C:
 *   h-10 px-4 py-2.5, border 1px #998C5F, bg transparent, icon 20×20.
 *   First button has `rounded-tl-lg`; last has `rounded-tr-lg`.
 *   Active → bg #FFEA9E.
 */
export function ToolbarButton({
  active,
  onClick,
  ariaLabel,
  children,
  position = "middle",
  disabled,
}: ToolbarButtonProps) {
  const radius =
    position === "first"
      ? "rounded-tl-lg"
      : position === "last"
        ? "rounded-tr-lg"
        : "";
  const bg = active
    ? "bg-[#FFEA9E] text-[#00101A]"
    : "bg-transparent text-[#00101A] hover:bg-[#FFEA9E]/30";
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      aria-pressed={active}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center h-10 w-14 border border-[#998C5F] ${radius} ${bg} focus:outline-2 focus:outline-[#FFEA9E] focus:outline-offset-2 disabled:opacity-40 disabled:cursor-not-allowed motion-safe:transition-colors`}
    >
      {children}
    </button>
  );
}
