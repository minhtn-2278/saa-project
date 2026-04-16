"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { UserIcon } from "@/components/ui/icons/UserIcon";

export function UserAvatar() {
  const router = useRouter();
  const t = useTranslations();
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

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="User menu"
        aria-expanded={isOpen}
        aria-haspopup="menu"
        className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 motion-safe:transition-colors cursor-pointer focus:outline-2 focus:outline-[#FFEA9E] focus:outline-offset-2"
      >
        <UserIcon size={20} />
      </button>

      {isOpen && (
        <div
          role="menu"
          className="absolute right-0 top-full mt-2 bg-[#101417] border border-[#2E3940] rounded-lg shadow-lg overflow-hidden min-w-[160px] z-50"
        >
          <button
            role="menuitem"
            onClick={() => {
              setIsOpen(false);
              router.push("/profile");
            }}
            className="w-full text-left px-4 py-3 text-sm font-bold text-white hover:bg-white/10 motion-safe:transition-colors cursor-pointer"
          >
            {t("nav.profile")}
          </button>
          <button
            role="menuitem"
            onClick={handleSignOut}
            className="w-full text-left px-4 py-3 text-sm font-bold text-white hover:bg-white/10 motion-safe:transition-colors cursor-pointer border-t border-[#2E3940]"
          >
            {t("nav.signOut")}
          </button>
        </div>
      )}
    </div>
  );
}
