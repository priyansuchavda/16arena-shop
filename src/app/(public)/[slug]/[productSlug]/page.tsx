import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  LiveProductDetail,
  ShopLayout,
  shopApi,
  type CategoryItem,
} from "@/features/shop";
import {
  apiToCard,
  categorySlugMap,
  topCategories,
} from "@/features/shop/utils/mappers";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; productSlug: string }>;
}): Promise<Metadata> {
  const { productSlug } = await params;

  try {
    const item = await shopApi.fetchProductDetail(productSlug);
    if (item) {
      return {
        title: `Buy ${item.brandName || item.name} Gift Cards - 16arenashop`,
        description: item.description || `Purchase ${item.brandName || item.name} digital gift vouchers and gaming top-ups. Instant code delivery with Arena Coins cashback.`,
      };
    }
  } catch {}

  return {
    title: "16arenashop - Gift Cards & Vouchers",
    description: "Buy gift cards, coupons, and gaming top-ups instantly.",
  };
}

export default async function ShopProductSlugPage({
  params,
}: {
  params: Promise<{ slug: string; productSlug: string }>;
}) {
  const { slug, productSlug } = await params;

  let item: any = null;
  let categoryItems: CategoryItem[] = [];
  let related: ReturnType<typeof apiToCard>[] = [];

  try {
    const [liveCats, productDetail] = await Promise.all([
      shopApi.fetchCategories(),
      shopApi.fetchProductDetail(productSlug),
    ]);

    categoryItems = topCategories(liveCats);
    const slugs = categorySlugMap(liveCats);

    if (productDetail) {
      // Validate that the URL category slug matches the product's actual category slug.
      // If it doesn't match, return notFound to prevent duplicate URLs for SEO.
      const actualCategorySlug = slugs.get(productDetail.categoryId);
      if (actualCategorySlug !== slug) {
        notFound();
      }

      item = productDetail;
      const relatedProds = await shopApi.fetchProducts(item.categoryId).catch(() => []);
      related = relatedProds
        .filter((p) => p.slug !== item!.slug)
        .slice(0, 4)
        .map((p) => apiToCard(p, slugs));
    }
  } catch (err) {
    console.error("Failed to load product page data:", err);
  }

  if (item) {
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

  notFound();
}
