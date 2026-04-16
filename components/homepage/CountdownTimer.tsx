"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";

function calculateTimeLeft(targetDate: string) {
  const diff = new Date(targetDate).getTime() - Date.now();
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0 };

  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
  };
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function DigitBox({ digit }: { digit: string }) {
  return (
    <div
      className="w-[36px] h-[58px] sm:w-[44px] sm:h-[70px] lg:w-[51px] lg:h-[82px] rounded-lg flex items-center justify-center"
      style={{
        background:
          "linear-gradient(180deg, #ffffff9d 0%, rgba(255, 255, 255, 0) 100%)",
        border: "0.5px solid rgba(255, 234, 158, 0.5)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
      }}
    >
      <span className="text-[34px] sm:text-[42px] lg:text-[49px] text-white leading-none font-[family-name:var(--font-digital-numbers)]">
        {digit}
      </span>
    </div>
  );
}

export function CountdownTimer() {
  const t = useTranslations("homepage");
  const targetDate = process.env.NEXT_PUBLIC_EVENT_START_DATE || "";

  const [timeLeft, setTimeLeft] = useState(() =>
    calculateTimeLeft(targetDate)
  );

  const isZero =
    timeLeft.days === 0 && timeLeft.hours === 0 && timeLeft.minutes === 0;

  useEffect(() => {
    if (!targetDate) return;

    const interval = setInterval(() => {
      setTimeLeft(calculateTimeLeft(targetDate));
    }, 60_000);

    return () => clearInterval(interval);
  }, [targetDate]);

  const units = [
    { value: timeLeft.days, label: t("countdown.days") },
    { value: timeLeft.hours, label: t("countdown.hours") },
    { value: timeLeft.minutes, label: t("countdown.minutes") },
  ];

  return (
    <div className="flex flex-col items-start gap-4">
      {!isZero && (
        <p className="text-lg sm:text-xl lg:text-2xl font-bold text-white leading-8">
          {t("hero.comingSoon")}
        </p>
      )}

      <div
        className="flex items-start gap-6 sm:gap-8 lg:gap-10"
        role="timer"
        aria-live="polite"
        aria-label="Event countdown"
      >
        {units.map((unit, i) => (
          <div
            key={unit.label}
            className="flex items-start gap-6 sm:gap-8 lg:gap-10"
          >
            <div className="flex flex-col items-center gap-2 sm:gap-3 lg:gap-3.5">
              <div className="flex gap-2 sm:gap-3 lg:gap-3.5">
                {pad(unit.value)
                  .split("")
                  .map((digit, j) => (
                    <DigitBox key={j} digit={digit} />
                  ))}
              </div>
              <span className="text-xs sm:text-[13px] lg:text-sm font-semibold text-white tracking-[2px] uppercase">
                {unit.label}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
