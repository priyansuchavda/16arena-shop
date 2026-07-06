import { notFound } from "next/navigation";
import {
  ProductDetail,
  LiveProductDetail,
  ShopCategoryView,
  ShopLayout,
  getProductBySlug,
  getRelated,
  products as staticProducts,
  categories as staticCategories,
  productToCard,
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
  filterCardsByCategory,
  withActiveCategory,
} from "@/features/shop/utils/shop-catalog";

export const dynamic = "force-dynamic";

export default async function ShopSlugPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  // 1. Fetch categories and common layout data
  let categoryItems: CategoryItem[] = [];
  let walletBalance = 1000;
  let liveCats: ApiCategory[] = [];

  try {
    liveCats = await shopApi.fetchCategories();
    walletBalance = await shopApi.fetchWalletBalance().catch(() => 1000);
    categoryItems = topCategories(liveCats);
  } catch {
    categoryItems = staticCategories.map((c) => ({
      label: c.label,
      slug: c.slug,
      color: c.color,
      active: false,
    }));
  }

  // Check if it's a category slug
  const activeCategory = categoryItems.find((c) => c.slug === slug);

  if (activeCategory) {
    // ---- CATEGORY VIEW DISPATCH ----
    let allCards: CardModel[] = [];
    const slugs = categorySlugMap(liveCats);

    try {
      // Find the corresponding live category ID
      const matchingLiveCat = liveCats.find((c) => c.slug === slug);
      if (matchingLiveCat) {
        const liveProducts = await shopApi.fetchProducts(matchingLiveCat.id);
        allCards = liveProducts.filter((p) => p.isActive !== false).map((p) => apiToCard(p, slugs));
      } else {
        // Fall back to static cards
        allCards = staticProducts.map(productToCard);
      }
    } catch {
      allCards = staticProducts.map(productToCard);
    }

    const filteredCards = filterCardsByCategory(allCards, slug);
    const visibleCategories = withActiveCategory(categoryItems, slug);

    return (
      <ShopLayout
        categories={visibleCategories}
        walletBalance={walletBalance}
        categoryMode={true}
      >
        <ShopCategoryView category={activeCategory} cards={filteredCards} />
      </ShopLayout>
    );
  }

  // ---- PRODUCT DETAIL VIEW DISPATCH ----
  const sample = getProductBySlug(slug);
  if (sample) {
    return (
      <ShopLayout
        categories={categoryItems}
        walletBalance={walletBalance}
        hideSidebar={true}
      >
        <ProductDetail product={sample} related={getRelated(slug)} />
      </ShopLayout>
    );
  }

  let item: any = null;
  let related: ReturnType<typeof apiToCard>[] = [];
  const slugs = categorySlugMap(liveCats);

  try {
    item = await shopApi.fetchProductDetail(slug);
    if (item) {
      const relatedProds = await shopApi.fetchProducts(item.categoryId).catch(() => []);
      related = relatedProds
        .filter((p) => p.slug !== item!.slug)
        .slice(0, 4)
        .map((p) => apiToCard(p, slugs));
    }
  } catch {
    // API unreachable
  }

  if (!item) notFound();

  return (
    <ShopLayout
      categories={categoryItems}
      walletBalance={walletBalance}
      hideSidebar={true}
    >
      <LiveProductDetail product={item} related={related} />
    </ShopLayout>
  );
}
