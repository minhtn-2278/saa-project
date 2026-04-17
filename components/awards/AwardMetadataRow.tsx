import { useTranslations } from "next-intl";
import { formatVND, padQuantity, type SupportedLocale } from "@/lib/utils/format";
import type { UnitKey } from "@/lib/awards/types";
import { DiamondIcon } from "@/components/ui/icons/DiamondIcon";
import { LicenseIcon } from "@/components/ui/icons/LicenseIcon";

type Props =
  | {
      variant: "quantity";
      quantity: number;
      unit: UnitKey;
      locale: SupportedLocale;
    }
  | {
      variant: "value";
      valueVnd: number;
      locale: SupportedLocale;
      perAwardLabelKey?: string;
    };

export function AwardMetadataRow(props: Props) {
  const t = useTranslations("awardsPage");
  const tRoot = useTranslations();

  if (props.variant === "quantity") {
    return (
      <div className="flex flex-row items-center flex-wrap gap-4">
        <div className="flex items-center gap-2">
          <DiamondIcon className="h-5 w-5 lg:h-6 lg:w-6 text-white" />
          <dt className="text-base font-bold leading-6 text-[#FFEA9E]">
            {t("quantityLabel")}
          </dt>
        </div>
        <dd className="flex items-baseline gap-2">
          <span className="text-[28px] lg:text-4xl font-bold leading-tight lg:leading-[44px] text-white">
            {padQuantity(props.quantity)}
          </span>
          <span className="text-base font-bold leading-6 text-white">
            {t(`units.${props.unit}`)}
          </span>
        </dd>
      </div>
    );
  }

  return (
    <div className="flex flex-row items-center flex-wrap gap-4">
      <div className="flex items-center gap-2">
        <LicenseIcon className="h-5 w-5 lg:h-6 lg:w-6 text-white" />
        <dt className="text-base font-bold leading-6 text-[#FFEA9E]">
          {t("valueLabel")}
        </dt>
      </div>
      <dd className="flex items-baseline gap-2 flex-wrap">
        <span className="text-[28px] lg:text-4xl font-bold leading-tight lg:leading-[44px] text-white">
          {formatVND(props.valueVnd, props.locale)}
        </span>
        {props.perAwardLabelKey && (
          <span className="text-base font-bold leading-6 text-white">
            {tRoot(props.perAwardLabelKey)}
          </span>
        )}
      </dd>
    </div>
  );
}
