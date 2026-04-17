import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { Keyvisual } from "@/components/awards/Keyvisual";
import { AwardsSection } from "@/components/awards/AwardsSection";
import { KudosPromo } from "@/components/awards/KudosPromo";
import type { SupportedLocale } from "@/lib/utils/format";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("awardsPage");
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: { canonical: "/awards" },
    openGraph: {
      title: t("metaTitle"),
      description: t("metaDescription"),
      images: [
        { url: "/images/og-awards.jpg", width: 1200, height: 630 },
      ],
    },
  };
}

export default async function AwardsSystemPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const locale = (await getLocale()) as SupportedLocale;

  return (
    <>
      <Keyvisual />
      <div className="mx-auto w-full max-w-[1440px] px-4 lg:px-[144px] py-12 lg:py-24 flex flex-col gap-16 lg:gap-[120px]">
        <AwardsSection locale={locale} />
        <KudosPromo />
      </div>
    </>
  );
}
