import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ProductDetail } from "@/components/product-detail";
import { LiveProductDetail } from "@/components/live-product-detail";
import { getProductBySlug, getRelated, products } from "@/lib/products";
import { apiToCard, fetchProducts } from "@/lib/api";

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

  const sample = getProductBySlug(slug);
  if (sample) {
    return (
      <>
        <SiteHeader />
        <ProductDetail product={sample} related={getRelated(slug)} />
        <SiteFooter />
      </>
    );
  }

  let item: Awaited<ReturnType<typeof fetchProducts>>[number] | undefined;
  let related: ReturnType<typeof apiToCard>[] = [];
  try {
    const prods = await fetchProducts();
    item = prods.find((p) => p.slug === slug);
    if (item) {
      const current = item;
      related = prods
        .filter((p) => p.categoryName === current.categoryName && p.slug !== current.slug)
        .slice(0, 4)
        .map(apiToCard);
    }
  } catch {
    // API unreachable — fall through to 404
  }

  if (!item) notFound();

  return (
    <>
      <SiteHeader />
      <LiveProductDetail product={item} related={related} />
      <SiteFooter />
    </>
  );
}
