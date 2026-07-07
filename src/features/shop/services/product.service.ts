import {
  ApiProduct,
  Category,
  Section,
  CardModel,
  Denomination,
  Product,
  Tone,
  Tag,
  CardBadge,
  ShopSku,
} from "../types/shop.types";
import { categorySlugFromSub } from "../utils/shop-catalog";
import { resolveMaxCoinCoveragePercent } from "../utils/checkout.utils";


/** Available voucher face values, in ₹. */
export const DENOM_FACES = [500, 1000, 2000, 5000];
/** Index used for the compact price shown on listing cards (₹1000). */
export const CARD_DENOM_INDEX = 1;

export function inr(n: number): string {
  return "₹" + n.toLocaleString("en-IN");
}

export function denominations(): Denomination[] {
  return DENOM_FACES.map((face) => ({
    face,
    faceStr: inr(face),
    cash: Math.round(face / 2),
    cashStr: inr(Math.round(face / 2)),
    coins: face,
    reward: Math.round(face * 0.02),
  }));
}

export const TONE_STYLES: Record<string, { bg: string; fg: string }> = {
  hot: { bg: "rgba(37,194,110,.16)", fg: "#46e08a" },
  low: { bg: "rgba(255,90,95,.16)", fg: "#ff8589" },
  new: { bg: "rgba(255,138,26,.16)", fg: "#ffb23e" },
};

/** Convert a #hex color to an rgba() string — used for the card glow. */
export function rgba(hex: string, a: number): string {
  let h = hex.replace("#", "");
  if (h.length === 3) {
    h = h
      .split("")
      .map((c) => c + c)
      .join("");
  }
  const n = parseInt(h, 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}

const SAVE_500 = "Save up to ₹500";

export const products: Product[] = [
  // Game top-ups
  { id: "bgmi", slug: "bgmi-uc", brand: "BGMI UC", sub: "In-game top-up", accent: "#1e3a8a", accent2: "#0a1838", tag: { tone: "new", label: "Save 18%" }, save: "Save 18%", rating: 4.9 },
  { id: "freefire", slug: "free-fire", brand: "Free Fire", sub: "Diamonds top-up", accent: "#7c2d12", accent2: "#3a1407", tag: { tone: "hot", label: "Save 14%" }, save: "Save 14%", rating: 4.8 },
  { id: "valorant", slug: "valorant", brand: "Valorant", sub: "VP top-up", accent: "#7f1d1d", accent2: "#3a0d0d", tag: { tone: "new", label: "Save 12%" }, save: "Save 12%", rating: 4.7 },
  { id: "codm", slug: "call-of-duty", brand: "Call of Duty", sub: "CP top-up", accent: "#0f766e", accent2: "#06302c", tag: { tone: "hot", label: "Save 15%" }, save: "Save 15%", rating: 4.8 },

  // Travel
  { id: "makemytrip", slug: "makemytrip", brand: "MakeMyTrip", sub: "Travel & hotels", accent: "#E0102B", accent2: "#760816", tag: { tone: "hot", label: "50% Off" }, save: SAVE_500, rating: 4.7 },
  { id: "goibibo", slug: "goibibo", brand: "Goibibo", sub: "Travel & hotels", accent: "#EB5424", accent2: "#7d2810", tag: { tone: "low", label: "Only 2 left" }, save: SAVE_500, rating: 4.6 },
  { id: "booking", slug: "booking", brand: "Booking.com", sub: "Hotels", accent: "#003580", accent2: "#001c44", tag: { tone: "new", label: "New" }, save: SAVE_500, rating: 4.8 },
  { id: "airbnb", slug: "airbnb", brand: "Airbnb", sub: "Stays", accent: "#FF5A5F", accent2: "#992c2f", tag: { tone: "hot", label: "50% Off" }, save: SAVE_500, rating: 4.7 },

  // Food
  { id: "swiggy", slug: "swiggy", brand: "Swiggy", sub: "Food & dining", accent: "#FC8019", accent2: "#a8460a", tag: { tone: "hot", label: "50% Off" }, save: SAVE_500, rating: 4.8, tagline: "Swiggy gift card at 50% off" },
  { id: "zomato", slug: "zomato", brand: "Zomato", sub: "Food & dining", accent: "#E23744", accent2: "#7a141d", tag: { tone: "low", label: "Only 2 left" }, save: SAVE_500, rating: 4.7 },
  { id: "bigbasket", slug: "bigbasket", brand: "BigBasket", sub: "Groceries", accent: "#84C225", accent2: "#3f5e10", tag: { tone: "hot", label: "50% Off" }, save: SAVE_500, rating: 4.6, tagline: "BigBasket vouchers, half price" },
  { id: "dominos", slug: "dominos", brand: "Domino's", sub: "Food & dining", accent: "#0B6CB8", accent2: "#063a63", tag: { tone: "new", label: "New" }, save: "Save up to ₹400", rating: 4.5 },

  // Shopping
  { id: "amazon", slug: "amazon", brand: "Amazon", sub: "Shopping", accent: "#FF9900", accent2: "#94560a", tag: { tone: "hot", label: "50% Off" }, save: SAVE_500, rating: 4.9, tagline: "Amazon Pay at 50% off" },
  { id: "flipkart", slug: "flipkart", brand: "Flipkart", sub: "Shopping", accent: "#2874F0", accent2: "#123a85", tag: { tone: "low", label: "Only 2 left" }, save: SAVE_500, rating: 4.8 },
  { id: "myntra", slug: "myntra", brand: "Myntra", sub: "Fashion", accent: "#E72744", accent2: "#7a1424", tag: { tone: "new", label: "New" }, save: "Save up to ₹450", rating: 4.6 },
  { id: "ikea", slug: "ikea", brand: "IKEA", sub: "Home & living", accent: "#0058A3", accent2: "#02315d", tag: { tone: "hot", label: "50% Off" }, save: SAVE_500, rating: 4.5 },

  // Music & streaming
  { id: "spotify", slug: "spotify", brand: "Spotify", sub: "Music streaming", accent: "#1DB954", accent2: "#0c5226", tag: { tone: "hot", label: "50% Off" }, save: SAVE_500, rating: 4.9, tagline: "Spotify Premium at 50% off" },
  { id: "apple-music", slug: "apple-music", brand: "Apple Music", sub: "Music streaming", accent: "#FA243C", accent2: "#7d101f", tag: { tone: "low", label: "Only 2 left" }, save: SAVE_500, rating: 4.8 },
  { id: "youtube-premium", slug: "youtube-premium", brand: "YouTube Premium", sub: "Streaming", accent: "#FF0033", accent2: "#80011a", tag: { tone: "new", label: "New" }, save: "Save up to ₹450", rating: 4.7 },
  { id: "gaana", slug: "gaana", brand: "Gaana", sub: "Music streaming", accent: "#E72C30", accent2: "#7a151a", tag: { tone: "hot", label: "50% Off" }, save: "Save up to ₹400", rating: 4.4 },
];

const bySlug = new Map(products.map((p) => [p.slug, p]));

export function getProductBySlug(slug: string): Product | undefined {
  return bySlug.get(slug);
}

export const sections: Section[] = [
  { title: "Top deals", slugs: ["bgmi-uc", "free-fire", "valorant", "call-of-duty"] },
  { title: "Travel & hotels", slugs: ["makemytrip", "goibibo", "booking", "airbnb"] },
  { title: "Food & beverages", slugs: ["swiggy", "zomato", "bigbasket", "dominos"] },
  { title: "Shopping", slugs: ["amazon", "flipkart", "myntra", "ikea"] },
  { title: "Music & streaming", slugs: ["spotify", "apple-music", "youtube-premium", "gaana"] },
];

export function sectionProducts(section: Section): Product[] {
  return section.slugs.map((s) => bySlug.get(s)!).filter(Boolean);
}

export const forYouSlugs = ["swiggy", "bigbasket", "spotify", "amazon"];

export function getForYou(): Product[] {
  return forYouSlugs.map((s) => bySlug.get(s)!).filter(Boolean);
}

export function getRelated(slug: string): Product[] {
  return ["zomato", "amazon", "spotify", "makemytrip"]
    .filter((s) => s !== slug)
    .map((s) => bySlug.get(s)!)
    .filter(Boolean)
    .slice(0, 4);
}

export function productToCard(p: Product): CardModel {
  const d = denominations()[CARD_DENOM_INDEX];
  return {
    id: p.id,
    slug: p.slug,
    brand: p.brand,
    name: p.brand,
    sub: p.sub,
    accent: p.accent,
    accent2: p.accent2,
    priceStr: d.cashStr,
    originalStr: d.faceStr,
    coinAmount: d.coins,
    saveStr: p.save,
    cashbackPct: 2,
    rating: p.rating,
    badge: p.tag,
    tagline: p.tagline,
    categorySlug: categorySlugFromSub(p.sub),
  };
}

export const tickerItems: string[] = [
  "ARYAN_OP claimed Spotify · 3-month",
  "S4KSHII topped up 5,000 UC",
  "GHOST.exe redeemed Amazon ₹2,000",
  "n0vaPRIME earned +120 ◎",
  "kraken_yt claimed Swiggy ₹500",
  "VYP3R topped up Free Fire 2,200 💎",
  "miraTHEGOAT redeemed Netflix · 3-month",
  "z3nith claimed BigBasket ₹1,000",
];

export const categories: Category[] = [
  { label: "Hot Deals", slug: "hot-deals", color: "#FF7A1A", active: true },
  { label: "Gaming", slug: "gaming", color: "#a78bfa" },
  { label: "Movies", slug: "movies", color: "#fb7185" },
  { label: "Music", slug: "music", color: "#f472d0" },
  { label: "Shopping", slug: "shopping", color: "#34d399" },
  { label: "Food", slug: "food", color: "#fbbf24" },
  { label: "Travel", slug: "travel", color: "#38bdf8" },
];

export function splitFixedSkus(product: { skus?: ShopSku[] }): ShopSku[] {
  if (!product?.skus) return [];
  return product.skus
    .filter(
      (s) =>
        !s.isDynamicDenomination &&
        s.stockStatus !== "out_of_stock" &&
        s.isActive !== false
    )
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
}

export function resolveFlexibleSku(product: { skus?: ShopSku[] }): ShopSku | null {
  if (!product?.skus) return null;
  return (
    product.skus.find((s) => s.isDynamicDenomination && s.isActive !== false) ?? null
  );
}

export function isFlexibleSkuSelection(sku: any | null): boolean {
  return sku?.isDynamicDenomination === true;
}

export function resolveAmountRestrictions(product: any): any | null {
  const giftRestrictions = product.giftCardInfo?.amountRestrictions;
  if (giftRestrictions && (giftRestrictions.maxVoucherAmount > 0 || giftRestrictions.minVoucherAmount > 0)) {
    return giftRestrictions;
  }
  return product.amountRestrictions || null;
}

export function resolveSkuAmountRestrictions(product: any, sku: any): any | null {
  if (sku.isDynamicDenomination) {
    const min = sku.minFaceValue;
    const max = sku.maxFaceValue;
    if (min !== undefined && max !== undefined && max > 0) {
      return {
        minVoucherAmount: min,
        maxVoucherAmount: max,
      };
    }
    if (sku.amountRestrictions) return sku.amountRestrictions;
  }
  return resolveAmountRestrictions(product);
}

export function computeOptimalCoinsToRedeem({
  rules,
  coinsBalance,
  subtotal,
  paymentRules,
  sku,
}: {
  rules: { coinToInrRate: number; maxCoveragePercent: number };
  coinsBalance: number;
  subtotal: number;
  paymentRules?: any;
  sku?: any;
}): number {
  if (sku && !sku.allowCoinRedemption && !sku.isCoinOnly) {
    return 0;
  }

  if (paymentRules) {
    if (paymentRules.isCoinOnly) {
      return Math.min(coinsBalance, paymentRules.maxCoinsAllowedEstimate);
    }
    if (!paymentRules.allowCoinRedemption) return 0;
    return Math.min(coinsBalance, paymentRules.maxCoinsAllowedEstimate);
  }

  const maxCoverage = resolveMaxCoinCoveragePercent({
    sku,
    productCoinRules: rules,
    paymentRules,
  });
  if (maxCoverage == null || maxCoverage <= 0) return 0;
  const coinToInrRate = rules?.coinToInrRate ?? 0.01;
  const maxAllowedValue = subtotal * (maxCoverage / 100.0);
  const maxCoinsNeeded = Math.floor(maxAllowedValue / coinToInrRate);
  return Math.min(coinsBalance, maxCoinsNeeded);
}

export function shouldShowCoinEditor({
  paymentRules,
  sku,
}: {
  paymentRules?: any;
  sku?: any;
}): boolean {
  if (sku?.isDynamicDenomination) {
    if (!paymentRules) return true;
    if (paymentRules.isCoinOnly) return true;
    return paymentRules.allowCoinRedemption;
  }
  if (paymentRules?.isCoinOnly) return true;
  if (paymentRules) return paymentRules.allowCoinRedemption;
  return sku?.allowCoinRedemption ?? true;
}

export function computeFlexibleSubtotal(product: any, sku: any, amount: number): number {
  if (!sku || !sku.isDynamicDenomination) return sku?.retailPrice || sku?.price || 0;
  const restrictions = resolveSkuAmountRestrictions(product, sku);
  const minAmount = restrictions?.minVoucherAmount ?? 100;
  
  let unitRate = 1;
  if (minAmount > 0) {
    if (sku.perUnitPrice !== undefined && sku.perUnitPrice > 0) {
      unitRate = sku.perUnitPrice / minAmount;
    } else if (sku.price !== undefined && sku.price > 0) {
      unitRate = sku.price / minAmount;
    } else if (sku.retailPrice !== undefined && sku.retailPrice > 0) {
      unitRate = sku.retailPrice / minAmount;
    }
  }
  return amount * unitRate;
}


