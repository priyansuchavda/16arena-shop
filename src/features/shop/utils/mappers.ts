import type {
  CardModel,
  CategoryItem,
  ApiProduct,
  ApiCategory,
  LiveSection,
  ShopSku,
} from "../types/shop.types";
import { formatInr, formatPercent } from "./checkout.utils";
import { productSavingsPercent } from "./shop-category-section-pricing";

const BRAND_COLORS: Record<string, [string, string]> = {
  spotify: ["#1DB954", "#0c5226"],
  google: ["#4285F4", "#1a4fb0"],
  "riot games": ["#FF4654", "#7a141d"],
  moonton: ["#2A6CF6", "#11317a"],
  krafton: ["#F2A900", "#7a5500"],
  netflix: ["#E50914", "#7a0509"],
  amazon: ["#FF9900", "#94560a"],
  apple: ["#A2AAAD", "#3a3f42"],
  microsoft: ["#00A4EF", "#06517a"],
  steam: ["#1b2838", "#0a121c"],
  garena: ["#EE3124", "#7a140d"],
};

const PALETTE: [string, string][] = [
  ["#FF7A1A", "#7a3408"],
  ["#2874F0", "#123a85"],
  ["#1DB954", "#0c5226"],
  ["#E23744", "#7a141d"],
  ["#7c3aed", "#3a1a78"],
  ["#0ea5e9", "#075985"],
  ["#f59e0b", "#7c5208"],
  ["#ec4899", "#7a1f4d"],
];

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

export function gradientFor(seed: string): { accent: string; accent2: string } {
  const key = (seed || "").toLowerCase().trim();
  const known = BRAND_COLORS[key];
  const pair = known ?? PALETTE[hash(key) % PALETTE.length];
  return { accent: pair[0], accent2: pair[1] };
}

function firstActiveSku(skus: ShopSku[]): ShopSku | undefined {
  const activeSkus = skus
    .filter((s) => s.isActive !== false)
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  return activeSkus.length > 0 ? activeSkus[0] : skus[0];
}

/** Matches Flutter ShopDealSection._captionForProduct. */
export function productDealCaption(product: CardModel): string {
  const featureLabel = product.featureLabel?.trim();
  if (featureLabel) return featureLabel;

  const savings = product.savePct;
  if (savings != null && savings > 0) {
    return `Buy ${product.name || product.brand} at ${formatPercent(savings)}% off`;
  }

  return product.name || product.brand;
}

export function apiToCard(p: ApiProduct, slugByCategoryId?: Map<string, string>): CardModel {
  const g = gradientFor(p.brandName ?? p.name);
  const imageUrl = p.thumbnailImageUrl || p.logoUrl || p.heroImageUrl;
  const save = productSavingsPercent(p.savingsPercent);

  if (p.showSku && p.skus && p.skus.length > 0) {
    const sku = firstActiveSku(p.skus);
    if (!sku) {
      return buildFallbackCard(p, g, imageUrl, save, slugByCategoryId);
    }

    const isCoinOnly = sku.isCoinOnly ?? false;
    const maxCoins = sku.maxCoins ?? 0;
    const price = sku.inrPayableAfterMaxCoins ?? 0;
    const displayLabel = sku.displayLabel || sku.title || sku.label || p.name;

    return {
      id: p.id,
      slug: p.slug,
      brand: p.brandName || p.name,
      name: displayLabel,
      displayLabel,
      showSku: true,
      sub: p.categoryName,
      accent: g.accent,
      accent2: g.accent2,
      imageUrl,
      featureImageUrl: p.featuredImage ?? undefined,
      featureColor: p.featureColor ?? undefined,
      featureLabel: p.featureLabel ?? undefined,
      price: price > 0 ? price : undefined,
      maxCoins: maxCoins > 0 ? maxCoins : undefined,
      isCoinOnly,
      priceStr: price > 0 ? formatInr(price) : "—",
      savePct: save,
      coinAmount: maxCoins > 0 ? maxCoins : undefined,
      cashbackPct: p.cashbackPercent ?? undefined,
      wishlist: p.wishlistCount24h ?? undefined,
      badge: !save && p.isFeatured ? { tone: "new", label: "Featured" } : undefined,
      tagline: p.categoryName,
      categorySlug: slugByCategoryId?.get(p.categoryId),
    };
  }

  return buildFallbackCard(p, g, imageUrl, save, slugByCategoryId);
}

function buildFallbackCard(
  p: ApiProduct,
  g: { accent: string; accent2: string },
  imageUrl: string | null | undefined,
  save: number | undefined,
  slugByCategoryId?: Map<string, string>
): CardModel {
  return {
    id: p.id,
    slug: p.slug,
    brand: p.brandName || p.name,
    name: p.name,
    displayLabel: p.name,
    showSku: false,
    sub: p.categoryName,
    accent: g.accent,
    accent2: g.accent2,
    imageUrl,
    featureImageUrl: p.featuredImage ?? undefined,
    featureColor: p.featureColor ?? undefined,
    featureLabel: p.featureLabel ?? undefined,
    price: undefined,
    maxCoins: undefined,
    isCoinOnly: false,
    priceStr: "—",
    savePct: save,
    coinAmount: undefined,
    cashbackPct: p.cashbackPercent ?? undefined,
    wishlist: p.wishlistCount24h ?? undefined,
    badge: !save && p.isFeatured ? { tone: "new", label: "Featured" } : undefined,
    tagline: p.categoryName,
    categorySlug: slugByCategoryId?.get(p.categoryId),
  };
}

export function categorySlugMap(cats: ApiCategory[]): Map<string, string> {
  return new Map(cats.map((c) => [c.id, c.slug]));
}

export function topCategories(cats: ApiCategory[]): CategoryItem[] {
  return cats
    .filter((c) => c.parentId === null && c.isActive)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((c) => ({
      label: c.name,
      slug: c.slug,
      color: gradientFor(c.name).accent,
      active: false,
      count: c.productCount,
      badge: c.badgeText,
      iconUrl: c.iconUrl,
    }));
}

export function heroSlidesFromProducts(prods: ApiProduct[]): {
  id: string;
  slug: string;
  eyebrow: string;
  title: string;
  subtitle: string;
  cta: string;
  accent: string;
  accent2: string;
  imageUrl?: string | null;
}[] {
  const featured = prods.filter((p) => p.isFeatured && p.isActive !== false);
  const pool = featured.length ? featured : prods.filter((p) => p.isActive !== false);
  return pool.slice(0, 4).map((p) => {
    const g = gradientFor(p.brandName ?? p.name);
    const save = productSavingsPercent(p.savingsPercent) ?? 0;
    return {
      id: p.id,
      slug: p.slug,
      eyebrow: "16ARENA TRUSTED STORE",
      title: p.brandName || p.name,
      subtitle:
        save > 0
          ? `Celebrate with bonus savings & cashback on every pack — up to ${formatPercent(save)}% off!`
          : "Instant digital delivery with Arena Coins cashback on every order.",
      cta: "GET NOW!",
      accent: g.accent,
      accent2: g.accent2,
      imageUrl: p.heroImageUrl,
    };
  });
}

export function mostBought(prods: ApiProduct[]): CardModel[] {
  return [...prods]
    .filter((p) => p.isActive !== false)
    .sort((a, b) => (b.wishlistCount24h ?? 0) - (a.wishlistCount24h ?? 0))
    .slice(0, 12)
    .map((p) => apiToCard(p));
}

export function groupSections(prods: ApiProduct[]): LiveSection[] {
  const map = new Map<string, CardModel[]>();
  for (const p of prods) {
    if (p.isActive === false) continue;
    const arr = map.get(p.categoryName) ?? [];
    arr.push(apiToCard(p));
    map.set(p.categoryName, arr);
  }
  return [...map.entries()]
    .map(([title, items]) => ({ title, items: items.slice(0, 8) }))
    .sort((a, b) => b.items.length - a.items.length);
}

export function flattenCategories(categories: ApiCategory[]): ApiCategory[] {
  const flat: ApiCategory[] = [];
  for (const cat of categories) {
    flat.push(cat);
    if (cat.subCategories && cat.subCategories.length > 0) {
      flat.push(...flattenCategories(cat.subCategories));
    }
  }
  return flat;
}
