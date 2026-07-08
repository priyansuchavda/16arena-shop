"use client";

import { useState, useEffect } from "react";
import { ApiCategory, CardModel } from "@/features/shop/types/shop.types";
import { categoryPageTitle, heroForCategory, voucherLabel } from "@/features/shop/utils/category-heroes";
import { CategoryHeroBackdrop } from "./category-hero-backdrop";
import { ShopCategorySectionCard } from "./shop-category-section-card";
import { ScrollRow } from "./scroll-row";
import { Ticket } from "lucide-react";
import Link from "next/link";
import { shopApi } from "../services/shop-api";
import { apiToCard, categorySlugMap, gradientFor } from "@/features/shop/utils/mappers";

type ShopCategoryViewProps = {
  category: ApiCategory;
  categories: ApiCategory[];
  popularCards?: CardModel[];
};

export function ShopCategoryView({ category, categories, popularCards = [] }: ShopCategoryViewProps) {
  const accentColor = gradientFor(category.name).accent;
  const hero = heroForCategory(category.slug, accentColor);
  const title = categoryPageTitle(category.name, category.slug);

  const [products, setProducts] = useState<CardModel[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      try {
        const slugs = categorySlugMap(categories);
        const res = await shopApi.fetchProductsPaginated(category.id, undefined, 1, 20);
        if (!active) return;
        setProducts(res.items.map((p) => apiToCard(p, slugs)));
        setPage(1);
        setTotalPages(res.totalPages);
      } catch (err) {
        console.error("Failed to load products for category:", err);
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, [category.id, categories]);

  const loadMore = async () => {
    if (loadingMore || page >= totalPages) return;
    setLoadingMore(true);
    try {
      const nextPage = page + 1;
      const slugs = categorySlugMap(categories);
      const res = await shopApi.fetchProductsPaginated(category.id, undefined, nextPage, 20);
      setProducts((prev) => [...prev, ...res.items.map((p) => apiToCard(p, slugs))]);
      setPage(nextPage);
      setTotalPages(res.totalPages);
    } catch (err) {
      console.error("Failed to load more products for category:", err);
    } finally {
      setLoadingMore(false);
    }
  };

  const count = products.length;

  return (
    <section className="relative w-full bg-[var(--void)]">
      {/* Hero zone — full main-column width, image rises behind the top bar */}
      <div className="relative">
        <CategoryHeroBackdrop hero={hero} accent={accentColor} />

        <div className="px-5 lg:px-10">
          <div className="shop-content-width relative z-10 pt-8 sm:pt-10 lg:pt-14">
            <h1 className="font-heading text-[28px] font-bold leading-tight tracking-tight text-white sm:text-[34px]">
              {title}
            </h1>
            <p className="mt-1.5 text-sm text-white/70">
              {loading ? "Loading vouchers..." : voucherLabel(count)}
            </p>
          </div>
        </div>

        {/* Image continues below the text; fade runs through this gap to the cards */}
        <div className="h-20 sm:h-24 lg:h-28" aria-hidden />
      </div>

      {/* Cards — solid void; image fade completes at the seam above */}
      <div className="relative z-10 bg-[var(--void)] px-5 pb-16 lg:px-10">
        {loading ? (
          <div className="shop-content-width grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-x-4 gap-y-8 animate-pulse">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-64 w-full rounded-2xl bg-white/5 border border-white/5" />
            ))}
          </div>
        ) : products.length > 0 ? (
          <div className="shop-content-width">
            <div className="grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-x-4 gap-y-8">
              {products.map((card, i) => (
                <div key={`${card.id}-${i}`} className="flex justify-start">
                  <ShopCategorySectionCard product={card} />
                </div>
              ))}
            </div>

            {page < totalPages && (
              <div className="mt-12 flex justify-center">
                <button
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="inline-flex h-[42px] items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[var(--flame)] to-[var(--flame-deep)] px-8 text-xs font-bold text-black shadow-[0_8px_16px_-6px_rgba(254,131,33,0.3)] transition hover:brightness-110 active:scale-[0.98] disabled:opacity-50"
                >
                  {loadingMore ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-black/20 border-t-black" />
                      Loading...
                    </>
                  ) : (
                    "Load More Vouchers"
                  )}
                </button>
              </div>
            )}
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
                We're currently updating our stock for <strong className="text-white">{category.name}</strong>. Check back shortly or browse other active vouchers!
              </p>

              <Link
                href="/"
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
