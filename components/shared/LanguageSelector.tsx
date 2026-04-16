"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { VNFlagIcon } from "@/components/ui/icons/VNFlagIcon";
import { ENFlagIcon } from "@/components/ui/icons/ENFlagIcon";
import { JPFlagIcon } from "@/components/ui/icons/JPFlagIcon";
import { ChevronDownIcon } from "@/components/ui/icons/ChevronDownIcon";
import type { SupportedLocale } from "@/types/auth";

const LOCALE_OPTIONS: {
  code: SupportedLocale;
  displayCode: string;
  label: string;
  flag: React.ComponentType<{ size?: number; className?: string }>;
}[] = [
  { code: "vi", displayCode: "VN", label: "Tiếng Việt", flag: VNFlagIcon },
  { code: "en", displayCode: "EN", label: "English", flag: ENFlagIcon },
  { code: "ja", displayCode: "JP", label: "日本語", flag: JPFlagIcon },
];

function getCurrentLocale(): SupportedLocale {
  if (typeof document === "undefined") return "vi";
  const match = document.cookie.match(/NEXT_LOCALE=(\w+)/);
  return (match?.[1] as SupportedLocale) || "vi";
}

export function LanguageSelector() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [currentLocale, setCurrentLocale] =
    useState<SupportedLocale>("vi");
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setCurrentLocale(getCurrentLocale());
  }, []);

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

  function selectLocale(locale: SupportedLocale) {
    document.cookie = `NEXT_LOCALE=${locale};path=/;max-age=31536000`;
    setCurrentLocale(locale);
    setIsOpen(false);
    buttonRef.current?.focus();
    router.refresh();
  }

  function handleKeyDown(event: React.KeyboardEvent) {
    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
          setFocusedIndex(0);
        } else {
          setFocusedIndex((prev) =>
            prev < LOCALE_OPTIONS.length - 1 ? prev + 1 : 0
          );
        }
        break;
      case "ArrowUp":
        event.preventDefault();
        if (isOpen) {
          setFocusedIndex((prev) =>
            prev > 0 ? prev - 1 : LOCALE_OPTIONS.length - 1
          );
        }
        break;
      case "Enter":
      case " ":
        event.preventDefault();
        if (isOpen && focusedIndex >= 0) {
          selectLocale(LOCALE_OPTIONS[focusedIndex].code);
        } else {
          setIsOpen(!isOpen);
          if (!isOpen) setFocusedIndex(0);
        }
        break;
    }
  }

  const current = LOCALE_OPTIONS.find((o) => o.code === currentLocale) ??
    LOCALE_OPTIONS[0];
  const CurrentFlag = current.flag;

  return (
    <div ref={containerRef} className="relative" onKeyDown={handleKeyDown}>
      <button
        ref={buttonRef}
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) setFocusedIndex(0);
        }}
        aria-label="Select language"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        className="flex items-center gap-1 p-2 lg:p-4 rounded hover:bg-white/10 motion-safe:transition-colors cursor-pointer focus:outline-2 focus:outline-focus-ring focus:outline-offset-2"
      >
        <CurrentFlag size={24} />
        <span className="text-base font-bold text-white leading-6 tracking-[0.15px]">
          {current.displayCode}
        </span>
        <ChevronDownIcon
          size={24}
          className={`text-white motion-safe:transition-transform motion-safe:duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <ul
          role="listbox"
          aria-label="Available languages"
          className="absolute right-0 top-full mt-1 bg-[#0B0F12] border border-footer-border rounded-lg shadow-lg overflow-hidden min-w-[160px] z-50"
        >
          {LOCALE_OPTIONS.map((option, index) => {
            const Flag = option.flag;
            return (
              <li
                key={option.code}
                role="option"
                aria-selected={option.code === currentLocale}
                tabIndex={-1}
                onClick={() => selectLocale(option.code)}
                className={`flex items-center gap-3 px-4 py-3 cursor-pointer motion-safe:transition-colors ${
                  focusedIndex === index ? "bg-white/10" : ""
                } ${
                  option.code === currentLocale
                    ? "bg-white/5"
                    : "hover:bg-white/10"
                }`}
              >
                <Flag size={20} />
                <span className="text-sm font-bold text-white">
                  {option.label}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
