import type {
  ShopProductDetail,
  ShopSku,
  SkuPaymentRules,
  ShopCoinRules,
} from "../types/shop.types";

function readNumber(value: unknown, fallback = 0): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = parseFloat(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  return fallback;
}

function readBool(value: unknown, fallback = false): boolean {
  if (typeof value === "boolean") return value;
  if (value === "true") return true;
  if (value === "false") return false;
  return fallback;
}

function mapPaymentRules(raw: unknown): SkuPaymentRules | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const row = raw as Record<string, unknown>;
  return {
    allowCoinRedemption: row.allowCoinRedemption !== false,
    allowInrPayment: row.allowInrPayment !== false,
    isCoinOnly: readBool(row.isCoinOnly),
    maxCoinsAllowedEstimate: readNumber(row.maxCoinsAllowedEstimate),
    maxCoinDiscountEstimate: readNumber(row.maxCoinDiscountEstimate),
    coinToInrRate: readNumber(row.coinToInrRate, 0.1),
    maxCoinCoveragePercent: readNumber(row.maxCoinCoveragePercent, 50),
  };
}

export function normalizeShopSku(raw: Record<string, unknown>): ShopSku {
  const price = readNumber(raw.price ?? raw.retailPrice);
  const effectivePrice = raw.effectivePrice != null ? readNumber(raw.effectivePrice) : undefined;
  const retailPrice = effectivePrice ?? price;
  const stockStatus = String(raw.stockStatus ?? "available");

  return {
    id: String(raw.id ?? ""),
    itemId: String(raw.id ?? ""),
    title: String(raw.displayLabel ?? raw.label ?? raw.title ?? ""),
    label: String(raw.displayLabel ?? raw.label ?? raw.title ?? ""),
    price,
    retailPrice,
    originalPrice: raw.originalPrice != null ? readNumber(raw.originalPrice) : undefined,
    unitAmount: readNumber(raw.unitAmount ?? raw.faceValue ?? retailPrice),
    faceValue: raw.faceValue != null ? readNumber(raw.faceValue) : undefined,
    currency: String(raw.currency ?? "INR"),
    isAvailable: stockStatus === "available",
    stockStatus,
    isPopular: readBool(raw.isPopular),
    sortOrder: readNumber(raw.sortOrder),
    isDynamicDenomination: readBool(
      raw.isDynamicDenomination ?? raw.dynamicDenomination
    ),
    minFaceValue: raw.minFaceValue != null ? readNumber(raw.minFaceValue) : undefined,
    maxFaceValue: raw.maxFaceValue != null ? readNumber(raw.maxFaceValue) : undefined,
    perUnitPrice: raw.perUnitPrice != null ? readNumber(raw.perUnitPrice) : undefined,
    savingsPercent: raw.savingsPercent != null ? readNumber(raw.savingsPercent) : undefined,
    maxCoinCoveragePercent:
      raw.maxCoinCoveragePercent != null
        ? readNumber(raw.maxCoinCoveragePercent)
        : undefined,
    allowCoinRedemption: raw.allowCoinRedemption !== false,
    allowInrPayment: raw.allowInrPayment !== false,
    isCoinOnly: readBool(raw.isCoinOnly),
    coinPriceEstimate:
      raw.coinPriceEstimate != null ? readNumber(raw.coinPriceEstimate) : undefined,
    amountRestrictions: raw.amountRestrictions as ShopSku["amountRestrictions"],
    paymentRules: mapPaymentRules(raw.paymentRules),
  };
}

export function normalizeShopProductDetail(raw: Record<string, unknown>): ShopProductDetail {
  const skusRaw = Array.isArray(raw.skus) ? raw.skus : [];
  const skus = skusRaw
    .filter((item): item is Record<string, unknown> => !!item && typeof item === "object")
    .map(normalizeShopSku);

  const coinRulesRaw = (raw.coinRules as Record<string, unknown> | undefined) ?? {};
  const coinRules: ShopCoinRules = {
    coinToInrRate: readNumber(coinRulesRaw.coinToInrRate, 0.1),
    maxCoveragePercent: readNumber(
      coinRulesRaw.maxCoveragePercent ?? coinRulesRaw.maxCoinCoveragePercent,
      50
    ),
  };

  return {
    ...(raw as unknown as ShopProductDetail),
    id: String(raw.id ?? ""),
    categoryId: String(raw.categoryId ?? ""),
    categoryName: String(raw.categoryName ?? ""),
    name: String(raw.name ?? ""),
    slug: String(raw.slug ?? ""),
    brandName: (raw.brandName as string | null) ?? null,
    description: (raw.description as string | null) ?? null,
    about: (raw.about as string | null) ?? null,
    logoUrl: (raw.logoUrl as string | null) ?? null,
    heroImageUrl: (raw.heroImageUrl as string | null) ?? null,
    thumbnailImageUrl: (raw.thumbnailImageUrl as string | null) ?? null,
    isActive: raw.isActive !== false,
    isFeatured: readBool(raw.isFeatured),
    coinRules,
    skus,
  };
}

export function resolveSkuRetailPrice(sku?: ShopSku | null): number {
  if (!sku) return 0;
  return sku.retailPrice ?? sku.price ?? 0;
}
