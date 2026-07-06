import { ArenaLogo } from "@/shared/components/arena-logo";
import {
  ShopShell,
  ShopUnavailable,
  checkShopVisibility,
  fetchCategories,
  fetchFeaturedProducts,
  fetchProducts,
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
} from "@/features/shop/utils/mappers";
import { sectionsFromCards } from "@/features/shop/utils/shop-catalog";

export const dynamic = "force-dynamic";

/** Static display balance until wallet API is wired to the UI. */
const WALLET_DISPLAY_BALANCE = 1000;

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
  let allCards = staticProducts.map(productToCard);
  let featuredCards: CardModel[] = [];
  let categorySections: LiveSection[] = [];
  let slides: HeroSlide[] = staticHeroSlides();
  const walletBalance = WALLET_DISPLAY_BALANCE;

  try {
    const [visibility, cats, featuredProds] = await Promise.all([
      checkShopVisibility(),
      fetchCategories(),
      fetchFeaturedProducts(),
    ]);

    shopVisible = visibility.visible;
    if (shopVisible) {
      const activeTopCats = cats.filter((c) => c.parentId === null && c.isActive);
      if (!activeTopCats.length) throw new Error("no categories");

      const productsPerCategory = await Promise.all(
        activeTopCats.map((cat) => fetchProducts(cat.id))
      );

      const slugs = categorySlugMap(cats);
      categoryItems = topCategories(cats);

      const allProds = productsPerCategory.flat();
      if (!allProds.length) throw new Error("no products");

      allCards = allProds.filter((p) => p.isActive !== false).map((p) => apiToCard(p, slugs));
      featuredCards = featuredProds.filter((p) => p.isActive !== false).map((p) => apiToCard(p, slugs));
      slides = heroSlidesFromProducts(allProds);

      categorySections = activeTopCats
        .map((cat, index) => {
          const cards = productsPerCategory[index]
            .filter((p) => p.isActive !== false)
            .map((p) => apiToCard(p, slugs));
          return {
            title: cat.name,
            items: cards,
          };
        })
        .filter((s) => s.items.length > 0);
    }
  } catch {
    categoryItems = staticCategories.map((c) => ({
      label: c.label,
      slug: c.slug,
      color: c.color,
      active: false,
    }));
    allCards = staticProducts.map(productToCard);
    categorySections = sectionsFromCards(allCards);
  }

  if (!shopVisible) {
    return <UnavailableShell />;
  }

  return (
    <ShopShell
      categories={categoryItems}
      allCards={allCards}
      featuredCards={featuredCards}
      sections={categorySections}
      slides={slides}
      walletBalance={walletBalance}
    />
  );
}
