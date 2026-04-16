import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { ArrowRightIcon } from "@/components/ui/icons/ArrowRightIcon";
import type { AwardCategory } from "@/types/homepage";

interface AwardCardProps {
  award: AwardCategory;
}

export function AwardCard({ award }: AwardCardProps) {
  const t = useTranslations("homepage.awards");
  const href = `/awards#${award.slug}`;

  return (
    <Link
      href={href}
      className="group flex flex-col gap-6 hover:-translate-y-1 motion-safe:transition-all focus:outline-2 focus:outline-[#FFEA9E] focus:outline-offset-2"
    >
      {/* Award image with golden border + glow */}
      <div
        className="relative aspect-square w-full rounded-[24px] overflow-hidden"
        style={{
          border: "1px solid #FFEA9E",
          boxShadow:
            "0 4px 4px rgba(0, 0, 0, 0.25), 0 0 6px #FAE287",
        }}
      >
        <Image
          src={award.thumbnailUrl}
          alt={t(`${award.i18nKey}.name`)}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover"
        />
      </div>

      {/* Text content */}
      <div className="flex flex-col gap-1 flex-1">
        <h3 className="text-lg sm:text-xl lg:text-2xl font-normal text-[#FFEA9E] leading-8">
          {t(`${award.i18nKey}.name`)}
        </h3>
        <p className="text-sm sm:text-base text-white leading-6 tracking-[0.5px] line-clamp-2">
          {t(`${award.i18nKey}.description`)}
        </p>
        <span className="flex items-center gap-1 pt-3 mt-auto text-base font-medium text-white tracking-[0.15px] group-hover:gap-2 motion-safe:transition-all">
          {t("detail")}
          <ArrowRightIcon size={16} />
        </span>
      </div>
    </Link>
  );
}
