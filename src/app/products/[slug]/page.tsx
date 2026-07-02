import { notFound } from "next/navigation";
import { ProductDetail } from "@/components/product-detail";
import { LiveProductDetail } from "@/components/live-product-detail";
import { ShopLayout } from "@/components/shop-layout";
import {
  getProductBySlug,
  getRelated,
  products,
  categories as staticCategories,
} from "@/lib/products";
import {
  apiToCard,
  fetchProducts,
  fetchProductBySlug,
  fetchCategories,
  fetchWalletBalance,
  topCategories,
  categorySlugMap,
  type CategoryItem,
} from "@/lib/api";

// Prerender the sample products; live API slugs render on demand.
export function generateStaticParams() {
  return products.map((p) => ({ slug: p.slug }));
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  let categoryItems: CategoryItem[] = [];
  let walletBalance = 1000;
  let cats: any[] = [];
  try {
    cats = await fetchCategories();
    walletBalance = await fetchWalletBalance().catch(() => 1000);
    categoryItems = topCategories(cats);
  } catch {
    categoryItems = staticCategories.map((c) => ({
      label: c.label,
      slug: c.slug,
      color: c.color,
      active: false,
    }));
  }
  const slugs = categorySlugMap(cats);

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

  let item: Awaited<ReturnType<typeof fetchProductBySlug>> = null;
  let related: ReturnType<typeof apiToCard>[] = [];
  try {
    item = await fetchProductBySlug(slug);
    if (item) {
      const relatedProds = await fetchProducts(item.categoryId).catch(() => []);
      related = relatedProds
        .filter((p) => p.slug !== item!.slug)
        .slice(0, 4)
        .map((p) => apiToCard(p, slugs));
    }
  } catch {
    // API unreachable — fall through to 404
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
