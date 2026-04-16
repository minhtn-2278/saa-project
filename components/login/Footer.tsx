import { useTranslations } from "next-intl";

export function Footer() {
  const t = useTranslations("login");

  return (
    <footer className="w-full border-t border-footer-border">
      <div className="max-w-[1440px] mx-auto px-4 py-6 sm:px-12 sm:py-8 lg:px-[90px] lg:py-10 flex items-center justify-center">
        <p className="text-base font-bold text-white text-center">
          {t("footer.copyright")}
        </p>
      </div>
    </footer>
  );
}
