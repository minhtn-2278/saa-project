import { useTranslations } from "next-intl";

export function RootFurtherContent() {
  const t = useTranslations("homepage.rootFurther");

  return (
    <div className="px-4 sm:px-12 lg:px-36 pt-6 sm:pt-8 lg:pt-10 pb-16 sm:pb-20 lg:pb-24 max-w-[1512px] mx-auto w-full">
      <div className="flex flex-col gap-10 sm:gap-12 lg:gap-16">
        {/* Quote — centered, italic */}
        <blockquote className="flex flex-col items-center gap-2 py-4">
          <p className="text-base sm:text-lg lg:text-xl font-bold text-white italic text-center leading-8">
            {t("quote")}
          </p>
          <p className="text-sm sm:text-base text-white/70 text-center">
            {t("quoteAttribution")}
          </p>
        </blockquote>

        {/* Conclusion paragraphs */}
        <p className="text-sm sm:text-base lg:text-lg font-bold text-white leading-7 sm:leading-8 whitespace-pre-line text-justify">
          {t("conclusion")}
        </p>
      </div>
    </div>
  );
}
