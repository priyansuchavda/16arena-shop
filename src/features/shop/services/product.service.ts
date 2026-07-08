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


