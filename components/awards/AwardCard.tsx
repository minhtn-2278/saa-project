import { Fragment } from "react";
import { useTranslations } from "next-intl";
import type { Award } from "@/lib/awards/types";
import type { SupportedLocale } from "@/lib/utils/format";
import { TargetIcon } from "@/components/ui/icons/TargetIcon";
import { AwardImage } from "./AwardImage";
import { AwardMetadataRow } from "./AwardMetadataRow";

interface Props {
  award: Award;
  locale: SupportedLocale;
  /** Marks the first card so its image can render eager for section LCP. */
  isFirst?: boolean;
}

export function AwardCard({ award, locale }: Props) {
  const t = useTranslations();

  const layoutClass =
    award.layout === "image-right" ? "lg:flex-row-reverse" : "lg:flex-row";

  return (
    <article
      id={award.slug}
      className={`flex flex-col ${layoutClass} gap-8 lg:gap-10 w-full max-w-[856px] pb-12 lg:pb-20 border-b border-[#2E3940] scroll-mt-[104px]`}
    >
      <AwardImage src={award.imageUrl} name={t(award.nameKey)} />

      <div className="flex flex-col gap-6 lg:gap-8 w-full lg:w-[480px]">
        <div className="flex items-center gap-3">
          <TargetIcon className="h-6 w-6 lg:h-8 lg:w-8 shrink-0 text-[#FFEA9E]" />
          <h2 className="text-2xl lg:text-[36px] font-bold leading-tight lg:leading-[44px] text-white">
            {t(award.nameKey)}
          </h2>
        </div>
        <p className="text-base font-bold leading-6 tracking-[0.5px] text-white">
          {t(award.descriptionKey)}
        </p>
        <hr className="border-0 border-t border-[#2E3940]" />
        <dl className="flex flex-col gap-6">
          <AwardMetadataRow
            variant="quantity"
            quantity={award.quantity}
            unit={award.unit}
            locale={locale}
          />
          <hr
            data-testid="quantity-value-divider"
            className="border-0 border-t border-[#2E3940]"
          />
          {award.valueTiers.map((tier, idx) => (
            <Fragment key={idx}>
              {idx > 0 && (
                <div
                  role="separator"
                  aria-label={t("awardsPage.or")}
                  className="flex items-center gap-3"
                >
                  <span className="text-base font-bold leading-6 text-[#2E3940]">
                    {t("awardsPage.or")}
                  </span>
                  <hr className="flex-1 border-0 border-t border-[#2E3940]" />
                </div>
              )}
              <AwardMetadataRow
                variant="value"
                valueVnd={tier.valueVnd}
                locale={locale}
                perAwardLabelKey={tier.labelKey ?? "awardsPage.perAward"}
              />
            </Fragment>
          ))}
        </dl>
      </div>
    </article>
  );
}
