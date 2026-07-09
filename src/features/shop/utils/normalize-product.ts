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
  return {
    allowCoinRedemption: readBool(raw.allowCoinRedemption, false),
    allowInrPayment: readBool(raw.allowInrPayment, true),
    isCoinOnly: readBool(raw.isCoinOnly),
    maxCoins: raw.maxCoins != null ? readNumber(raw.maxCoins) : undefined,
    coinToInrRate: raw.coinToInrRate != null ? readNumber(raw.coinToInrRate) : undefined,
    maxCoinCoveragePercent: raw.maxCoinCoveragePercent != null ? readNumber(raw.maxCoinCoveragePercent) : undefined,
    inrPayableAfterMaxCoins: raw.inrPayableAfterMaxCoins != null ? readNumber(raw.inrPayableAfterMaxCoins) : undefined,
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
    isDynamicDenomination: readBool(raw.isDynamicDenomination),
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
    maxCoins: raw.maxCoins != null ? readNumber(raw.maxCoins) : undefined,
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
    denominationType: (raw.denominationType as string | undefined),
    savingsPercent: raw.savingsPercent != null ? readNumber(raw.savingsPercent) : undefined,
    effectiveCashbackPercent: raw.effectiveCashbackPercent != null ? readNumber(raw.effectiveCashbackPercent) : undefined,
    amountRestrictions: raw.amountRestrictions as ShopProductDetail["amountRestrictions"],
    skus,
    giftCardInfo: raw.giftCardInfo ? {
      redemptionType: (raw.giftCardInfo as any)?.redemptionType,
      redemptionLabel: (raw.giftCardInfo as any)?.redemptionLabel,
      expiryLabel: (raw.giftCardInfo as any)?.expiryLabel,
      usageSummary: (raw.giftCardInfo as any)?.usageSummary,
      howToUseInstructions: (raw.giftCardInfo as any)?.howToUseInstructions,
      termsAndConditions: Array.isArray((raw.giftCardInfo as any)?.termsAndConditions)
        ? (raw.giftCardInfo as any).termsAndConditions
        : undefined,
      amountRestrictions: (raw.giftCardInfo as any)?.amountRestrictions,
    } : null,
  };
}

export function resolveSkuRetailPrice(sku?: ShopSku | null): number {
  if (!sku) return 0;
  return sku.retailPrice ?? sku.price ?? 0;
}
