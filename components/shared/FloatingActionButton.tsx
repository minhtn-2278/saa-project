"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { PencilIcon } from "@/components/ui/icons/PencilIcon";
import { KudosLogoIcon } from "@/components/ui/icons/KudosLogoIcon";
import { RulesIcon } from "@/components/ui/icons/RulesIcon";

export function FloatingActionButton() {
  const t = useTranslations("homepage");
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape" && isOpen) {
        setIsOpen(false);
        buttonRef.current?.focus();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  return (
    <div ref={containerRef} className="fixed bottom-6 right-6 z-40">
      {isOpen && (
        <div
          role="menu"
          className="absolute bottom-full right-0 mb-3 bg-[#101417] border border-[#2E3940] rounded-xl shadow-lg overflow-hidden min-w-[180px]"
        >
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setIsOpen(false);
              window.dispatchEvent(new CustomEvent("kudo:open"));
            }}
            className="w-full flex items-center gap-3 px-5 py-3.5 text-sm font-bold text-white hover:bg-white/10 motion-safe:transition-colors"
          >
            <PencilIcon size={18} />
            {t("fab.writeKudo")}
          </button>
          <Link
            href="/rules"
            role="menuitem"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-3 px-5 py-3.5 text-sm font-bold text-white hover:bg-white/10 motion-safe:transition-colors"
          >
            <RulesIcon size={18} />
            {t("fab.rules")}
          </Link>
        </div>
      )}

      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Quick actions"
        aria-expanded={isOpen}
        aria-haspopup="menu"
        className="w-20 h-12 sm:w-[106px] sm:h-16 bg-[#FFEA9E] rounded-full flex items-center justify-center gap-2 text-[#00101A] shadow-[0_4px_4px_rgba(0,0,0,0.25),0_0_6px_#FAE287] hover:shadow-[0_4px_16px_rgba(255,234,158,0.4),0_0_8px_#FAE287] motion-safe:transition-all cursor-pointer focus:outline-2 focus:outline-[#FFEA9E] focus:outline-offset-2"
      >
        <PencilIcon size={24} className="text-[#00101A]" />
        <span className="text-2xl font-bold leading-none">/</span>
        <KudosLogoIcon size={20} className="text-[#00101A]" />
      </button>
    </div>
  );
}
