import Link from "next/link";
import { useTranslations } from "next-intl";
import { ArrowUpRightIcon } from "@/components/ui/icons/ArrowUpRightIcon";

export function CTAButtons() {
  const t = useTranslations("homepage.cta");

  return (
    <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6 lg:gap-10">
      {/* Primary: ABOUT AWARDS */}
      <Link
        href="/awards"
        className="inline-flex items-center gap-2 px-6 py-4 bg-[#FFEA9E] text-[#00101A] font-bold text-lg sm:text-xl lg:text-[22px] rounded-lg hover:bg-[#F5DF8A] motion-safe:transition-all focus:outline-2 focus:outline-[#FFEA9E] focus:outline-offset-2"
      >
        {t("aboutAwards")}
        <ArrowUpRightIcon size={24} />
      </Link>

      {/* Secondary: ABOUT KUDOS */}
      <Link
        href="/kudos"
        className="inline-flex items-center gap-2 px-6 py-4 bg-[rgba(255,234,158,0.1)] text-white font-bold text-lg sm:text-xl lg:text-[22px] rounded-lg border border-[#998C5F] hover:bg-[#FFEA9E] hover:text-[#00101A] hover:border-transparent motion-safe:transition-all focus:outline-2 focus:outline-[#FFEA9E] focus:outline-offset-2"
      >
        {t("aboutKudos")}
        <ArrowUpRightIcon size={24} />
      </Link>
    </div>
  );
}
