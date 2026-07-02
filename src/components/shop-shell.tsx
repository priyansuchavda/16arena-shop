"use client";

import { useMemo, useState } from "react";
import { ShopLayout } from "./shop-layout";
import { HeroCarousel, type HeroSlide } from "./hero-carousel";
import { ScrollRow } from "./scroll-row";
import { ShopCategoryView } from "./shop-category-view";
import type { CategoryItem, LiveSection } from "@/lib/api";
import type { CardModel } from "@/lib/products";
import {
  ALL_CATEGORY_SLUG,
  filterCardsByCategory,
  forYouFromCards,
  sectionsFromCards,
  withActiveCategory,
} from "@/lib/shop-catalog";

type ShopShellProps = {
  categories: CategoryItem[];
  allCards: CardModel[];
  featuredCards: CardModel[];
  sections: LiveSection[];
  slides: HeroSlide[];
  walletBalance: number;
};

export function ShopShell({
  categories,
  allCards,
  featuredCards,
  sections,
  slides,
  walletBalance,
}: ShopShellProps) {
  const [activeSlug, setActiveSlug] = useState(ALL_CATEGORY_SLUG);

  const visibleCategories = useMemo(
    () => withActiveCategory(categories, activeSlug),
    [categories, activeSlug],
  );

  const activeCategory = useMemo(
    () => categories.find((c) => c.slug === activeSlug),
    [categories, activeSlug],
  );

  const filtered = useMemo(
    () => filterCardsByCategory(allCards, activeSlug),
    [allCards, activeSlug],
  );

  const isHome = activeSlug === ALL_CATEGORY_SLUG;

  const forYou = useMemo(() => {
    if (featuredCards && featuredCards.length > 0) {
      return featuredCards;
    }
    return forYouFromCards(allCards);
  }, [featuredCards, allCards]);

  return (
    <ShopLayout
      categories={visibleCategories}
      walletBalance={walletBalance}
      categoryMode={!isHome}
      onSelectCategory={setActiveSlug}
      onSelectAll={() => setActiveSlug(ALL_CATEGORY_SLUG)}
    >
      {isHome ? (
        <>
          <HeroCarousel slides={slides} />
          {forYou.length > 0 && <ScrollRow title="For You" items={forYou} boxed card="forYou" />}
          {sections.map((s) => (
            <ScrollRow key={s.title} title={s.title} items={s.items} boxed card="section" />
          ))}
        </>
      ) : activeCategory ? (
        <ShopCategoryView category={activeCategory} cards={filtered} />
      ) : null}
    </ShopLayout>
  );
}
