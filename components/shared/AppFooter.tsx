import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";

interface AppFooterProps {
  showNav?: boolean;
}

const FOOTER_LINKS = [
  { href: "/", labelKey: "nav.aboutSAA" },
  { href: "/awards", labelKey: "nav.awardsInfo" },
  { href: "/kudos", labelKey: "nav.sunKudos" },
  { href: "/rules", labelKey: "nav.rules" },
] as const;

export function AppFooter({ showNav = true }: AppFooterProps = {}) {
  const t = useTranslations();

  if (!showNav) {
    return (
      <footer className="w-full border-t border-[#2E3940]">
        <div className="max-w-[1440px] mx-auto px-4 py-6 sm:px-12 sm:py-8 lg:px-[90px] lg:py-10 flex items-center justify-center">
          <p className="text-base font-bold text-white text-center">
            {t("login.footer.copyright")}
          </p>
        </div>
      </footer>
    );
  }

  return (
    <footer className="w-full border-t border-[#2E3940]">
      <div className="max-w-[1512px] mx-auto px-4 py-6 sm:px-12 sm:py-8 lg:px-[90px] lg:py-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-8">
          <Image
            src="/images/saa-logo.png"
            alt="SAA 2025"
            width={52}
            height={48}
            className="w-10 h-10"
          />

          <nav className="flex flex-wrap items-center justify-start gap-4 sm:gap-6">
            {FOOTER_LINKS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm font-bold text-white hover:text-[#FFEA9E] motion-safe:transition-colors focus:outline-2 focus:outline-[#FFEA9E] focus:outline-offset-2"
              >
                {t(item.labelKey)}
              </Link>
            ))}
          </nav>
        </div>

        <p className="text-sm font-bold text-white/60 text-center sm:text-right">
          {t("login.footer.copyright")}
        </p>
      </div>
    </footer>
  );
}
