import Image from "next/image";
import { useTranslations } from "next-intl";
import { CountdownTimer } from "@/components/shared/CountdownTimer";
import { EventInfo } from "./EventInfo";
import { CTAButtons } from "./CTAButtons";

export function HeroBanner() {
  const t = useTranslations("homepage.hero");
  const targetDate = process.env.NEXT_PUBLIC_EVENT_START_DATE ?? "";

  return (
    <div className="flex flex-col justify-center min-h-[calc(100vh-4rem)] lg:min-h-[calc(100vh-5rem)] px-4 sm:px-12 lg:px-36 py-12 sm:py-16 lg:py-24 max-w-[1512px] mx-auto w-full">
      <div className="flex flex-col gap-6 sm:gap-8 lg:gap-10">
        {/* ROOT FURTHER logo image */}
        <Image
          src="/images/root-further-content-logo.png"
          alt="Root Further - SAA 2025"
          width={451}
          height={200}
          priority
          className="w-full max-w-[240px] sm:max-w-[350px] lg:max-w-[451px] h-auto object-contain"
        />

        <CountdownTimer targetDate={targetDate} size="sm" title={t("comingSoon")} />
        <EventInfo />
        <CTAButtons />
      </div>
    </div>
  );
}
