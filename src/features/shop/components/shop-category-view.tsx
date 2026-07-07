import { CategoryItem } from "@/features/shop/types/shop.types";
import { CardModel } from "@/features/shop/types/shop.types";
import { categoryPageTitle, heroForCategory, voucherLabel } from "@/features/shop/utils/category-heroes";
import { CategoryHeroBackdrop } from "./category-hero-backdrop";
import { ShopCategorySectionCard } from "./shop-category-section-card";
import { ScrollRow } from "./scroll-row";
import { Ticket } from "lucide-react";
import Link from "next/link";

type ShopCategoryViewProps = {
  category: CategoryItem;
  cards: CardModel[];
  popularCards?: CardModel[];
};

export function ShopCategoryView({ category, cards, popularCards = [] }: ShopCategoryViewProps) {
  const hero = heroForCategory(category.slug, category.color);
  const title = categoryPageTitle(category.label, category.slug);
  const count = cards.length;

  return (
    <section className="relative w-full bg-[var(--void)]">
      {/* Hero zone — full main-column width, image rises behind the top bar */}
      <div className="relative">
        <CategoryHeroBackdrop hero={hero} accent={category.color} />

        <div className="px-5 lg:px-10">
          <div className="shop-content-width relative z-10 pt-8 sm:pt-10 lg:pt-14">
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
          <div className="shop-content-width grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-x-4 gap-y-8">
            {cards.map((card, i) => (
              <div key={`${card.id}-${i}`} className="flex justify-start">
                <ShopCategorySectionCard product={card} />
              </div>
            ))}
          </div>
        ) : (
          <div className="shop-content-width py-12 md:py-16">
            <div className="mx-auto max-w-md rounded-3xl border border-white/5 bg-[var(--surface)]/30 p-8 text-center backdrop-blur-md shadow-2xl transition duration-300 hover:border-[var(--flame)]/25">
              <div className="relative mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--flame)]/10 to-[var(--flame)]/[0.02] border border-[var(--flame)]/20 text-[var(--flame)] shadow-[0_8px_20px_-6px_rgba(254,131,33,0.25)]">
                <Ticket size={28} strokeWidth={1.5} className="rotate-[-10deg]" />
                <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--void)] border border-white/10 text-[var(--muted)] text-[10px] font-bold">
                  ?
                </span>
              </div>

              <h3 className="font-heading text-lg font-bold text-white mb-2">Restocking Vouchers</h3>
              <p className="text-sm text-[var(--muted)] leading-relaxed max-w-xs mx-auto mb-6">
                We're currently updating our stock for <strong className="text-white">{category.label}</strong>. Check back shortly or browse other active vouchers!
              </p>

              <Link
                href="/shop"
                className="inline-flex h-[42px] items-center gap-2 rounded-xl bg-gradient-to-r from-[var(--flame)] to-[var(--flame-deep)] px-6 text-xs font-bold text-black shadow-[0_8px_16px_-6px_rgba(254,131,33,0.3)] transition hover:brightness-110 active:scale-[0.98]"
              >
                Explore All Vouchers
              </Link>
            </div>

            {popularCards.length > 0 && (
              <div className="mt-16 border-t border-white/5 pt-10">
                <ScrollRow title="Popular Gift Cards" items={popularCards} card="section" />
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
