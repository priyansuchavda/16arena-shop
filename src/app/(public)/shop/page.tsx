import { ArenaLogo } from "@/shared/components/arena-logo";
import {
  ShopShell,
  ShopUnavailable,
  shopApi,
  categories as staticCategories,
  productToCard,
  products as staticProducts,
  type HeroSlide,
  type CardModel,
  type CategoryItem,
  type LiveSection,
} from "@/features/shop";
import {
  apiToCard,
  categorySlugMap,
  heroSlidesFromProducts,
  topCategories,
  flattenCategories,
} from "@/features/shop/utils/mappers";
import { sectionsFromCards } from "@/features/shop/utils/shop-catalog";
import type { ApiProduct } from "@/features/shop/types/shop.types";

function staticHeroSlides(): HeroSlide[] {
  const picks = staticProducts.filter((p) =>
    ["bgmi-uc", "swiggy", "spotify", "amazon"].includes(p.slug),
  );
  return picks.map((p) => ({
    id: p.id,
    slug: p.slug,
    eyebrow: "16ARENA TRUSTED STORE",
    title: p.brand,
    subtitle: p.tagline ?? `Get ${p.brand} gift cards with instant delivery & Arena Coins cashback.`,
    cta: "GET NOW!",
    accent: p.accent,
    accent2: p.accent2,
    imageUrl: null as string | null,
  }));
}

function UnavailableShell() {
  return (
    <div className="flex min-h-screen flex-col">
      <div className="flex items-center gap-4 px-5 pt-7">
        <ArenaLogo />
      </div>
      <ShopUnavailable />
    </div>
  );
}

export default async function Home() {
  let shopVisible = true;
  let categoryItems: CategoryItem[] = [];
  let allCards: CardModel[] = [];
  let featuredCards: CardModel[] = [];
  let slides: HeroSlide[] = [];
  
  // Dynamic layout structures
  let layoutSections: any[] = [];
  let categoryProductsMap: Record<string, ApiProduct[]> = {};
  let categoriesData: any[] = [];

  try {
    const [visibility, cats, featuredProds, sections, allProds] = await Promise.all([
      shopApi.checkShopVisibility(),
      shopApi.fetchCategories(),
      shopApi.fetchFeaturedProducts(),
      shopApi.fetchShopSections(),
      shopApi.fetchProducts(undefined, 1, 150).catch(() => [] as ApiProduct[]),
    ]);

    shopVisible = visibility.visible;
    categoriesData = cats;

    if (shopVisible) {
      const activeTopCats = cats.filter((c) => c.parentId === null && c.isActive);
      if (!activeTopCats.length) throw new Error("no categories");

      const flatCats = flattenCategories(cats);
      
      // Group products in-memory to populate category rails
      categoryProductsMap = flatCats.reduce((acc, cat) => {
        acc[cat.id] = allProds.filter((p) => p.categoryId === cat.id);
        return acc;
      }, {} as Record<string, ApiProduct[]>);

      const slugs = categorySlugMap(cats);
      categoryItems = topCategories(cats);

      if (!allProds.length) throw new Error("no products");

      allCards = allProds.filter((p) => p.isActive !== false).map((p) => apiToCard(p, slugs));
      featuredCards = featuredProds.filter((p) => p.isActive !== false).map((p) => apiToCard(p, slugs));
      slides = heroSlidesFromProducts(allProds);
      layoutSections = sections;
    }
  } catch (err) {
    console.error("Error fetching dynamic shop catalog", err);
    // Fallback to static catalog
    categoryItems = staticCategories.map((c) => ({
      label: c.label,
      slug: c.slug,
      color: c.color,
      active: false,
    }));
    allCards = staticProducts.map(productToCard);
    featuredCards = allCards.slice(0, 4);
    slides = staticHeroSlides();
    layoutSections = [
      { id: "s1", name: "shop_banner", priority: 1, isVisible: true, isActive: true },
      { id: "s2", name: "featured_card", priority: 2, isVisible: true, isActive: true },
      ...sectionsFromCards(allCards).map((sec, idx) => ({
        id: `sec-${idx}`,
        name: "category_item_card",
        category: sec.title,
        priority: 3 + idx,
        isVisible: true,
        isActive: true,
      })),
    ];
  }

  if (!shopVisible) {
    return <UnavailableShell />;
  }

  return (
    <ShopShell
      categories={categoriesData}
      categoryItems={categoryItems}
      allCards={allCards}
      featuredCards={featuredCards}
      sections={layoutSections}
      categoryProductsMap={categoryProductsMap}
      slides={slides}
      walletBalance={0}
    />
  );
}
