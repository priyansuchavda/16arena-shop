export type CategoryHero = {
  /** Optional wide banner image (falls back to gradient-only). */
  imageUrl?: string;
};

/**
 * SWAG-style mask stack:
 * - Center band (search ↔ Get Started) stays brighter
 * - Left/right edges vignette to void
 * - Bottom fades to solid void at the card seam
 */
export const CATEGORY_HERO_OVERLAY =
  "linear-gradient(180deg, rgba(12,12,12,0.32) 0%, rgba(12,12,12,0.1) 16%, rgba(12,12,12,0.02) 48%, rgba(12,12,12,0.06) 68%, rgba(12,12,12,0.32) 80%, rgba(12,12,12,0.72) 90%, rgba(12,12,12,0.96) 97%, #0c0c0c 100%)";

/** Dissolve at the bottom — ends in solid void at the card seam. */
export const CATEGORY_HERO_BOTTOM_FADE =
  "linear-gradient(180deg, transparent 0%, transparent 45%, rgba(12,12,12,0.18) 68%, rgba(12,12,12,0.58) 82%, rgba(12,12,12,0.92) 93%, #0c0c0c 100%)";

/** Dissolve at the left edge — mirrors the bottom fade curve. */
export const CATEGORY_HERO_LEFT_FADE =
  "linear-gradient(90deg, #0c0c0c 0%, rgba(12,12,12,0.92) 8%, rgba(12,12,12,0.58) 22%, rgba(12,12,12,0.18) 38%, transparent 58%)";

/** Dissolve at the right edge — mirrors the bottom fade curve. */
export const CATEGORY_HERO_RIGHT_FADE =
  "linear-gradient(270deg, #0c0c0c 0%, rgba(12,12,12,0.92) 8%, rgba(12,12,12,0.58) 22%, rgba(12,12,12,0.18) 38%, transparent 58%)";

/** Photo stays visible through the title; fades only near the card tops. */
export const CATEGORY_HERO_IMAGE_MASK =
  "linear-gradient(180deg, #000 0%, #000 68%, rgba(0,0,0,0.96) 78%, rgba(0,0,0,0.72) 86%, rgba(0,0,0,0.38) 93%, transparent 100%)";

/** Per-category hero banners — SWAG-style atmospheric backdrops. */
const HEROES: Record<string, CategoryHero> = {
  gaming: {
    imageUrl:
      "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1800&q=80",
  },
  food: {
    imageUrl:
      "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1800&q=80",
  },
  travel: {
    imageUrl:
      "https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=1800&q=80",
  },
  shopping: {
    imageUrl:
      "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1800&q=80",
  },
  music: {
    imageUrl:
      "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=1800&q=80",
  },
  movies: {
    imageUrl:
      "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1800&q=80",
  },
  entertainment: {
    imageUrl:
      "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1800&q=80",
  },
  "hot-deals": {
    imageUrl:
      "https://images.unsplash.com/photo-1607083206968-1364e05aac28?auto=format&fit=crop&w=1800&q=80",
  },
  wellness: {
    imageUrl:
      "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=1800&q=80",
  },
  sports: {
    imageUrl:
      "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=1800&q=80",
  },
};

export function heroForCategory(slug: string, _accent: string): CategoryHero {
  return HEROES[slug] ?? {};
}

export function categoryPageTitle(label: string, slug: string): string {
  if (slug === "hot-deals") return "Hot Deals";
  if (/\bgift\s*cards?\b/i.test(label)) return label;
  return `${label} Gift Cards`;
}

export function voucherLabel(count: number): string {
  return count === 1 ? "1 voucher" : `${count} vouchers`;
}
