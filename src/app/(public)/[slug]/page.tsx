import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  ShopCategoryView,
  ShopLayout,
  shopApi,
  type CategoryItem,
  type CardModel,
  type ApiCategory,
} from "@/features/shop";
import {
  apiToCard,
  categorySlugMap,
  topCategories,
} from "@/features/shop/utils/mappers";
import {
  withActiveCategory,
} from "@/features/shop/utils/shop-catalog";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;

  try {
    const liveCats = await shopApi.fetchCategories();
    const activeCategory = liveCats.find((c) => c.slug === slug);
    if (activeCategory) {
      return {
        title: `Buy ${activeCategory.name} Gift Cards & Vouchers | 16arenashop`,
        description: `Get instant digital delivery on ${activeCategory.name} gift cards, codes, and vouchers. Earn Arena Coins cashback on every purchase!`,
      };
    }
  } catch {}

  return {
    title: "16arenashop - Gift Cards & Vouchers",
    description: "Buy gift cards, coupons, and gaming top-ups instantly.",
  };
}

export default async function ShopCategorySlugPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  let categoryItems: CategoryItem[] = [];
  let liveCats: ApiCategory[] = [];

  try {
    liveCats = await shopApi.fetchCategories();
    categoryItems = topCategories(liveCats);
  } catch {
    categoryItems = [];
  }

  const activeCategory = categoryItems.find((c) => c.slug === slug);

  if (activeCategory) {
    const matchingLiveCat = liveCats.find((c) => c.slug === slug) ?? ({
      id: activeCategory.slug,
      name: activeCategory.label,
      slug: activeCategory.slug,
      iconUrl: activeCategory.iconUrl ?? null,
      parentId: null,
      sortOrder: 0,
      badgeText: activeCategory.badge ?? null,
      isActive: true,
      isFeatured: false,
      isHero: false,
      productCount: activeCategory.count ?? 0,
      subCategories: []
    } as ApiCategory);

    const visibleCategories = withActiveCategory(categoryItems, slug);
    const slugs = categorySlugMap(liveCats);

    let popularCards: CardModel[] = [];
    try {
      const featuredProducts = await shopApi.fetchFeaturedProducts();
      popularCards = featuredProducts
        .filter((p) => p.isActive !== false)
        .map((p) => apiToCard(p, slugs));

      if (popularCards.length === 0) {
        const allProducts = await shopApi.fetchProducts(undefined, 1, 30).catch(() => []);
        popularCards = allProducts
          .filter((p) => p.isActive !== false)
          .map((p) => apiToCard(p, slugs))
          .slice(0, 10);
      }
    } catch {
      popularCards = [];
    }

    return (
      <ShopLayout
        categories={visibleCategories}
        walletBalance={0}
        categoryMode={true}
      >
        <ShopCategoryView 
          category={matchingLiveCat} 
          categories={liveCats}
          popularCards={popularCards} 
        />
      </ShopLayout>
    );
  }

  notFound();
}
