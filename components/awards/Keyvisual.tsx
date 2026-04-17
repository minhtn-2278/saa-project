import Image from "next/image";
import { AwardsTitle } from "./AwardsTitle";

export function Keyvisual() {
  return (
    <section className="relative w-full overflow-hidden">
      {/* Multicolored splash artwork — dark navy on the left, colorful art flowing in from the right */}
      <Image
        src="/images/homepage-hero-bg.jpg"
        alt=""
        fill
        priority
        sizes="100vw"
        aria-hidden="true"
        className="object-cover object-center"
      />

      {/* Bottom-fading gradient (confined to the lower 25% so the splash artwork stays visible) */}
      <div
        data-testid="keyvisual-overlay"
        className="absolute bottom-0 inset-x-0 h-1/4 bg-gradient-to-t from-[#00101A] to-transparent pointer-events-none"
      />

      {/*
       * Foreground content — constrained to the 1440 px design frame with mx-auto
       * so both the ROOT FURTHER logo (left-aligned) and the AwardsTitle (centered)
       * share the same horizontal bounds. On screens wider than 1440 px the whole
       * block stays centered, so the logo's left edge stays in line with the title
       * column instead of drifting to the viewport edge.
       */}
      <div className="relative z-10 mx-auto w-full max-w-[1440px] flex flex-col gap-24 lg:gap-36 pt-8 lg:pt-16 pb-6 lg:pb-10 px-4 lg:px-[144px]">
        {/* ROOT FURTHER typography logo — left edge aligned with the title column */}
        <Image
          src="/images/awards-keyvisual-logo.png"
          alt=""
          width={338}
          height={150}
          priority
          aria-hidden="true"
          className="w-[160px] lg:w-[338px] h-auto object-contain self-start"
        />

        {/* Title block — horizontally centered inside the same content column */}
        <AwardsTitle />
      </div>
    </section>
  );
}
