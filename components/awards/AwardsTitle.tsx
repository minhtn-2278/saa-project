import { useTranslations } from "next-intl";

export function AwardsTitle() {
  const t = useTranslations("awardsPage");
  return (
    <section className="flex flex-col gap-4 w-full text-center">
      <p className="text-xl lg:text-2xl font-bold leading-8 text-white">
        {t("eyebrow")}
      </p>
      <hr className="border-0 border-t border-[#2E3940]" />
      <h1 className="text-3xl lg:text-[57px] font-bold leading-tight lg:leading-[64px] text-[#FFEA9E]">
        {t("title")}
      </h1>
    </section>
  );
}
