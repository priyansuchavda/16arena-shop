"use client";

import { useMemo, useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ShopLayout } from "./shop-layout";
import { HeroCarousel, type HeroSlide } from "./hero-carousel";
import { ScrollRow } from "./scroll-row";
import { ShopCategoryCards } from "./shop-category-cards";
import { FlashDealsSection } from "./flash-deals-section";
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
  categoryChipsFromApi,
  filterCardsByCategory,
  forYouFromCards,
  withActiveCategory,
} from "@/features/shop/utils/shop-catalog";
import { flattenCategories, apiToCard, categorySlugMap } from "@/features/shop/utils/mappers";
import { shopApi } from "../services/shop-api";

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
  const [searchResults, setSearchResults] = useState<CardModel[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);

  const searchParams = useSearchParams();
  const router = useRouter();
  const qParam = searchParams.get("q");

  useEffect(() => {
    if (qParam !== null) {
      setSearchQuery(qParam);
      if (qParam) {
        setActiveSlug(ALL_CATEGORY_SLUG);
      }
    } else {
      setSearchQuery("");
    }
  }, [qParam]);



  const visibleCategories = useMemo(
    () => withActiveCategory(categoryItems, activeSlug),
    [categoryItems, activeSlug],
  );

  const activeCategory = useMemo(() => {
    const flat = flattenCategories(categories);
    return flat.find((c) => c.slug === activeSlug);
  }, [categories, activeSlug]);

  const filtered = useMemo(
    () => filterCardsByCategory(allCards, activeSlug),
    [allCards, activeSlug],
  );

  const isHome = activeSlug === ALL_CATEGORY_SLUG;

  const heroChipCategories = useMemo(
    () => categoryChipsFromApi(categories),
    [categories],
  );

  const allChipCategories = heroChipCategories;

  const selectedChipSlug = activeSlug;

  const forYou = useMemo(() => {
    if (featuredCards && featuredCards.length > 0) {
      return featuredCards;
    }
    return forYouFromCards(allCards);
  }, [featuredCards, allCards]);

  // Flash-deal banner config comes from the "Deal" mobile section (its `desc`
  // is a JSON blob). Null when the section is absent/hidden → no flash deals.
  const dealConfig = useMemo(() => {
    const deal = sections.find(
      (s) => s.name?.toLowerCase() === "deal" && s.isVisible && s.isActive !== false
    );
    if (!deal?.desc) return null;
    try {
      const parsed = JSON.parse(deal.desc) as Record<string, string>;
      return {
        banner: parsed.desktop_banner || parsed.banner,
        title: parsed.title,
        headline: parsed.headline,
        color: parsed.color,
      };
    } catch {
      return null;
    }
  }, [sections]);

  const slugs = useMemo(() => categorySlugMap(categories), [categories]);

  // Debounced search logic querying the backend API
  useEffect(() => {
    const trimmed = searchQuery.trim();
    if (!trimmed) {
      setSearchResults([]);
      setSearchLoading(false);
      return;
    }

    // Filter in-memory products first as a fast fallback
    const localMatches = allCards.filter(
      (card) =>
        card.brand.toLowerCase().includes(trimmed.toLowerCase()) ||
        (card.name && card.name.toLowerCase().includes(trimmed.toLowerCase())) ||
        (card.sub && card.sub.toLowerCase().includes(trimmed.toLowerCase()))
    );
    setSearchResults(localMatches);

    setSearchLoading(true);
    const delayDebounceFn = setTimeout(async () => {
      try {
        const liveProducts = await shopApi.searchProducts(trimmed);
        const liveCards = liveProducts
          .filter((p) => p.isActive !== false)
          .map((p) => apiToCard(p, slugs));

        // Merge live results with local matches, avoiding duplicates by id
        const merged = [...liveCards];
        const seenIds = new Set(liveCards.map((c) => c.id));
        localMatches.forEach((card) => {
          if (!seenIds.has(card.id)) {
            merged.push(card);
          }
        });

        setSearchResults(merged);
      } catch (err) {
        console.error("Search API error:", err);
      } finally {
        setSearchLoading(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, allCards, slugs]);

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
        // Only render the flash-deal banner when the "Deal" section is on.
        if (dealConfig && forYou.length > 0) {
          list.push(
            <div key={sec.id || `foryou-${idx}`} className="animate-fade-in">
              <FlashDealsSection
                items={forYou}
                title={dealConfig.title}
                ctaLabel={dealConfig.headline}
                bannerUrl={dealConfig.banner}
                ctaColor={dealConfig.color}
                onCtaClick={() => {
                  setActiveSlug(ALL_CATEGORY_SLUG);
                  setSearchQuery("");
                  if (typeof window !== "undefined") {
                    window.history.replaceState(null, "", window.location.pathname);
                  }
                }}
              />
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
        router.push(`/${slug}`);
      }}
      onSelectAll={() => {
        router.push("/");
      }}
      searchQuery={searchQuery}
      onSearchChange={(q) => {
        setSearchQuery(q);
        if (q) {
          setActiveSlug(ALL_CATEGORY_SLUG);
          if (typeof window !== "undefined") {
            const newUrl = `${window.location.pathname}?q=${encodeURIComponent(q)}`;
            window.history.replaceState(null, "", newUrl);
          }
        } else {
          if (typeof window !== "undefined") {
            window.history.replaceState(null, "", window.location.pathname);
          }
        }
      }}
    >
      {searchQuery ? (
        <div className="animate-fade-in relative z-10 pt-6">
          <div className="flex items-center gap-3 mb-6">
            <h2 className="font-heading text-[20px] font-extrabold text-white">
              Search Results for &apos;{searchQuery}&apos;
            </h2>
            {searchLoading && (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white" />
            )}
          </div>
          {searchResults.length > 0 ? (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-x-4 gap-y-8">
              {searchResults.map((card, i) => (
                <div key={`${card.id}-${i}`} className="flex justify-start">
                  <ShopCategorySectionCard product={card} />
                </div>
              ))}
            </div>
          ) : searchLoading ? (
            <div className="text-center py-16 border border-white/5 bg-[#121212]/30 rounded-2xl">
              <p className="text-sm text-[var(--muted)]">Searching for gift cards...</p>
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
              categories={heroChipCategories}
              allCategories={allChipCategories}
              selectedSlug={selectedChipSlug}
              onCategoryTap={(slug) => {
                if (slug === ALL_CATEGORY_SLUG) {
                  router.push("/");
                } else {
                  router.push(`/${slug}`);
                }
              }}
            />
          </div>
           {renderDynamicSections()}
        </div>
      ) : activeCategory ? (
        <ShopCategoryView 
          category={activeCategory} 
          categories={categories}
          popularCards={featuredCards.length > 0 ? featuredCards : allCards.slice(0, 10)}
        />
      ) : null}
    </ShopLayout>
  );
}
