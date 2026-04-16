import { useTranslations } from "next-intl";

export function RootFurtherIntro() {
  const t = useTranslations("homepage.rootFurther");

  return (
    <div className="px-4 sm:px-12 lg:px-36 pt-8 sm:pt-10 lg:pt-12 pb-6 sm:pb-8 lg:pb-10 max-w-[1512px] mx-auto w-full">
      <p className="text-sm sm:text-base lg:text-lg font-bold text-white leading-7 sm:leading-8 whitespace-pre-line text-justify">
        {t("intro")}
      </p>
    </div>
  );
}
