import { CategoryItem } from "@/features/shop/types/shop.types";
import { CardModel } from "@/features/shop/types/shop.types";
import { categoryPageTitle, heroForCategory, voucherLabel } from "@/features/shop/utils/category-heroes";
import { CategoryHeroBackdrop } from "./category-hero-backdrop";
import { ShopCategorySectionCard } from "./shop-category-section-card";

type ShopCategoryViewProps = {
  category: CategoryItem;
  cards: CardModel[];
};

export function ShopCategoryView({ category, cards }: ShopCategoryViewProps) {
  const hero = heroForCategory(category.slug, category.color);
  const title = categoryPageTitle(category.label, category.slug);
  const count = cards.length;

  return (
    <section className="relative w-full bg-[var(--void)]">
      {/* Hero zone — full main-column width, image rises behind the top bar */}
      <div className="relative">
        <CategoryHeroBackdrop hero={hero} accent={category.color} />

        <div className="px-5 lg:px-10">
          <div className="relative z-10 mx-auto max-w-[1160px] pt-8 sm:pt-10 lg:pt-14">
            <h1 className="font-heading text-[28px] font-bold leading-tight tracking-tight text-white sm:text-[34px]">
              {title}
            </h1>
            <p className="mt-1.5 text-sm text-white/70">{voucherLabel(count)}</p>
          </div>
        </div>

        {/* Image continues below the text; fade runs through this gap to the cards */}
        <div className="h-20 sm:h-24 lg:h-28" aria-hidden />
      </div>

      {/* Cards — solid void; image fade completes at the seam above */}
      <div className="relative z-10 bg-[var(--void)] px-5 pb-16 lg:px-10">
        {cards.length > 0 ? (
          <div className="mx-auto grid max-w-[1160px] grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-x-4 gap-y-8">
            {cards.map((card, i) => (
              <div key={`${card.id}-${i}`} className="flex justify-start">
                <ShopCategorySectionCard product={card} />
              </div>
            ))}
          </div>
        ) : (
          <p className="py-16 text-center text-sm text-[var(--muted)]">No vouchers in this category yet.</p>
        )}
      </div>
    </section>
  );
}
