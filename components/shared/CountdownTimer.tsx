"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";

const defaultClock = () => new Date();


type CountdownSize = "sm" | "lg";

type CountdownTimerProps = {
  targetDate: string;
  size?: CountdownSize;
  title?: string;
  tickIntervalMs?: number;
  clock?: () => Date;
  onExpire?: () => void;
  /** Serializable alternative to onExpire — hard-navigates to this URL on expiry. */
  autoLiftHref?: string;
};

type TimeLeft = { days: number; hours: number; minutes: number } | null;

function computeTimeLeft(targetDate: string, now: Date): TimeLeft {
  const target = new Date(targetDate).getTime();
  if (Number.isNaN(target)) return { days: 0, hours: 0, minutes: 0 };

  const diff = target - now.getTime();
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0 };

  const days = Math.min(99, Math.floor(diff / 86_400_000));
  const hours = Math.floor((diff / 3_600_000) % 24);
  const minutes = Math.floor((diff / 60_000) % 60);
  return { days, hours, minutes };
}

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

function DigitCell({ digit, size }: { digit: string; size: CountdownSize }) {
  const cellClass =
    size === "lg"
      ? "relative w-12 h-[76px] sm:w-16 sm:h-[102px] lg:w-[77px] lg:h-[123px] rounded-xl overflow-hidden flex items-center justify-center"
      : "relative w-[36px] h-[58px] sm:w-[44px] sm:h-[70px] lg:w-[51px] lg:h-[82px] rounded-lg overflow-hidden flex items-center justify-center";

  const glyphClass =
    size === "lg"
      ? "relative z-10 text-[44px] sm:text-[60px] lg:text-[73.728px] leading-none text-white font-[family-name:var(--font-digital-numbers)] motion-safe:transition-opacity motion-safe:duration-200 motion-reduce:transition-none"
      : "relative z-10 text-[34px] sm:text-[42px] lg:text-[49px] leading-none text-white font-[family-name:var(--font-digital-numbers)]";

  const surfaceClass =
    size === "lg"
      ? "absolute inset-0 rounded-xl border-[0.75px] border-[color:var(--color-accent-gold)] opacity-50 backdrop-blur-[24.96px] bg-[linear-gradient(180deg,#FFFFFF_0%,rgba(255,255,255,0.10)_100%)]"
      : "absolute inset-0 rounded-lg border border-[rgba(255,234,158,0.5)] backdrop-blur-[16px] bg-[linear-gradient(180deg,rgba(255,255,255,0.62)_0%,rgba(255,255,255,0)_100%)]";

  return (
    <div className={cellClass}>
      <span className={surfaceClass} aria-hidden />
      <span className={glyphClass}>{digit}</span>
    </div>
  );
}

export function CountdownTimer({
  targetDate,
  size = "sm",
  title,
  tickIntervalMs = 60_000,
  clock = defaultClock,
  onExpire,
  autoLiftHref,
}: CountdownTimerProps) {
  const t = useTranslations("homepage.countdown");

  const [timeLeft, setTimeLeft] = useState<TimeLeft>(null);
  const expiredFired = useRef(false);

  const clockRef = useRef(clock);
  const onExpireRef = useRef(onExpire);

  useEffect(() => {
    clockRef.current = clock;
  }, [clock]);

  useEffect(() => {
    onExpireRef.current = onExpire;
  }, [onExpire]);

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    let cancelled = false;

    function schedule(next: TimeLeft) {
      const nearExpiry =
        next !== null && next.days === 0 && next.hours === 0 && next.minutes < 2;
      const interval = nearExpiry ? 5_000 : tickIntervalMs;
      timeoutId = setTimeout(tick, interval);
    }

    function tick() {
      if (cancelled) return;
      const next = computeTimeLeft(targetDate, clockRef.current());
      setTimeLeft(next);
      if (next && next.days === 0 && next.hours === 0 && next.minutes === 0) {
        if (!expiredFired.current) {
          expiredFired.current = true;
          onExpireRef.current?.();
          if (autoLiftHref && typeof window !== "undefined") {
            window.location.assign(autoLiftHref);
          }
        }
        return;
      }
      schedule(next);
    }

    tick();
    return () => {
      cancelled = true;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [targetDate, tickIntervalMs, autoLiftHref]);

  const displayDays = timeLeft ? pad(timeLeft.days) : "--";
  const displayHours = timeLeft ? pad(timeLeft.hours) : "--";
  const displayMinutes = timeLeft ? pad(timeLeft.minutes) : "--";

  const units = [
    { key: "days", value: displayDays, label: t("days") },
    { key: "hours", value: displayHours, label: t("hours") },
    { key: "minutes", value: displayMinutes, label: t("minutes") },
  ];

  const ariaLabel = timeLeft
    ? `${timeLeft.days} ${t("days")}, ${timeLeft.hours} ${t("hours")}, ${timeLeft.minutes} ${t("minutes")}`
    : "Event countdown";

  const wrapperClass =
    size === "lg"
      ? "flex flex-col items-center gap-6 w-full"
      : "flex flex-col items-start gap-4";

  const titleClass =
    size === "lg"
      ? "text-center text-xl sm:text-3xl lg:text-4xl lg:leading-[48px] font-bold text-white"
      : "text-lg sm:text-xl lg:text-2xl font-bold text-white leading-8";

  const timeRowClass =
    size === "lg"
      ? "flex items-start justify-center gap-4 sm:gap-8 lg:gap-[60px]"
      : "flex items-start gap-6 sm:gap-8 lg:gap-10";

  const unitColumnClass =
    size === "lg"
      ? "flex flex-col items-start gap-[21px]"
      : "flex flex-col items-center gap-2 sm:gap-3 lg:gap-3.5";

  const digitRowClass =
    size === "lg"
      ? "flex items-center gap-[21px]"
      : "flex gap-2 sm:gap-3 lg:gap-3.5";

  const labelClass =
    size === "lg"
      ? "text-base sm:text-2xl lg:text-4xl lg:leading-[48px] font-bold text-white uppercase"
      : "text-xs sm:text-[13px] lg:text-sm font-semibold text-white tracking-[2px] uppercase";

  return (
    <div className={wrapperClass}>
      {title ? (
        size === "lg" ? (
          <h1 className={titleClass}>{title}</h1>
        ) : (
          <p className={titleClass}>{title}</p>
        )
      ) : null}

      <div
        className={timeRowClass}
        role="timer"
        aria-live="polite"
        aria-label={ariaLabel}
      >
        {units.map((unit) => (
          <div key={unit.key} className={unitColumnClass}>
            <div className={digitRowClass}>
              {unit.value.split("").map((digit, index) => (
                <DigitCell key={index} digit={digit} size={size} />
              ))}
            </div>
            <span className={labelClass}>{unit.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
