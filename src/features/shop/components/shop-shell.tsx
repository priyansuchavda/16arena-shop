"use client";

import { useMemo, useState } from "react";
import { ShopLayout } from "./shop-layout";
import { HeroCarousel, type HeroSlide } from "./hero-carousel";
import { ScrollRow } from "./scroll-row";
import { ShopCategoryView } from "./shop-category-view";
import { ShopCategorySectionCard } from "./shop-category-section-card";
import {
  CategoryItem,
  CardModel,
  MobileSection,
  ApiCategory,
  ApiProduct,
} from "@/features/shop/types/shop.types";
import {
  ALL_CATEGORY_SLUG,
  filterCardsByCategory,
  forYouFromCards,
  withActiveCategory,
} from "@/features/shop/utils/shop-catalog";
import { flattenCategories, apiToCard, categorySlugMap } from "@/features/shop/utils/mappers";

type ShopShellProps = {
  categories: ApiCategory[];
  categoryItems: CategoryItem[];
  allCards: CardModel[];
  featuredCards: CardModel[];
  sections: MobileSection[];
  categoryProductsMap: Record<string, ApiProduct[]>;
  slides: HeroSlide[];
  walletBalance: number;
};

export function ShopShell({
  categories,
  categoryItems,
  allCards,
  featuredCards,
  sections,
  categoryProductsMap,
  slides,
  walletBalance,
}: ShopShellProps) {
  const [activeSlug, setActiveSlug] = useState(ALL_CATEGORY_SLUG);
  const [searchQuery, setSearchQuery] = useState("");

  const visibleCategories = useMemo(
    () => withActiveCategory(categoryItems, activeSlug),
    [categoryItems, activeSlug],
  );

  const activeCategory = useMemo(
    () => categoryItems.find((c) => c.slug === activeSlug),
    [categoryItems, activeSlug],
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

  const slugs = useMemo(() => categorySlugMap(categories), [categories]);

  // Search filter results
  const searchResults = useMemo(() => {
    if (!searchQuery) return [];
    const q = searchQuery.toLowerCase().trim();
    return allCards.filter(
      (card) =>
        card.brand.toLowerCase().includes(q) ||
        (card.name && card.name.toLowerCase().includes(q)) ||
        (card.sub && card.sub.toLowerCase().includes(q))
    );
  }, [allCards, searchQuery]);

  // Dynamic layout rendering mapper
  const renderDynamicSections = () => {
    const renderedCategoryIds = new Set<string>();
    const list: React.ReactNode[] = [];

    const sortedSections = [...sections]
      .filter((s) => s.isVisible && s.isActive !== false)
      .sort((a, b) => a.priority - b.priority);

    sortedSections.forEach((sec, idx) => {
      const name = sec.name.toLowerCase();

      if (name === "shop_categories") {
        // Rendered as sidebar/strip in the layout, so we skip adding it to the rail.
        return;
      }

      if (name === "shop_banner") {
        list.push(
          <div key={sec.id || `banner-${idx}`} className="mb-5">
            <HeroCarousel slides={slides} />
          </div>
        );
      } else if (name === "featured_card") {
        if (forYou.length > 0) {
          list.push(
            <div key={sec.id || `foryou-${idx}`} className="mb-5 animate-fade-in">
              <ScrollRow title="For You" items={forYou} boxed card="forYou" />
            </div>
          );
        }
      } else if (name === "category_item_card" || name === "category_iteam_card") {
        const categoryFilter = (sec.category || "").toLowerCase();

        if (categoryFilter === "shop") {
          const flatCategories = flattenCategories(categories);
          flatCategories.forEach((cat) => {
            if (!cat.isHero) return;
            if (renderedCategoryIds.has(cat.id)) return;

            const prods = categoryProductsMap[cat.id] || [];
            const cards = prods.filter((p) => p.isActive !== false).map((p) => apiToCard(p, slugs));

            if (cards.length > 0) {
              renderedCategoryIds.add(cat.id);
              list.push(
                <div key={cat.id} className="mb-5 animate-fade-in">
                  <ScrollRow
                    title={cat.name}
                    items={cards}
                    boxed
                    card="section"
                    onViewAll={() => setActiveSlug(cat.slug)}
                  />
                </div>
              );
            }
          });
        } else {
          // Specific category mapping (using slug or ID)
          const flatCategories = flattenCategories(categories);
          const targetCategory = flatCategories.find(
            (cat) => cat.slug.toLowerCase() === categoryFilter || cat.id.toLowerCase() === categoryFilter
          );

          if (targetCategory && !renderedCategoryIds.has(targetCategory.id)) {
            const prods = categoryProductsMap[targetCategory.id] || [];
            const cards = prods.filter((p) => p.isActive !== false).map((p) => apiToCard(p, slugs));

            if (cards.length > 0) {
              renderedCategoryIds.add(targetCategory.id);
              list.push(
                <div key={targetCategory.id} className="mb-5 animate-fade-in">
                  <ScrollRow
                    title={targetCategory.name}
                    items={cards}
                    boxed
                    card="section"
                    onViewAll={() => setActiveSlug(targetCategory.slug)}
                  />
                </div>
              );
            }
          }
        }
      }
    });

    return list;
  };

  return (
    <ShopLayout
      categories={visibleCategories}
      walletBalance={walletBalance}
      categoryMode={!isHome}
      onSelectCategory={(slug) => {
        setActiveSlug(slug);
        setSearchQuery("");
      }}
      onSelectAll={() => {
        setActiveSlug(ALL_CATEGORY_SLUG);
        setSearchQuery("");
      }}
      searchQuery={searchQuery}
      onSearchChange={(q) => {
        setSearchQuery(q);
        if (q) {
          setActiveSlug(ALL_CATEGORY_SLUG);
        }
      }}
    >
      {searchQuery ? (
        <div className="animate-fade-in relative z-10 pt-6">
          <h2 className="font-heading text-[20px] font-extrabold text-white mb-6">
            Search Results for &apos;{searchQuery}&apos;
          </h2>
          {searchResults.length > 0 ? (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-x-4 gap-y-8">
              {searchResults.map((card, i) => (
                <div key={`${card.id}-${i}`} className="flex justify-start">
                  <ShopCategorySectionCard product={card} />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 border border-white/5 bg-[#121212]/30 rounded-2xl">
              <p className="text-sm text-[var(--muted)]">No matching brands or gift cards found.</p>
            </div>
          )}
        </div>
      ) : isHome ? (
        <div className="flex flex-col gap-2">
          {renderDynamicSections()}
        </div>
      ) : activeCategory ? (
        <ShopCategoryView category={activeCategory} cards={filtered} />
      ) : null}
    </ShopLayout>
  );
}
