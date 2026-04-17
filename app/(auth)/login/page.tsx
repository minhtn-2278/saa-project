import { Suspense } from "react";
import Image from "next/image";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppHeader } from "@/components/shared/AppHeader";
import { HeroSection } from "@/components/login/HeroSection";
import { AppFooter } from "@/components/shared/AppFooter";

export default async function LoginPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/");
  }

  return (
    <div className="relative min-h-screen bg-bg-primary overflow-hidden flex flex-col">
      {/* Layer 1: Background image */}
      <Image
        src="/images/login-bg.jpg"
        alt=""
        fill
        priority
        sizes="100vw"
        className="absolute inset-0 object-cover object-right-bottom"
        aria-hidden="true"
      />

      {/* Layer 2: Left gradient overlay */}
      <div
        className="absolute inset-0 z-[1]"
        style={{
          background:
            "linear-gradient(90deg, #00101A 0%, #00101A 25.41%, rgba(0, 16, 26, 0) 100%)",
        }}
        aria-hidden="true"
      />

      {/* Layer 3: Bottom gradient overlay */}
      <div
        className="absolute inset-0 z-[2]"
        style={{
          background:
            "linear-gradient(0deg, #00101A 3.75%, rgba(0, 19, 32, 0) 8.6%)",
        }}
        aria-hidden="true"
      />

      {/* Layer 4: Content */}
      <div className="relative z-10 flex flex-col min-h-screen w-full">
        <AppHeader showNav={false} />

        <main className="flex-1 flex flex-col max-w-[1440px] mx-auto w-full">
          <Suspense>
            <HeroSection />
          </Suspense>
        </main>

        <AppFooter showNav={false} />
      </div>

      <noscript>
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-bg-primary text-white p-8 text-center">
          <p className="text-lg">
            JavaScript is required to use this application. Please enable
            JavaScript in your browser settings and reload the page.
          </p>
        </div>
      </noscript>
    </div>
  );
}
