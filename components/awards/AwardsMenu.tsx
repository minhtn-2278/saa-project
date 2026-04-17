"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { TargetIcon } from "@/components/ui/icons/TargetIcon";

export interface AwardsMenuItem {
  slug: string;
  nameKey: string;
}

interface Props {
  items: AwardsMenuItem[];
}

function getMotionOk(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return true;
  return !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function AwardsMenu({ items }: Props) {
  const t = useTranslations();
  const tAwards = useTranslations("awardsPage");

  const [activeSlug, setActiveSlug] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    const hash = window.location.hash.replace("#", "");
    return items.some((i) => i.slug === hash) ? hash : null;
  });
  const isProgrammaticRef = useRef(false);
  const activeTabRef = useRef<HTMLAnchorElement | null>(null);

  // Scroll-spy
  useEffect(() => {
    if (typeof window === "undefined") return;
    const slugSet = new Set(items.map((i) => i.slug));
    const observer = new IntersectionObserver(
      (entries) => {
        if (isProgrammaticRef.current) return;
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const id = entry.target.id;
            if (slugSet.has(id)) {
              setActiveSlug(id);
            }
          }
        }
      },
      { rootMargin: "-104px 0px -50% 0px", threshold: 0 }
    );
    items.forEach((i) => {
      const el = document.getElementById(i.slug);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [items]);

  // Auto-scroll on mount if hash matches a known slug (initial active state set via useState initializer above)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const hash = window.location.hash.replace("#", "");
    if (!hash) return;
    if (!items.some((i) => i.slug === hash)) return;
    const el = document.getElementById(hash);
    if (!el) return;
    const behavior: ScrollBehavior = getMotionOk() ? "smooth" : "auto";
    el.scrollIntoView({ behavior, block: "start" });
  }, [items]);

  // Auto-center active tab when the menu is in its horizontal (mobile + iPad) layout.
  useEffect(() => {
    if (!activeTabRef.current) return;
    if (typeof window === "undefined") return;
    const isHorizontalMenu = window.matchMedia("(max-width: 1023px)").matches;
    if (!isHorizontalMenu) return;
    activeTabRef.current.scrollIntoView({
      inline: "center",
      block: "nearest",
      behavior: getMotionOk() ? "smooth" : "auto",
    });
  }, [activeSlug]);

  function handleClick(e: React.MouseEvent<HTMLAnchorElement>, slug: string) {
    e.preventDefault();
    const el = document.getElementById(slug);
    if (!el) return;

    isProgrammaticRef.current = true;
    const behavior: ScrollBehavior = getMotionOk() ? "smooth" : "auto";
    el.scrollIntoView({ behavior, block: "start" });
    window.history.replaceState(null, "", `#${slug}`);
    setActiveSlug(slug);
    window.setTimeout(() => {
      isProgrammaticRef.current = false;
    }, 600);
  }

  return (
    <nav
      aria-label={tAwards("menuAriaLabel")}
      className="sticky top-16 lg:top-[104px] z-40 bg-[#00101A] lg:bg-transparent border-b lg:border-0 border-[#2E3940] -mx-4 lg:mx-0 min-w-0 w-[calc(100%+2rem)] lg:w-[178px] lg:shrink-0 lg:self-start"
    >
      <ol className="flex flex-row lg:flex-col gap-1 lg:gap-4 overflow-x-auto lg:overflow-visible snap-x snap-proximity lg:snap-none scrollbar-hide touch-pan-x lg:touch-auto px-4 lg:px-0 py-2 lg:py-0 w-full">
        {items.map((item) => {
          const isActive = activeSlug === item.slug;
          return (
            <li
              key={item.slug}
              className="shrink-0 snap-center lg:snap-align-none"
            >
              <a
                ref={isActive ? activeTabRef : undefined}
                href={`#${item.slug}`}
                aria-current={isActive ? "true" : undefined}
                onClick={(e) => handleClick(e, item.slug)}
                className={`flex items-center gap-1 px-4 py-3 rounded min-h-[44px] min-w-[44px] text-sm font-bold leading-5 tracking-[0.25px] whitespace-nowrap motion-safe:transition-colors focus:outline-2 focus:outline-[#FFEA9E] focus:outline-offset-2 ${
                  isActive
                    ? "text-[#FFEA9E] underline underline-offset-8"
                    : "text-white hover:bg-white/5"
                }`}
              >
                <TargetIcon className="h-5 w-5 lg:h-6 lg:w-6 shrink-0" />
                <span>{t(item.nameKey)}</span>
              </a>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
