"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";

const NAV_ITEMS = [
  { href: "/", labelKey: "nav.aboutSAA" },
  { href: "/awards", labelKey: "nav.awardsInfo" },
  { href: "/kudos", labelKey: "nav.sunKudos" },
] as const;

export function NavLinks() {
  const pathname = usePathname();
  const t = useTranslations();

  function handleClick(e: React.MouseEvent, href: string) {
    if (pathname === href) {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  return (
    <nav className="hidden lg:flex items-center gap-1">
      {NAV_ITEMS.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={(e) => handleClick(e, item.href)}
            aria-current={isActive ? "page" : undefined}
            className={`px-4 py-2 rounded text-base font-bold leading-6 tracking-[0.15px] motion-safe:transition-colors ${
              isActive
                ? "text-[#FFEA9E] underline underline-offset-8"
                : "text-white hover:bg-white/5"
            } focus:outline-2 focus:outline-[#FFEA9E] focus:outline-offset-2`}
          >
            {t(item.labelKey)}
          </Link>
        );
      })}
    </nav>
  );
}
