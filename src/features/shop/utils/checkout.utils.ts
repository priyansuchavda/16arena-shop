import type { CheckoutPreview, ShopSku, SkuPaymentRules } from "../types/shop.types";

export const ORDER_POLL_INTERVAL_MS = 1800;
export const ORDER_POLL_MAX_WAIT_MS = 45000;

export function formatDeliveryVoucherAmount(amount: number): string {
  if (amount === Math.round(amount)) {
    return String(Math.round(amount));
  }
  return amount.toFixed(2);
}

export function shouldAllowHybridInrPayment({
  coinsToRedeem,
  maxCoinsAllowed,
  totalPayable,
  paymentRules,
}: {
  coinsToRedeem: number;
  maxCoinsAllowed: number;
  totalPayable?: number;
  paymentRules?: SkuPaymentRules | null;
}): boolean {
  if (paymentRules?.isCoinOnly) return false;
  if (totalPayable != null && totalPayable <= 0) return false;
  if (paymentRules?.allowInrPayment === false) return false;
  if (coinsToRedeem <= 0) return true;
  if (coinsToRedeem >= maxCoinsAllowed) return false;
  return coinsToRedeem < maxCoinsAllowed;
}

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
  return `Pay ₹${totalPayable.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
}

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
  if (!sku || sku.stockStatus === "out_of_stock" || !sku.isAvailable) {
    return "This item is out of stock.";
  }
  if (amountError) return amountError;
  if (sku.isDynamicDenomination && preview == null) return null;

  const rules = paymentRules ?? sku.paymentRules;
  const allowInrPayment = rules?.allowInrPayment ?? sku.allowInrPayment;
  const allowCoinRedemption = rules?.allowCoinRedemption ?? sku.allowCoinRedemption;
  const isCoinOnly = rules?.isCoinOnly === true || sku.isCoinOnly;
  const maxCoins =
    rules?.maxCoinsAllowedEstimate ?? sku.coinPriceEstimate ?? preview?.paymentRules?.maxCoinsAllowedEstimate ?? 0;

  if (isCoinOnly && maxCoins > 0) {
    if (coinsBalance <= 0) {
      return "Insufficient Arena Coins. This item requires coin payment.";
    }
    if (coinsBalance < maxCoins) {
      return `Need ${maxCoins.toLocaleString()} coins (you have ${coinsBalance.toLocaleString()}).`;
    }
  }

  if (!allowCoinRedemption && !isCoinOnly && !allowInrPayment) {
    return "This item is currently unavailable for purchase.";
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
