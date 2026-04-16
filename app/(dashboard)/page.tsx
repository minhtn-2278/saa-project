import Image from "next/image";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { HeroBanner } from "@/components/homepage/HeroBanner";
import { RootFurtherLogo } from "@/components/homepage/RootFurtherLogo";
import { RootFurtherIntro } from "@/components/homepage/RootFurtherIntro";
import { RootFurtherContent } from "@/components/homepage/RootFurtherContent";
import { AwardsGrid } from "@/components/homepage/AwardsGrid";
import { KudosPromoBlock } from "@/components/homepage/KudosPromoBlock";
import { FloatingActionButton } from "@/components/homepage/FloatingActionButton";

export default async function HomepageSAA() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <>
      {/* Background image covers Hero + logo + first text block */}
      <section className="relative">
        <Image
          src="/images/homepage-hero-bg.png"
          alt=""
          fill
          priority
          sizes="100vw"
          className="absolute inset-0 object-cover object-center"
          aria-hidden="true"
        />

        {/* Gradient overlay */}
        <div
          className="absolute inset-0 z-[1]"
          style={{
            background:
              "linear-gradient(12deg, #00101A 23.7%, rgba(0, 18, 29, 0.46) 38.34%, rgba(0, 19, 32, 0.00) 48.92%)",
          }}
          aria-hidden="true"
        />

        <div className="relative z-10">
          <HeroBanner />
          <RootFurtherLogo />
          <RootFurtherIntro />
        </div>
      </section>

      {/* Remaining content on plain dark background */}
      <div className="flex flex-col gap-20 sm:gap-24 lg:gap-[120px] pb-20 sm:pb-24 lg:pb-[120px]">
        <RootFurtherContent />
        <AwardsGrid />
        <KudosPromoBlock />
      </div>

      <FloatingActionButton />

      <noscript>
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#00101A] text-white p-8 text-center">
          <p className="text-lg">
            JavaScript is required to use this application.
          </p>
        </div>
      </noscript>
    </>
  );
}
