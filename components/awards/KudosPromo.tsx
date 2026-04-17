import Link from "next/link";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { ArrowRightIcon } from "@/components/ui/icons/ArrowRightIcon";

export function KudosPromo() {
  const t = useTranslations("awardsPage");

  return (
    <section className="relative w-full lg:h-[500px] bg-[#0F0F0F] overflow-hidden flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8 px-4 py-10 lg:px-[90px]">
      {/* Decorative background image */}
      <Image
        src="/images/kudos-promo.png"
        alt=""
        fill
        sizes="100vw"
        className="object-cover opacity-40 pointer-events-none"
        aria-hidden="true"
      />

      {/* Foreground content */}
      <div className="relative z-10 flex flex-col gap-6 lg:gap-8 max-w-[470px]">
        <p className="text-base font-bold leading-6 text-white">
          {t("kudos.eyebrow")}
        </p>
        <h2 className="text-2xl lg:text-[36px] font-bold leading-tight lg:leading-[44px] text-white">
          {t("kudos.title")}
        </h2>
        <p className="text-base font-normal leading-6 text-white whitespace-pre-line">
          {t("kudos.description")}
        </p>
        <Link
          href="/kudos"
          className="inline-flex items-center gap-2 px-6 py-3 rounded bg-[#FFEA9E] text-[#00101A] text-base font-bold leading-6 tracking-[0.5px] w-fit motion-safe:transition-colors hover:bg-[#F5DF8A] focus:outline-2 focus:outline-[#FFEA9E] focus:outline-offset-2"
        >
          {t("kudos.cta")}
          <ArrowRightIcon size={20} />
        </Link>
      </div>

      {/* KUDOS decorative logotype */}
      <p
        aria-hidden="true"
        className="relative z-10 text-[56px] lg:text-[96px] font-black tracking-[-0.13em] text-[#DBD1C1] leading-none select-none"
        style={{ fontFamily: "Montserrat, sans-serif" }}
      >
        KUDOS
      </p>
    </section>
  );
}
