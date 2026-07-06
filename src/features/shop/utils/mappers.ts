import type {
  CardModel,
  CategoryItem,
  ApiProduct,
  ApiCategory,
  LiveSection,
} from "../types/shop.types";

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

export function apiToCard(p: ApiProduct, slugByCategoryId?: Map<string, string>): CardModel {
  const g = gradientFor(p.brandName ?? p.name);
  const save = Math.round(p.savingsPercent ?? p.maxSavingsPercent ?? 0);
  const hasOriginal =
    p.startingOriginalPrice != null &&
    p.startingPrice != null &&
    p.startingOriginalPrice > p.startingPrice;
  return {
    id: p.id,
    slug: p.slug,
    brand: p.brandName || p.name,
    name: p.name,
    sub: p.categoryName,
    accent: g.accent,
    accent2: g.accent2,
    imageUrl: p.logoUrl || p.heroImageUrl,
    priceStr: p.startingPrice != null ? `₹${p.startingPrice}` : "—",
    originalStr: hasOriginal ? `₹${p.startingOriginalPrice}` : undefined,
    savePct: save > 0 ? save : undefined,
    coinAmount:
      p.startingOriginalPrice != null
        ? Math.round(p.startingOriginalPrice)
        : p.startingPrice != null
          ? Math.round(p.startingPrice * 2)
          : undefined,
    cashbackPct: p.cashbackPercent ?? undefined,
    wishlist: p.wishlistCount24h ?? undefined,
    badge:
      save >= 10
        ? { tone: "hot", label: `${save}% OFF` }
        : p.isFeatured
          ? { tone: "new", label: "Featured" }
          : undefined,
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
    const save = Math.round(p.savingsPercent ?? p.maxSavingsPercent ?? 0);
    return {
      id: p.id,
      slug: p.slug,
      eyebrow: "16ARENA TRUSTED STORE",
      title: p.brandName || p.name,
      subtitle:
        save > 0
          ? `Celebrate with bonus savings & cashback on every pack — up to ${save}% off!`
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
