import type { HeroSlide } from "../components/hero-carousel";
import type { CategoryItem, LiveSection, CardModel } from "../types/shop.types";

export const ALL_CATEGORY_SLUG = "__all__";

export type CategoryChip = {
  label: string;
  slug: string;
  iconUrl?: string | null;
};

/** Top-level active categories for the chip strip — API order via sortOrder. */
export function categoryChipsFromApi(
  categories: import("../types/shop.types").ApiCategory[]
): CategoryChip[] {
  return categories
    .filter((c) => c.parentId === null && c.isActive)
    .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name))
    .map((c) => ({
      label: c.name,
      slug: c.slug,
      iconUrl: c.iconUrl,
    }));
}

export function categorySlugFromSub(sub: string): string {
  const s = sub.toLowerCase();
  if (s.includes("game") || s.includes("top-up") || s.includes("diamond")) return "gaming";
  if (s.includes("travel") || s.includes("hotel")) return "travel";
  if (s.includes("food") || s.includes("grocer") || s.includes("dining")) return "food";
  if (s.includes("shopping") || s.includes("fashion") || s.includes("home")) return "shopping";
  if (s.includes("music") || s.includes("streaming")) return "music";
  if (s.includes("movie") || s.includes("entertainment")) return "movies";
  return "other";
}

export function filterCardsByCategory(cards: CardModel[], slug: string | null): CardModel[] {
  if (!slug || slug === ALL_CATEGORY_SLUG) return cards;
  if (slug === "hot-deals") {
    return cards.filter((c) => (c.savePct ?? 0) >= 10 || c.badge?.tone === "hot");
  }
  return cards.filter((c) => c.categorySlug === slug);
}

export function forYouFromCards(cards: CardModel[]): CardModel[] {
  const featured = cards.filter(
    (c) => c.badge?.label === "Featured" || c.badge?.tone === "new" || c.badge?.tone === "hot",
  );
  const pool = featured.length >= 4 ? featured : cards;
  return pool.slice(0, 12);
}

export function mostBoughtFromCards(cards: CardModel[]): CardModel[] {
  return [...cards]
    .sort((a, b) => (b.wishlist ?? b.rating ?? 0) - (a.wishlist ?? a.rating ?? 0))
    .slice(0, 12);
}

export function sectionsFromCards(cards: CardModel[]): LiveSection[] {
  const map = new Map<string, CardModel[]>();
  for (const c of cards) {
    const arr = map.get(c.sub) ?? [];
    arr.push(c);
    map.set(c.sub, arr);
  }
  return [...map.entries()]
    .map(([title, items]) => ({ title, items: items.slice(0, 8) }))
    .sort((a, b) => b.items.length - a.items.length);
}

export function filterSlides(slides: HeroSlide[], cards: CardModel[]): HeroSlide[] {
  if (!cards.length) return slides;
  const slugs = new Set(cards.map((c) => c.slug));
  const filtered = slides.filter((s) => slugs.has(s.slug));
  return filtered.length > 0 ? filtered : slides.slice(0, Math.min(4, slides.length));
}

export function withActiveCategory(categories: CategoryItem[], activeSlug: string | null): CategoryItem[] {
  return categories.map((c) => ({
    ...c,
    active: activeSlug === ALL_CATEGORY_SLUG ? false : c.slug === activeSlug,
  }));
}
