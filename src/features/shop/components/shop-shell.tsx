"use client";

import { useMemo, useState } from "react";
import { ShopLayout } from "./shop-layout";
import { HeroCarousel, type HeroSlide } from "./hero-carousel";
import { ScrollRow } from "./scroll-row";
import { ShopCategoryCards } from "./shop-category-cards";
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
  slides: initialSlides,
  walletBalance,
}: ShopShellProps) {
  const [activeSlug, setActiveSlug] = useState(ALL_CATEGORY_SLUG);
  const [searchQuery, setSearchQuery] = useState("");

  const slides = useMemo(() => {
    // Static customizable slide 1 (Gaming)
    const staticSlide1: HeroSlide = {
      id: "static-promo-banner-1",
      slug: "bgmi-uc",
      eyebrow: "16ARENA TRUSTED STORE",
      title: "ASDASD",
      subtitle: "Get flat 15% off on gaming credits instantly.",
      cta: "TOP UP NOW",
      accent: "#FF973C",
      accent2: "#FF973C",
      imageUrl: "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1800&q=80",
    };

    // Static customizable slide 2 (Food/Swiggy)
    const staticSlide2: HeroSlide = {
      id: "static-promo-banner-2",
      slug: "swiggy",
      eyebrow: "16ARENA TRUSTED STORE",
      title: "SWIGGY DEALS",
      subtitle: "Get flat 15% off on food orders instantly.",
      cta: "ORDER NOW",
      accent: "#FC8019",
      accent2: "#FC8019",
      imageUrl: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1800&q=80",
    };

    // Static customizable slide 3 (Music/Spotify)
    const staticSlide3: HeroSlide = {
      id: "static-promo-banner-3",
      slug: "spotify",
      eyebrow: "16ARENA TRUSTED STORE",
      title: "SPOTIFY PREMIUM",
      subtitle: "Get flat 15% off on music streaming subscriptions instantly.",
      cta: "LISTEN NOW",
      accent: "#1DB954",
      accent2: "#1DB954",
      imageUrl: "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?auto=format&fit=crop&w=1800&q=80",
    };

    return [staticSlide2, staticSlide3, staticSlide1];
  }, []);

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

  const chipCategories = useMemo(() => {
    const hotDeals = { label: "Hot Deals", slug: "hot-deals", iconUrl: null as string | null };
    const rest = categoryItems
      .filter((c) => c.slug !== "hot-deals")
      .map((c) => ({ label: c.label, slug: c.slug, iconUrl: c.iconUrl }));
    return [hotDeals, ...rest];
  }, [categoryItems]);

  const selectedChipSlug = isHome ? "hot-deals" : activeSlug;

  const forYou = useMemo(() => {
    if (featuredCards && featuredCards.length > 0) {
      return featuredCards;
    }
    return forYouFromCards(allCards);
  }, [featuredCards, allCards]);

  const travelCards = useMemo(() => {
    const travelSlugs = ["makemytrip", "booking", "goibibo"];
    const found = allCards.filter((card) => travelSlugs.includes(card.slug));
    return [...found].sort((a, b) => travelSlugs.indexOf(a.slug) - travelSlugs.indexOf(b.slug));
  }, [allCards]);

  const foodCards = useMemo(() => {
    const foodSlugs = ["swiggy", "zomato", "bigbasket"];
    const found = allCards.filter((card) => foodSlugs.includes(card.slug));
    return [...found].sort((a, b) => foodSlugs.indexOf(a.slug) - foodSlugs.indexOf(b.slug));
  }, [allCards]);

  const shoppingCards = useMemo(() => {
    const shoppingSlugs = ["amazon", "flipkart", "ikea"];
    const found = allCards.filter((card) => shoppingSlugs.includes(card.slug));
    return [...found].sort((a, b) => shoppingSlugs.indexOf(a.slug) - shoppingSlugs.indexOf(b.slug));
  }, [allCards]);

  const musicCards = useMemo(() => {
    const musicSlugs = ["spotify", "apple-music", "gaana"];
    const found = allCards.filter((card) => musicSlugs.includes(card.slug));
    return [...found].sort((a, b) => musicSlugs.indexOf(a.slug) - musicSlugs.indexOf(b.slug));
  }, [allCards]);

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
          <div key={sec.id || `banner-${idx}`}>
            <HeroCarousel slides={slides} />
          </div>
        );
      } else if (name === "featured_card") {
        if (forYou.length > 0) {
          list.push(
            <div key={sec.id || `foryou-${idx}`} className="animate-fade-in">
              <ScrollRow title="For You" items={forYou} card="forYou" />
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
                <div key={cat.id} className="animate-fade-in">
                  <ScrollRow
                    title={cat.name}
                    items={cards}
                    card="section"
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
                <div key={targetCategory.id} className="animate-fade-in">
                  <ScrollRow
                    title={targetCategory.name}
                    items={cards}
                    card="section"
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
        <div className="flex flex-col gap-4">
          <div className="mb-6">
            <ShopCategoryCards
              categories={chipCategories}
              selectedSlug={selectedChipSlug}
              onCategoryTap={(slug) => {
                if (slug === "hot-deals") {
                  setActiveSlug(ALL_CATEGORY_SLUG);
                } else {
                  setActiveSlug(slug);
                }
                setSearchQuery("");
              }}
            />
          </div>
           {renderDynamicSections()}
          {travelCards.length > 0 && (
            <div className="animate-fade-in">
              <ScrollRow title="Travel & Hotels" items={travelCards} card="travelHotel" />
            </div>
          )}
          {foodCards.length > 0 && (
            <div className="animate-fade-in">
              <ScrollRow title="Food & Beverages" items={foodCards} card="travelHotel" />
            </div>
          )}
          {shoppingCards.length > 0 && (
            <div className="animate-fade-in">
              <ScrollRow title="Shopping" items={shoppingCards} card="travelHotel" />
            </div>
          )}
          {musicCards.length > 0 && (
            <div className="animate-fade-in">
              <ScrollRow title="Music" items={musicCards} card="travelHotel" />
            </div>
          )}
        </div>
      ) : activeCategory ? (
        <ShopCategoryView category={activeCategory} cards={filtered} />
      ) : null}
    </ShopLayout>
  );
}
