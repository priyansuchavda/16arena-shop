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
  logoUrl: string | null;
  thumbnailImageUrl: string | null;
  cashbackPercent: number | null;
  savingsPercent: number | null;
  maxSavingsPercent: number | null;
  startingPrice: number | null;
  startingOriginalPrice: number | null;
  isFeatured: boolean;
  isActive: boolean;
  wishlistCount24h: number | null;
};

export type ShopConfig = Record<string, unknown>;

export type HubbleSsoTokenResponse = {
  token?: string;
  ssoToken?: string;
  jwt?: string;
  code?: string;
  message?: string;
};

export type ShopVisibility = {
  visible: boolean;
  reason?: string;
};

export type CategoryItem = {
  label: string;
  slug: string;
  color: string;
  active?: boolean;
  count?: number;
  badge?: string | null;
};

export type LiveSection = { title: string; items: CardModel[] };

export type Tone = "hot" | "low" | "new";
export type Tag = { tone: Tone; label: string };
export type CardBadge = { tone: Tone; label: string };

export type CardModel = {
  id: string;
  slug: string;
  brand: string;
  name?: string;
  sub: string;
  accent: string;
  accent2: string;
  imageUrl?: string | null;
  priceStr: string;
  originalStr?: string;
  saveStr?: string;
  savePct?: number;
  cashbackPct?: number;
  coinAmount?: number;
  wishlist?: number;
  rating?: number;
  badge?: CardBadge;
  tagline?: string;
  categorySlug?: string;
};

export type Product = {
  id: string;
  slug: string;
  brand: string;
  /** Category subtitle shown under the brand, e.g. "Food & dining". */
  sub: string;
  /** Gradient start/end for the brand card. */
  accent: string;
  accent2: string;
  tag?: Tag;
  save: string;
  rating: number;
  /** Optional headline used on the larger "For you" promo cards. */
  tagline?: string;
};

export type Denomination = {
  face: number;
  faceStr: string;
  /** Cash portion (50% off). */
  cash: number;
  cashStr: string;
  /** Arena Coins portion. */
  coins: number;
  /** Coins earned back (2%). */
  reward: number;
};

export type Section = { title: string; slugs: string[] };

export type Category = { label: string; slug: string; color: string; active?: boolean };
