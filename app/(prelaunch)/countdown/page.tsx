import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getLaunchConfig } from "@/lib/validations/launch-config";
import { PrelaunchCountdown } from "@/components/prelaunch/PrelaunchCountdown";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "SAA 2025 - Coming soon",
  description: "Sun Annual Awards 2025 is launching soon.",
  robots: { index: false, follow: false },
  other: {
    "link:preload-prelaunch-bg":
      '<link rel="preload" as="image" fetchpriority="high" href="/images/prelaunch-bg.jpg">',
  },
};

export default async function CountdownPage() {
  const config = getLaunchConfig();

  if (!config || new Date() >= config.launchDate) {
    redirect("/");
  }

  const t = await getTranslations("prelaunch");

  return (
    <PrelaunchCountdown
      launchDate={config.launchDate.toISOString()}
      title={t("title")}
    />
  );
}
