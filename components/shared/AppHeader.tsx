"use client";

import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import { NavLinks } from "./NavLinks";
import { NotificationBell } from "./NotificationBell";
import { LanguageSelector } from "./LanguageSelector";
import { UserAvatar } from "./UserAvatar";

interface AppHeaderProps {
  showNav?: boolean;
  notificationCount?: number;
}

export function AppHeader({
  showNav = true,
  notificationCount = 0,
}: AppHeaderProps) {
  const router = useRouter();
  const pathname = usePathname();

  function handleLogoClick(e: React.MouseEvent) {
    e.preventDefault();
    if (pathname === "/") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      router.push("/");
    }
  }

  return (
    <header className="fixed top-0 w-full h-16 lg:h-20 bg-[#101417]/80 z-50 backdrop-blur-sm">
      <div className="h-full max-w-[1512px] mx-auto px-4 sm:px-12 lg:px-36 py-3 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <a href="/" onClick={handleLogoClick} className="flex items-center">
            <Image
              src="/images/saa-logo.png"
              alt="SAA 2025"
              width={52}
              height={48}
              className="w-10 h-10 lg:w-[52px] lg:h-[48px]"
            />
          </a>
          {showNav && <NavLinks />}
        </div>

        <div className="flex items-center gap-2">
          {showNav && <NotificationBell count={notificationCount} />}
          <LanguageSelector />
          {showNav && <UserAvatar />}
        </div>
      </div>
    </header>
  );
}
