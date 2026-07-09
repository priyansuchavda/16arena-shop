import type {
  CheckoutPreview,
  CheckoutRequest,
  ShopCoinRules,
  ShopSku,
  SkuPaymentRules,
} from "../types/shop.types";

export const ORDER_POLL_INTERVAL_MS = 1800;
export const ORDER_POLL_MAX_WAIT_MS = 45000;

export function formatDeliveryVoucherAmount(amount: number): string {
  if (amount === Math.round(amount)) {
    return String(Math.round(amount));
  }
  return amount.toFixed(2);
}

export function formatInr(amount: number): string {
  return `₹${amount.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
}

export function formatCoins(value: number): string {
  return value.toLocaleString("en-IN");
}

export function effectiveMaxCoins(rules?: SkuPaymentRules | null): number {
  if (!rules) return 0;
  if (rules.maxCoins != null && rules.maxCoins > 0) return rules.maxCoins;
  return rules.maxCoinsAllowedEstimate ?? 0;
}

export function effectiveMinRequiredCoins(
  rules?: SkuPaymentRules | null,
  maxCoinsAllowed?: number
): number {
  if (rules?.minRequiredCoins != null && rules.minRequiredCoins > 0) {
    return rules.minRequiredCoins;
  }
  if (rules?.effectiveMinRequiredCoins != null && rules.effectiveMinRequiredCoins > 0) {
    return rules.effectiveMinRequiredCoins;
  }
  return maxCoinsAllowed ?? effectiveMaxCoins(rules);
}

/** Preview payment rules win; flexible uses catalog rules when no preview yet. */
export function activePaymentRules(
  preview?: CheckoutPreview | null,
  sku?: ShopSku | null
): SkuPaymentRules | null | undefined {
  if (preview?.paymentRules) return preview.paymentRules;
  return sku?.paymentRules ?? null;
}

export function resolveCoinToInrRate({
  preview,
  sku,
  productCoinRules,
}: {
  preview?: CheckoutPreview | null;
  sku?: ShopSku | null;
  productCoinRules?: ShopCoinRules | null;
}): number {
  const skuRate = sku?.paymentRules?.coinToInrRate;
  if (skuRate != null && skuRate > 0) return skuRate;

  if (productCoinRules?.coinToInrRate != null && productCoinRules.coinToInrRate > 0) {
    return productCoinRules.coinToInrRate;
  }
  if (preview?.paymentRules?.coinToInrRate != null && preview.paymentRules.coinToInrRate > 0) {
    return preview.paymentRules.coinToInrRate;
  }
  return 0.01;
}

/** Matches mobile ShopService.formatPercent. */
export function formatPercent(value: number): string {
  if (Number.isInteger(value)) return String(value);
  let text = value.toFixed(2);
  while (text.includes(".") && text.endsWith("0")) {
    text = text.slice(0, -1);
  }
  if (text.endsWith(".")) text = text.slice(0, -1);
  return text;
}

/** Matches mobile _maxCoinCoveragePercentFor — SKU/preview driven, no hardcoded %. */
export function resolveMaxCoinCoveragePercent({
  preview,
  sku,
  productCoinRules,
  paymentRules,
}: {
  preview?: CheckoutPreview | null;
  sku?: ShopSku | null;
  productCoinRules?: ShopCoinRules | null;
  paymentRules?: SkuPaymentRules | null;
}): number | undefined {
  const rules = paymentRules ?? activePaymentRules(preview, sku);
  const fromRules = rules?.maxCoinCoveragePercent;
  if (fromRules != null && fromRules > 0) return fromRules;

  const fromSku = sku?.maxCoinCoveragePercent;
  if (fromSku != null && fromSku > 0) return fromSku;

  const fromProduct = productCoinRules?.maxCoveragePercent;
  if (fromProduct != null && fromProduct > 0) return fromProduct;

  return undefined;
}

/**
 * Discounted purchase price used for coin-cap math on flexible/dynamic SKUs.
 * Prefers [subtotal] when already computed (preview or local unit rate);
 * otherwise applies [savingsPercent] to [faceValue].
 * Matches mobile ShopService.discountedPurchasePriceForCoins.
 */
export function discountedPurchasePriceForCoins({
  faceValue,
  subtotal = 0,
  savingsPercent,
}: {
  faceValue: number;
  subtotal?: number;
  savingsPercent?: number | null;
}): number {
  if (subtotal > 0) return subtotal;
  if (
    savingsPercent != null &&
    savingsPercent > 0 &&
    savingsPercent < 100
  ) {
    return faceValue * (1 - savingsPercent / 100);
  }
  return faceValue;
}

/** Max redeemable coins for flexible denomination from purchase price × maxCoinCoveragePercent. */
export function maxCoinsForDynamicDenomination({
  sku,
  coinRules,
  purchasePrice,
  paymentRules,
}: {
  sku: ShopSku;
  coinRules: ShopCoinRules;
  purchasePrice: number;
  paymentRules?: SkuPaymentRules | null;
}): number {
  if (!sku.isDynamicDenomination || purchasePrice <= 0) return 0;

  const maxCoverage = resolveMaxCoinCoveragePercent({
    sku,
    productCoinRules: coinRules,
    paymentRules,
  });
  const coinToInrRate = resolveCoinToInrRate({ sku, productCoinRules: coinRules });
  if (maxCoverage == null || maxCoverage <= 0 || coinToInrRate <= 0) return 0;

  const maxInrCoverage = purchasePrice * (maxCoverage / 100);
  return Math.floor(maxInrCoverage / coinToInrRate);
}

export function resolveRuleCoinCap({
  preview,
  paymentRules,
  sku,
  coinRules,
  coinsBalance = 0,
  subtotal = 0,
  voucherFaceValue,
}: {
  preview?: CheckoutPreview | null;
  paymentRules?: SkuPaymentRules | null;
  sku?: ShopSku | null;
  coinRules?: ShopCoinRules | null;
  coinsBalance?: number;
  subtotal?: number;
  voucherFaceValue?: number | null;
}): number {
  const rules = paymentRules ?? preview?.paymentRules;
  const resolvedCoinRules = coinRules;

  if (
    sku?.isDynamicDenomination &&
    voucherFaceValue != null &&
    voucherFaceValue > 0 &&
    resolvedCoinRules
  ) {
    return maxCoinsForDynamicDenomination({
      sku,
      coinRules: resolvedCoinRules,
      purchasePrice: discountedPurchasePriceForCoins({
        faceValue: voucherFaceValue,
        subtotal,
        savingsPercent: preview?.savingsPercent ?? sku.savingsPercent,
      }),
      paymentRules: rules ?? sku.paymentRules,
    });
  }

  if (rules) return effectiveMaxCoins(rules);

  const lineRules = preview?.lines?.[0]?.paymentRules;
  if (lineRules) return effectiveMaxCoins(lineRules);

  if (sku) {
    return effectiveMaxCoins(sku.paymentRules) || sku.coinPriceEstimate || 0;
  }

  if (resolvedCoinRules && subtotal > 0) {
    const maxCoverage = resolveMaxCoinCoveragePercent({
      sku,
      productCoinRules: resolvedCoinRules,
      paymentRules: rules,
    });
    if (maxCoverage == null || maxCoverage <= 0) return 0;
    const rate = resolveCoinToInrRate({ sku, productCoinRules: resolvedCoinRules });
    const maxAllowedValue = subtotal * (maxCoverage / 100);
    return Math.min(coinsBalance, Math.floor(maxAllowedValue / rate));
  }

  return 0;
}

/** Matches mobile _maxCoinsAllowedForSelection. */
export function resolveMaxCoinsAllowedForSelection({
  product,
  sku,
  preview,
  coinsBalance,
  subtotal,
  voucherFaceValue,
}: {
  product: { coinRules: ShopCoinRules };
  sku: ShopSku;
  preview?: CheckoutPreview | null;
  coinsBalance: number;
  subtotal: number;
  voucherFaceValue?: number | null;
}): number {
  const paymentRules = activePaymentRules(preview, sku);

  if (sku.isDynamicDenomination && voucherFaceValue != null && voucherFaceValue > 0) {
    return maxCoinsForDynamicDenomination({
      sku,
      coinRules: product.coinRules,
      purchasePrice: discountedPurchasePriceForCoins({
        faceValue: voucherFaceValue,
        subtotal,
        savingsPercent: preview?.savingsPercent ?? sku.savingsPercent,
      }),
      paymentRules: paymentRules ?? sku.paymentRules,
    });
  }

  return resolveRuleCoinCap({
    preview,
    paymentRules: paymentRules ?? sku.paymentRules,
    sku,
    coinRules: product.coinRules,
    coinsBalance,
    subtotal,
    voucherFaceValue,
  });
}

export function previewCoinCap(
  coinsBalance: number,
  maxCoinsAllowedEstimate: number
): number {
  return Math.min(coinsBalance, maxCoinsAllowedEstimate);
}

export function capCoinsToRedeem({
  requested,
  coinsBalance,
  maxCoinsAllowed,
}: {
  requested: number;
  coinsBalance: number;
  maxCoinsAllowed: number;
}): number {
  if (requested <= 0) return 0;
  return Math.min(requested, Math.min(coinsBalance, maxCoinsAllowed));
}

/** Matches mobile ShopService.resolveAllowHybridInrPayment. */
export function resolveAllowHybridInrPayment({
  coinsToRedeem,
  maxCoinsAllowed,
  paymentRules,
}: {
  coinsToRedeem: number;
  maxCoinsAllowed: number;
  paymentRules?: SkuPaymentRules | null;
}): boolean {
  if (paymentRules?.isCoinOnly) return false;
  if (coinsToRedeem <= 0) return false;
  if (paymentRules?.allowInrPayment === false) return false;

  const minRequired = effectiveMinRequiredCoins(paymentRules, maxCoinsAllowed);

  if (maxCoinsAllowed > 0 && coinsToRedeem < maxCoinsAllowed) return true;

  if (minRequired > 0 && coinsToRedeem > 0 && coinsToRedeem < minRequired) {
    return true;
  }

  return false;
}

export function needsHybridForPartialCoins({
  coinsToRedeem,
  maxCoinsAllowed,
  totalPayable,
}: {
  coinsToRedeem: number;
  maxCoinsAllowed: number;
  totalPayable?: number | null;
}): boolean {
  if (coinsToRedeem <= 0) return false;
  if (totalPayable != null && totalPayable <= 0) return false;
  return coinsToRedeem < maxCoinsAllowed;
}

export function isInsufficientCoinsError(message: string): boolean {
  return message.toLowerCase().includes("insufficient arena coins");
}

export async function previewCheckoutWithHybridRetry(
  request: CheckoutRequest,
  previewFn: (req: CheckoutRequest) => Promise<CheckoutPreview | null>
): Promise<CheckoutPreview> {
  try {
    const preview = await previewFn(request);
    if (!preview) throw new Error("Failed to load checkout details.");
    return preview;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (
      isInsufficientCoinsError(message) &&
      request.coinsToRedeem > 0 &&
      !request.allowHybridInrPayment
    ) {
      const retry = await previewFn({ ...request, allowHybridInrPayment: true });
      if (!retry) throw new Error("Failed to load checkout details.");
      return retry;
    }
    throw error;
  }
}

export type BuyButtonLabelParts =
  | { kind: "default" }
  | { kind: "coins_only"; coinsSpent: number }
  | { kind: "hybrid"; totalPayable: number; coinsSpent: number }
  | { kind: "inr_only"; totalPayable: number };

export function resolveBuyButtonLabel(
  preview?: CheckoutPreview | null
): BuyButtonLabelParts {
  if (!preview) return { kind: "default" };

  const totalPayable = preview.totalPayable;
  const coinsSpent = preview.coinsSpent;

  if (totalPayable <= 0 && coinsSpent > 0) {
    return { kind: "coins_only", coinsSpent };
  }
  if (coinsSpent > 0) {
    return { kind: "hybrid", totalPayable, coinsSpent };
  }
  return { kind: "inr_only", totalPayable };
}

/** @deprecated Use resolveAllowHybridInrPayment */
export const shouldAllowHybridInrPayment = resolveAllowHybridInrPayment;

export function isOrderStatusTerminal(status: string): boolean {
  const s = status.toLowerCase();
  return (
    s === "fulfilled" ||
    s === "failed" ||
    s === "payment_failed" ||
    s === "refunded" ||
    s === "cancelled"
  );
}

export function isOrderStatusPending(status: string): boolean {
  const s = status.toLowerCase();
  return (
    s === "pending" ||
    s === "payment_initiated" ||
    s === "payment_success" ||
    s === "processing"
  );
}

export function orderStatusMessage(status: string): string {
  switch (status.toLowerCase()) {
    case "pending":
    case "payment_success":
      return "Delivering your code…";
    case "payment_initiated":
      return "Processing payment…";
    case "processing":
      return "Generating your gift card…";
    case "fulfilled":
      return "Fulfillment successful!";
    case "failed":
      return "Fulfillment failed.";
    case "payment_failed":
      return "Payment failed.";
    case "refunded":
      return "Order refunded.";
    case "cancelled":
      return "Order cancelled.";
    default:
      return "Processing order…";
  }
}

export function payButtonLabel(totalPayable: number): string {
  if (totalPayable <= 0) return "Confirm order";
  return `Pay ${formatInr(totalPayable)}`;
}

/** True when the order can still be paid (or cancelled) from history/detail. */
export function canCompleteOrCancelPayment(status: string): boolean {
  const s = status.toLowerCase();
  return s === "pending" || s === "payment_initiated";
}

/** Matches mobile ShopService.buyDisabledReason. */
export function buyDisabledReason({
  sku,
  coinsBalance,
  paymentRules,
  preview,
  amountError,
}: {
  sku?: ShopSku | null;
  coinsBalance: number;
  paymentRules?: SkuPaymentRules | null;
  preview?: CheckoutPreview | null;
  amountError?: string | null;
}): string | null {
  if (!sku || !sku.isAvailable) return null;
  if (amountError) return amountError;
  if (sku.isDynamicDenomination && preview == null) return null;

  const rules = paymentRules ?? sku.paymentRules;
  const allowInrPayment = rules?.allowInrPayment ?? sku.allowInrPayment;
  const allowCoinRedemption = rules?.allowCoinRedemption ?? sku.allowCoinRedemption;
  const isCoinOnly = rules?.isCoinOnly === true || sku.isCoinOnly;
  const maxCoins =
    rules?.maxCoinsAllowedEstimate ?? sku.coinPriceEstimate ?? 0;

  if (isCoinOnly && maxCoins > 0) {
    if (coinsBalance <= 0) {
      return "Insufficient Arena Coins. This item requires coin payment.";
    }
    if (coinsBalance < maxCoins) {
      return `Need ${formatCoins(maxCoins)} coins (you have ${formatCoins(coinsBalance)}).`;
    }
  }

  if (!allowCoinRedemption && !isCoinOnly && !allowInrPayment) {
    return "This item is currently unavailable for purchase.";
  }

  if (!allowInrPayment && !isCoinOnly && maxCoins > 0) {
    if (coinsBalance < maxCoins) {
      return "This item must be paid fully with Arena Coins.";
    }
  }

  return null;
}

export function parseCustomVoucherAmount(
  deliveryInfo?: Record<string, unknown> | null
): number | null {
  const raw = deliveryInfo?.customVoucherAmount;
  if (typeof raw === "number" && Number.isFinite(raw)) return raw;
  if (typeof raw === "string") {
    const parsed = parseFloat(raw);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

export function cartQuantityForSku(sku?: ShopSku | null, requestedQty = 1): number {
  const max = sku?.maxQuantity ?? 1;
  return Math.max(1, Math.min(requestedQty, max));
}
