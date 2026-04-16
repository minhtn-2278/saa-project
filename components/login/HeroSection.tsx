import Image from "next/image";
import { useTranslations } from "next-intl";
import { LoginButton } from "./LoginButton";

export function HeroSection() {
  const t = useTranslations("login");

  return (
    <section className="relative flex flex-col justify-center flex-1 px-4 py-12 sm:px-12 sm:py-16 lg:px-36 lg:py-24 mt-16 lg:mt-20">
      <div className="flex flex-col gap-6 sm:gap-12 lg:gap-20">
        {/* B.1 Key Visual — ROOT FURTHER logo */}
        <div>
          <Image
            src="/images/root-further-logo.png"
            alt="Root Further - SAA 2025 theme"
            width={700}
            height={310}
            priority
            className="w-full max-w-[245px] h-auto sm:max-w-[320px] lg:max-w-[460px] xl:max-w-[535px] object-contain"
          />
        </div>

        {/* B.2 Content + B.3 Login Button */}
        <div className="flex flex-col gap-6 pl-0 lg:pl-4">
          <p className="max-w-full text-base leading-7 sm:text-lg lg:text-xl xl:text-2xl lg:leading-[40px] xl:leading-[48px] lg:tracking-[0.5px] lg:max-w-[480px] xl:max-w-[580px] text-white font-bold whitespace-pre-line">
            {t("hero.description")}
          </p>

          <LoginButton />
        </div>
      </div>
    </section>
  );
}
