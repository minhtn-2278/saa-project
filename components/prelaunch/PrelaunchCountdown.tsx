import Image from "next/image";
import { CountdownTimer } from "@/components/shared/CountdownTimer";

type PrelaunchCountdownProps = {
  launchDate: string;
  title: string;
};

export function PrelaunchCountdown({ launchDate, title }: PrelaunchCountdownProps) {
  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[color:var(--color-bg-primary)]">
      <Image
        fill
        priority
        sizes="100vw"
        src="/images/prelaunch-bg.jpg"
        alt=""
        className="object-cover"
      />
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none bg-[linear-gradient(18deg,#00101A_15.48%,rgba(0,18,29,0.46)_52.13%,rgba(0,19,32,0)_63.41%)]"
      />
      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center gap-6 px-4 py-6 sm:px-8 sm:py-12 lg:px-36 lg:py-24">
        <CountdownTimer
          size="lg"
          title={title}
          targetDate={launchDate}
          tickIntervalMs={60_000}
          autoLiftHref="/"
        />
      </div>
    </div>
  );
}
