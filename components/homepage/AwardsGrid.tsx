import { awardCategories } from "@/lib/data/award-categories";
import { AwardsSectionHeader } from "./AwardsSectionHeader";
import { AwardCard } from "./AwardCard";

export function AwardsGrid() {
  return (
    <section className="px-4 sm:px-12 lg:px-36 max-w-[1512px] mx-auto w-full">
      <AwardsSectionHeader />

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-10 lg:gap-20 mt-10 sm:mt-12 lg:mt-16">
        {awardCategories.map((award) => (
          <AwardCard key={award.id} award={award} />
        ))}
      </div>
    </section>
  );
}
