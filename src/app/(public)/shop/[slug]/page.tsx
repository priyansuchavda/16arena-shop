import { notFound } from "next/navigation";
import type { Metadata } from "next";
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

    const item = await shopApi.fetchProductDetail(slug);
    if (item) {
      return {
        title: `Buy ${item.brandName || item.name} Gift Cards - 16arenashop`,
        description: item.description || `Purchase ${item.brandName || item.name} digital gift vouchers and gaming top-ups. Instant code delivery with Arena Coins cashback.`,
      };
    }
  } catch {}

  const sample = getProductBySlug(slug);
  if (sample) {
    return {
      title: `Buy ${sample.brand} Gift Cards - 16arenashop`,
      description: sample.description || `Get ${sample.brand} gift cards instantly with digital delivery.`,
    };
  }

  return {
    title: "16arenashop - Gift Cards & Vouchers",
    description: "Buy gift cards, coupons, and gaming top-ups instantly.",
  };
}

export default async function ShopSlugPage({
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
    categoryItems = staticCategories.map((c) => ({
      label: c.label,
      slug: c.slug,
      color: c.color,
      active: false,
    }));
  }

  const activeCategory = categoryItems.find((c) => c.slug === slug);

  if (activeCategory) {
    let allCards: CardModel[] = [];
    const slugs = categorySlugMap(liveCats);

    try {
      const matchingLiveCat = liveCats.find((c) => c.slug === slug);
      if (matchingLiveCat) {
        const liveProducts = await shopApi.fetchProducts(matchingLiveCat.id);
        allCards = liveProducts.filter((p) => p.isActive !== false).map((p) => apiToCard(p, slugs));
      } else {
        allCards = staticProducts.map(productToCard);
      }
    } catch {
      allCards = staticProducts.map(productToCard);
    }

    const filteredCards = filterCardsByCategory(allCards, slug);
    const visibleCategories = withActiveCategory(categoryItems, slug);

    let popularCards: CardModel[] = [];
    if (filteredCards.length === 0) {
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
        popularCards = staticProducts.map(productToCard).slice(0, 8);
      }
    }

    return (
      <ShopLayout
        categories={visibleCategories}
        walletBalance={0}
        categoryMode={true}
      >
        <ShopCategoryView 
          category={activeCategory} 
          cards={filteredCards} 
          popularCards={popularCards} 
        />
      </ShopLayout>
    );
  }

  const sample = getProductBySlug(slug);
  if (sample) {
    const staticJsonLd = {
      "@context": "https://schema.org",
      "@type": "Product",
      "name": sample.brand,
      "description": sample.description || `Get ${sample.brand} gift cards instantly.`,
      "offers": {
        "@type": "AggregateOffer",
        "priceCurrency": "INR",
        "lowPrice": 250,
        "highPrice": 5000,
        "offerCount": 4,
      }
    };

    return (
      <ShopLayout
        categories={categoryItems}
        walletBalance={0}
        hideSidebar={true}
      >
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(staticJsonLd) }}
        />
        <ProductDetail product={sample} related={getRelated(slug).map(productToCard)} />
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

  const dynamicJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": item.brandName || item.name,
    "description": item.description || item.about || "",
    "image": item.logoUrl || item.heroImageUrl || "",
    "offers": {
      "@type": "AggregateOffer",
      "priceCurrency": "INR",
      "lowPrice": item.skus?.[0]?.retailPrice || 0,
      "offerCount": item.skus?.length || 1,
    }
  };

  return (
    <ShopLayout
      categories={categoryItems}
      walletBalance={0}
      hideSidebar={true}
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(dynamicJsonLd) }}
      />
      <LiveProductDetail product={item} related={related} />
    </ShopLayout>
  );
}
