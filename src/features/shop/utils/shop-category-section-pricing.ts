import { formatCoins, formatInr } from "./checkout.utils";

export type SectionPriceRowInput = {
  price?: number | null;
  maxCoins?: number | null;
  isCoinOnly?: boolean;
};

export type SectionPriceRowMode = "free" | "inr" | "coins" | "hybrid";

export function resolveSectionPriceRowMode(input: SectionPriceRowInput): SectionPriceRowMode {
  const price = input.price ?? 0;
  const maxCoins = input.maxCoins ?? 0;
  const hasPrice = price > 0;
  const hasCoins = maxCoins > 0;

  if (!hasPrice && !hasCoins) return "free";
  if (!hasCoins) return "inr";
  if (!hasPrice || input.isCoinOnly) return "coins";
  return "hybrid";
}

/** Compact coin count for tight card layouts (e.g. 24,750 → 24k). */
export function formatCoinsCompact(value: number): string {
  if (value >= 1_000_000) {
    const millions = value / 1_000_000;
    return Number.isInteger(millions)
      ? `${millions}m`
      : `${parseFloat(millions.toFixed(1))}m`;
  }
  if (value >= 1_000) {
    const thousands = value / 1_000;
    return Number.isInteger(thousands)
      ? `${thousands}k`
      : `${parseFloat(thousands.toFixed(1))}k`;
  }
  return formatCoins(value);
}

export function formatInrWhole(amount: number): string {
  return `₹${Math.round(amount).toLocaleString("en-IN")}`;
}

export type HybridFormatTier = 0 | 1 | 2;

export function formatHybridPriceRow(
  price: number,
  maxCoins: number,
  tier: HybridFormatTier
): { priceText: string; coinsText: string } {
  const priceText = tier >= 1 ? formatInrWhole(price) : formatInr(price);
  const coinsText = tier >= 2 ? formatCoinsCompact(maxCoins) : formatCoins(maxCoins);
  return { priceText, coinsText };
}

export function sectionCardSavingsPercent(
  skuSavings?: number | null,
  productMaxSavings?: number | null,
  productSavings?: number | null
): number | undefined {
  const savings = skuSavings ?? productMaxSavings ?? productSavings;
  if (savings == null || savings <= 0) return undefined;
  return Math.round(savings);
}
