import { Suspense } from "react";
import { ArenaLogo } from "@/shared/components/arena-logo";
import {
  ShopShell,
  ShopUnavailable,
  ShopLoading,
  shopApi,
  type HeroSlide,
  type CardModel,
  type CategoryItem,
  type MobileBanner,
} from "@/features/shop";
import {
  apiToCard,
  categorySlugMap,
  heroSlidesFromProducts,
  topCategories,
  flattenCategories,
} from "@/features/shop/utils/mappers";
import type { ApiProduct } from "@/features/shop/types/shop.types";

function bannersToSlides(banners: MobileBanner[]): HeroSlide[] {
  return banners
    .filter((b) => b.page === "shop" && b.isVisible)
    .sort((a, b) => a.priority - b.priority)
    .map((b) => ({
      id: b.id,
      slug: b.cta ?? "",
      eyebrow: "16ARENA TRUSTED STORE",
      title: b.category,
      subtitle: "",
      cta: "SHOP NOW",
      accent: "#FF973C",
      accent2: "#D35300",
      imageUrl: b.image,
      ctaUrl: b.cta ?? undefined,
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

export async function ShopHomePage() {
  let shopVisible = true;
  let categoryItems: CategoryItem[] = [];
  let allCards: CardModel[] = [];
  let featuredCards: CardModel[] = [];
  let slides: HeroSlide[] = [];

  let layoutSections: Awaited<ReturnType<typeof shopApi.fetchShopSections>> = [];
  let categoryProductsMap: Record<string, ApiProduct[]> = {};
  let categoriesData: Awaited<ReturnType<typeof shopApi.fetchCategories>> = [];

  try {
    const [visibility, cats, featuredProds, sections, allProds, rawBanners] = await Promise.all([
      shopApi.checkShopVisibility(),
      shopApi.fetchCategories(),
      shopApi.fetchFeaturedProducts(),
      shopApi.fetchShopSections(),
      shopApi.fetchProducts(undefined, 1, 150).catch(() => [] as ApiProduct[]),
      shopApi.fetchMobileBanners().catch(() => [] as MobileBanner[]),
    ]);

    const apiBannerSlides = bannersToSlides(rawBanners);

    shopVisible = visibility.visible;
    categoriesData = cats;

    if (shopVisible) {
      const activeTopCats = cats.filter((c) => c.parentId === null && c.isActive);
      if (!activeTopCats.length) throw new Error("no categories");

      const flatCats = flattenCategories(cats);

      const categoryProductEntries = await Promise.all(
        flatCats.map(async (cat) => {
          try {
            const products = await shopApi.fetchProducts(cat.id, 1, 10);
            return [cat.id, products] as const;
          } catch {
            return [cat.id, [] as ApiProduct[]] as const;
          }
        })
      );
      categoryProductsMap = Object.fromEntries(categoryProductEntries);

      const slugs = categorySlugMap(cats);
      categoryItems = topCategories(cats);

      const hasAnyProducts =
        allProds.length > 0 || Object.values(categoryProductsMap).some((arr) => arr.length > 0);
      if (!hasAnyProducts) throw new Error("no products");

      allCards = allProds.filter((p) => p.isActive !== false).map((p) => apiToCard(p, slugs));
      featuredCards = featuredProds
        .filter((p) => p.isActive !== false)
        .map((p) => apiToCard(p, slugs));
      slides = apiBannerSlides.length > 0 ? apiBannerSlides : heroSlidesFromProducts(allProds, slugs);
      layoutSections = sections;
    }
  } catch (err) {
    console.error("Error fetching dynamic shop catalog", err);
    shopVisible = false;
  }

  if (!shopVisible) {
    return <UnavailableShell />;
  }

  return (
    <Suspense fallback={<ShopLoading />}>
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
    </Suspense>
  );
}
