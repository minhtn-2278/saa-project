import type { SupportedLocale } from "@/lib/utils/format";
import { AWARDS } from "@/lib/awards/data";
import { AwardCard } from "./AwardCard";
import { SignatureAwardCard } from "./SignatureAwardCard";
import { AwardsMenu, type AwardsMenuItem } from "./AwardsMenu";

interface Props {
  locale: SupportedLocale;
}

export function AwardsSection({ locale }: Props) {
  const menuItems: AwardsMenuItem[] = AWARDS.map((a) => ({
    slug: a.slug,
    nameKey: a.nameKey,
  }));

  return (
    <section className="flex flex-col lg:flex-row lg:justify-between lg:gap-20 w-full">
      <AwardsMenu items={menuItems} />
      <div className="flex flex-col gap-16 lg:gap-20 w-full lg:max-w-[856px] mt-8 lg:mt-0">
        {AWARDS.map((award) =>
          award.slug === "signature-2025" ? (
            <SignatureAwardCard
              key={award.slug}
              award={award}
              locale={locale}
            />
          ) : (
            <AwardCard key={award.slug} award={award} locale={locale} />
          )
        )}
      </div>
    </section>
  );
}
