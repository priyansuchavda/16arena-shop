import type {
  CheckoutPreview,
  CheckoutPreviewRequest,
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
  return rules.maxCoins ?? 0;
}

export function effectiveMinRequiredCoins(
  rules?: SkuPaymentRules | null,
  maxCoinsAllowed?: number
): number {
  if (maxCoinsAllowed != null && maxCoinsAllowed > 0) {
    return maxCoinsAllowed;
  }
  return 0;
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
}: {
  preview?: CheckoutPreview | null;
  sku?: ShopSku | null;
}): number {
  // Prefer SKU payment rules rate first
  const skuRate = sku?.paymentRules?.coinToInrRate ?? sku?.maxCoins != null ? undefined : undefined;
  if (skuRate != null && skuRate > 0) return skuRate;

  // Fall back to preview rate
  if (preview?.paymentRules?.coinToInrRate != null && preview.paymentRules.coinToInrRate > 0) {
    return preview.paymentRules.coinToInrRate;
  }

  // Default: 0.01 (100 coins = ₹1)
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
  paymentRules,
}: {
  preview?: CheckoutPreview | null;
  sku?: ShopSku | null;
  paymentRules?: SkuPaymentRules | null;
}): number | undefined {
  const rules = paymentRules ?? activePaymentRules(preview, sku);
  const fromRules = rules?.maxCoinCoveragePercent;
  if (fromRules != null && fromRules > 0) return fromRules;

  const fromSku = sku?.maxCoinCoveragePercent;
  if (fromSku != null && fromSku > 0) return fromSku;

  return undefined;
}

export function resolveRuleCoinCap({
  preview,
  paymentRules,
  sku,
  coinsBalance = 0,
  voucherFaceValue,
}: {
  preview?: CheckoutPreview | null;
  paymentRules?: SkuPaymentRules | null;
  sku?: ShopSku | null;
  coinsBalance?: number;
  voucherFaceValue?: number | null;
}): number {
  const rules = paymentRules ?? preview?.paymentRules;

  if (
    sku?.isDynamicDenomination &&
    voucherFaceValue != null &&
    voucherFaceValue > 0
  ) {
    const maxCoverage = rules?.maxCoinCoveragePercent;
    if (maxCoverage == null || maxCoverage <= 0) return 0;

    const coinRate = rules?.coinToInrRate ?? 0.01;
    if (coinRate <= 0) return 0;

    const maxInrCoverage = voucherFaceValue * (maxCoverage / 100);
    const maxCoins = Math.floor(maxInrCoverage / coinRate);
    return Math.min(coinsBalance, maxCoins);
  }

  // Fixed SKU: use maxCoins directly (capped to user balance)
  if (sku?.maxCoins != null && sku.maxCoins > 0) {
    return Math.min(coinsBalance, sku.maxCoins);
  }

  // Check payment rules
  const ruleMaxCoins = rules?.maxCoins ?? 0;
  if (ruleMaxCoins > 0) {
    return Math.min(coinsBalance, ruleMaxCoins);
  }

  return 0;
}

/** Matches mobile _maxCoinsAllowedForSelection. */
export function resolveMaxCoinsAllowedForSelection({
  sku,
  preview,
  coinsBalance,
  voucherFaceValue,
}: {
  sku: ShopSku;
  preview?: CheckoutPreview | null;
  coinsBalance: number;
  voucherFaceValue?: number | null;
}): number {
  const paymentRules = activePaymentRules(preview, sku);

  if (sku.isDynamicDenomination && voucherFaceValue != null && voucherFaceValue > 0) {
    const maxCoverage = paymentRules?.maxCoinCoveragePercent;
    if (maxCoverage == null || maxCoverage <= 0) return 0;

    const coinRate = paymentRules?.coinToInrRate ?? 0.01;
    if (coinRate <= 0) return 0;

    const maxInrCoverage = voucherFaceValue * (maxCoverage / 100);
    const maxCoins = Math.floor(maxInrCoverage / coinRate);
    return Math.min(coinsBalance, maxCoins);
  }

  return resolveRuleCoinCap({
    preview,
    paymentRules: paymentRules ?? sku.paymentRules,
    sku,
    coinsBalance,
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
  request: CheckoutPreviewRequest,
  previewFn: (req: CheckoutPreviewRequest) => Promise<CheckoutPreview | null>
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
  const maxCoins = rules?.maxCoins ?? sku.maxCoins ?? 0;

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
