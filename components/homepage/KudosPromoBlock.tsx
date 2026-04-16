import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { ArrowUpRightIcon } from "@/components/ui/icons/ArrowUpRightIcon";

export function KudosPromoBlock() {
  const t = useTranslations("homepage.kudos");

  return (
    <section className="px-4 sm:px-12 lg:px-36 max-w-[1512px] mx-auto w-full">
      {/* Card with background image */}
      <div className="relative rounded-2xl overflow-hidden min-h-[400px] sm:min-h-[450px] lg:min-h-[500px]">
        {/* Background image */}
        <Image
          src="/images/kudos-promo.png"
          alt=""
          fill
          sizes="(max-width: 1024px) 100vw, 1120px"
          className="object-cover"
          aria-hidden="true"
        />
        {/* Dark overlay for text readability */}
        <div
          className="absolute inset-0 bg-[#0F0F0F]/70"
          aria-hidden="true"
        />

        {/* Content */}
        <div className="relative z-10 flex items-center h-full min-h-[400px] sm:min-h-[450px] lg:min-h-[500px] px-6 sm:px-10 lg:px-16 py-10 sm:py-12 lg:py-16">
          <div className="flex flex-col gap-8 max-w-[457px]">
            {/* Header */}
            <div className="flex flex-col gap-4">
              <p className="text-lg sm:text-xl lg:text-2xl font-bold text-white leading-8">
                {t("label")}
              </p>
              <h2 className="text-3xl sm:text-[44px] lg:text-[57px] font-bold text-[#FFEA9E] leading-tight tracking-[-0.25px]">
                {t("title")}
              </h2>
              <p className="text-sm sm:text-base font-bold text-white leading-6 tracking-[0.5px] whitespace-pre-line text-justify">
                {t("description")}
              </p>
            </div>

            {/* CTA Button */}
            <Link
              href="/kudos"
              className="inline-flex items-center gap-2 px-4 py-4 bg-[#FFEA9E] text-[#00101A] font-bold text-base rounded hover:bg-[#F5DF8A] motion-safe:transition-all w-fit focus:outline-2 focus:outline-[#FFEA9E] focus:outline-offset-2"
            >
              {t("detail")}
              <ArrowUpRightIcon size={24} />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
