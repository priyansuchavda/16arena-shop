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

/** API often sends payment rules as flat SKU fields (see Valorant product response). */
export function buildSkuPaymentRulesFromRaw(
  raw: Record<string, unknown>
): SkuPaymentRules {
  const maxEstimate = readNumber(raw.maxCoinsAllowedEstimate);
  const maxCoins = readNumber(raw.maxCoins, maxEstimate);
  const minRequired = readNumber(
    raw.minRequiredCoins ?? raw.minCoinsRequired,
    maxCoins
  );

  return {
    allowCoinRedemption: raw.allowCoinRedemption !== false,
    allowInrPayment: raw.allowInrPayment !== false,
    isCoinOnly: readBool(raw.isCoinOnly),
    maxCoinsAllowedEstimate: maxEstimate,
    maxCoins,
    minRequiredCoins: minRequired,
    maxCoinDiscountEstimate: readNumber(raw.maxCoinDiscountEstimate),
    coinToInrRate: readNumber(raw.coinToInrRate, 0.01),
    maxCoinCoveragePercent:
      raw.maxCoinCoveragePercent != null
        ? readNumber(raw.maxCoinCoveragePercent)
        : undefined,
    inrPayableAfterMaxCoins:
      raw.inrPayableAfterMaxCoins != null
        ? readNumber(raw.inrPayableAfterMaxCoins)
        : undefined,
  };
}

function mapPaymentRules(raw: unknown): SkuPaymentRules | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  return buildSkuPaymentRulesFromRaw(raw as Record<string, unknown>);
}

export function normalizeShopSku(raw: Record<string, unknown>): ShopSku {
  const price = readNumber(raw.price ?? raw.retailPrice);
  const effectivePrice = raw.effectivePrice != null ? readNumber(raw.effectivePrice) : undefined;
  const retailPrice = effectivePrice ?? price;
  const stockStatus = String(raw.stockStatus ?? "available");
  const flatPaymentRules = buildSkuPaymentRulesFromRaw(raw);

  const shortLabel = String(raw.label ?? raw.title ?? "");
  const displayLabel = String(raw.displayLabel ?? shortLabel);

  return {
    id: String(raw.id ?? ""),
    itemId: String(raw.id ?? ""),
    title: displayLabel || shortLabel,
    label: shortLabel || displayLabel,
    displayLabel: displayLabel || shortLabel,
    price,
    retailPrice,
    originalPrice: raw.originalPrice != null ? readNumber(raw.originalPrice) : undefined,
    unitAmount: readNumber(raw.unitAmount ?? raw.faceValue ?? retailPrice),
    faceValue: raw.faceValue != null ? readNumber(raw.faceValue) : undefined,
    currency: String(raw.currencyUnit ?? raw.currency ?? "INR"),
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
        : flatPaymentRules.maxCoinCoveragePercent,
    allowCoinRedemption: flatPaymentRules.allowCoinRedemption,
    allowInrPayment: flatPaymentRules.allowInrPayment,
    isCoinOnly: flatPaymentRules.isCoinOnly,
    coinPriceEstimate:
      raw.coinPriceEstimate != null ? readNumber(raw.coinPriceEstimate) : undefined,
    maxCoins: raw.maxCoins != null ? readNumber(raw.maxCoins) : undefined,
    maxCoinsAllowedEstimate:
      raw.maxCoinsAllowedEstimate != null
        ? readNumber(raw.maxCoinsAllowedEstimate)
        : flatPaymentRules.maxCoinsAllowedEstimate,
    inrPayableAfterMaxCoins:
      raw.inrPayableAfterMaxCoins != null
        ? readNumber(raw.inrPayableAfterMaxCoins)
        : flatPaymentRules.inrPayableAfterMaxCoins,
    maxQuantity: readNumber(raw.maxQuantity, 10),
    isActive: raw.isActive !== false,
    amountRestrictions: raw.amountRestrictions as ShopSku["amountRestrictions"],
    paymentRules: mapPaymentRules(raw.paymentRules) ?? flatPaymentRules,
  };
}

export function normalizeShopProductDetail(raw: Record<string, unknown>): ShopProductDetail {
  const skusRaw = Array.isArray(raw.skus) ? raw.skus : [];
  const skus = skusRaw
    .filter((item): item is Record<string, unknown> => !!item && typeof item === "object")
    .map(normalizeShopSku);

  const firstSku = skus[0];
  const coinRulesRaw = (raw.coinRules as Record<string, unknown> | undefined) ?? {};
  const coinRules: ShopCoinRules = {
    coinToInrRate: readNumber(
      coinRulesRaw.coinToInrRate ?? firstSku?.paymentRules?.coinToInrRate,
      0.01
    ),
    maxCoveragePercent: readNumber(
      coinRulesRaw.maxCoveragePercent ??
        coinRulesRaw.maxCoinCoveragePercent ??
        firstSku?.maxCoinCoveragePercent ??
        firstSku?.paymentRules?.maxCoinCoveragePercent,
      0
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
