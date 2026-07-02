import type { CardModel } from "./products";

// Temporary: point at the LAN shop API. Override with NEXT_PUBLIC_SHOP_API_BASE.
export const SHOP_API_BASE =
  process.env.NEXT_PUBLIC_SHOP_API_BASE ?? "http://192.168.29.71:5006/api/v1";

export type ApiCategory = {
  id: string;
  name: string;
  slug: string;
  iconUrl: string | null;
  parentId: string | null;
  sortOrder: number;
  badgeText: string | null;
  isActive: boolean;
  isFeatured: boolean;
  isHero: boolean;
  productCount: number;
  subCategories?: ApiCategory[];
};

export type ApiProduct = {
  id: string;
  categoryId: string;
  categoryName: string;
  name: string;
  slug: string;
  brandName: string | null;
  heroImageUrl: string | null;
  cashbackPercent: number | null;
  savingsPercent: number | null;
  maxSavingsPercent: number | null;
  startingPrice: number | null;
  startingOriginalPrice: number | null;
  isFeatured: boolean;
  isActive: boolean;
  wishlistCount24h: number | null;
};

async function getData<T>(path: string): Promise<T> {
  const res = await fetch(`${SHOP_API_BASE}${path}`, {
    cache: "no-store",
    signal: AbortSignal.timeout(4000),
  });
  if (!res.ok) throw new Error(`${path} → ${res.status}`);
  const json = (await res.json()) as { data: T };
  return json.data;
}

export function fetchCategories(): Promise<ApiCategory[]> {
  return getData<ApiCategory[]>("/shop/categories");
}

export async function fetchProducts(): Promise<ApiProduct[]> {
  const data = await getData<{ items: ApiProduct[] }>("/shop/products");
  return data.items ?? [];
}

// ---- color derivation (API carries no brand colors) ----

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

// ---- API → view-model mappers ----

export function apiToCard(p: ApiProduct): CardModel {
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
    sub: p.categoryName,
    accent: g.accent,
    accent2: g.accent2,
    imageUrl: p.heroImageUrl,
    priceStr: p.startingPrice != null ? `₹${p.startingPrice}` : "—",
    originalStr: hasOriginal ? `₹${p.startingOriginalPrice}` : undefined,
    savePct: save > 0 ? save : undefined,
    cashbackPct: p.cashbackPercent ?? undefined,
    wishlist: p.wishlistCount24h ?? undefined,
    badge:
      save >= 10
        ? { tone: "hot", label: `${save}% OFF` }
        : p.isFeatured
          ? { tone: "new", label: "Featured" }
          : undefined,
    tagline: p.categoryName,
  };
}

export type CategoryItem = {
  label: string;
  color: string;
  active?: boolean;
  count?: number;
  badge?: string | null;
};

export function topCategories(cats: ApiCategory[]): CategoryItem[] {
  return cats
    .filter((c) => c.parentId === null && c.isActive)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((c, i) => ({
      label: c.name,
      color: gradientFor(c.name).accent,
      active: c.isFeatured || i === 0,
      count: c.productCount,
      badge: c.badgeText,
    }));
}

export type LiveSection = { title: string; items: CardModel[] };

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
