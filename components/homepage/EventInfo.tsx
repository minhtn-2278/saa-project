"use client";

import { useTranslations } from "next-intl";

function formatEventDate(isoDate: string): string {
  try {
    const date = new Date(isoDate);
    if (isNaN(date.getTime())) return "";
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return "";
  }
}

export function EventInfo() {
  const t = useTranslations("homepage.eventInfo");
  const eventDate = process.env.NEXT_PUBLIC_EVENT_START_DATE || "";
  const formattedDate = formatEventDate(eventDate);

  return (
    <div className="flex flex-col gap-2">
      {/* Time and Venue row */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-10 lg:gap-[60px]">
        {/* Time group */}
        <div className="flex items-baseline gap-2">
          <span className="text-sm sm:text-base font-bold text-white tracking-[0.15px]">
            {t("timeLabel")}
          </span>
          <span className="text-xl sm:text-[22px] lg:text-2xl font-bold text-[#FFEA9E] leading-8">
            {formattedDate || t("timeValue")}
          </span>
        </div>

        {/* Venue group */}
        <div className="flex items-baseline gap-2">
          <span className="text-sm sm:text-base font-bold text-white tracking-[0.15px]">
            {t("venueLabel")}
          </span>
          <span className="text-xl sm:text-[22px] lg:text-2xl font-bold text-[#FFEA9E] leading-8">
            {t("venueValue")}
          </span>
        </div>
      </div>

      {/* Livestream note */}
      <p className="text-sm sm:text-base font-bold text-white tracking-[0.5px]">
        {t("livestream")}
      </p>
    </div>
  );
}
