import { useTranslations } from "next-intl";

export function AwardsSectionHeader() {
  const t = useTranslations("homepage.awards");

  return (
    <div className="flex flex-col gap-4">
      <p className="text-lg sm:text-xl lg:text-2xl font-bold text-white leading-8">
        {t("sectionLabel")}
      </p>
      {/* Divider */}
      <div className="h-px bg-[#2E3940]" />
      <h2 className="text-3xl sm:text-[44px] lg:text-[57px] font-bold text-[#FFEA9E] leading-tight tracking-[-0.25px]">
        {t("title")}
      </h2>
    </div>
  );
}
