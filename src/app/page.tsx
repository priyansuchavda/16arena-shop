import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { LiveTicker } from "@/components/live-ticker";
import { ShopStatus } from "@/components/shop-status";
import { Hero } from "@/components/hero";
import { CategoryRow } from "@/components/category-row";
import { PromoCard } from "@/components/promo-card";
import { ProductSection } from "@/components/product-section";
import {
  apiToCard,
  fetchCategories,
  fetchProducts,
  groupSections,
  topCategories,
  type CategoryItem,
  type LiveSection,
} from "@/lib/api";
import {
  categories as staticCategories,
  getForYou,
  productToCard,
  sections as staticSections,
  sectionProducts,
  type CardModel,
} from "@/lib/products";

// Always render against the live API for this temporary integration.
export const dynamic = "force-dynamic";

export default async function Home() {
  let live = true;
  let categoryItems: CategoryItem[];
  let promoItems: CardModel[];
  let liveSections: LiveSection[];

  try {
    const [cats, prods] = await Promise.all([fetchCategories(), fetchProducts()]);
    if (!prods.length) throw new Error("no products");
    categoryItems = topCategories(cats);
    const featured = prods.filter((p) => p.isFeatured);
    promoItems = (featured.length >= 4 ? featured : prods).slice(0, 4).map(apiToCard);
    liveSections = groupSections(prods);
  } catch {
    live = false;
    categoryItems = staticCategories.map((c) => ({
      label: c.label,
      color: c.color,
      active: c.active,
    }));
    promoItems = getForYou().map(productToCard);
    liveSections = staticSections.map((s) => ({
      title: s.title,
      items: sectionProducts(s).map(productToCard),
    }));
  }

  return (
    <>
      <SiteHeader />
      <LiveTicker />
      <main className="mx-auto w-full max-w-[1240px] flex-1 px-6 pb-20 pt-7">
        <ShopStatus live={live} />
        <Hero />
        <CategoryRow items={categoryItems} />

        <section className="mt-14">
          <div className="mb-5">
            <div className="eyebrow flex items-center gap-2">
              <span className="text-[var(--flame)]">▌</span>
              Featured
            </div>
            <h2 className="mt-2 text-[24px] font-extrabold tracking-[-0.01em] text-white">For you</h2>
          </div>
          <div className="grid grid-cols-1 gap-[18px] sm:grid-cols-2 lg:grid-cols-4">
            {promoItems.map((p) => (
              <PromoCard key={p.id} product={p} />
            ))}
          </div>
        </section>

        {liveSections.map((s, i) => (
          <ProductSection
            key={s.title}
            title={s.title}
            items={s.items}
            id={i === 0 ? "top-deals" : undefined}
          />
        ))}
      </main>
      <SiteFooter />
    </>
  );
}
