import type { CheckoutPreview, CheckoutRequest } from "../types/shop.types";
import { shopCheckoutService } from "../services/shop-checkout.service";
import { resolveAllowHybridInrPayment } from "./checkout.utils";

function isInsufficientCoinsError(message: string): boolean {
  return message.toLowerCase().includes("insufficient arena coins");
}

export async function confirmCheckoutPreview(
  request: CheckoutRequest,
  previewHint?: CheckoutPreview | null
): Promise<{ request: CheckoutRequest; preview: CheckoutPreview }> {
  let checkoutRequest = { ...request };

  if (
    previewHint &&
    previewHint.totalPayable > 0 &&
    checkoutRequest.coinsToRedeem > 0 &&
    !checkoutRequest.allowHybridInrPayment
  ) {
    checkoutRequest = {
      ...checkoutRequest,
      allowHybridInrPayment: true,
    };
  }

  let preview: CheckoutPreview | null = null;

  try {
    preview = await shopCheckoutService.previewCheckout(checkoutRequest);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (
      isInsufficientCoinsError(message) &&
      checkoutRequest.coinsToRedeem > 0 &&
      !checkoutRequest.allowHybridInrPayment
    ) {
      checkoutRequest = {
        ...checkoutRequest,
        allowHybridInrPayment: true,
      };
      preview = await shopCheckoutService.previewCheckout(checkoutRequest);
    } else {
      throw error;
    }
  }

  if (!preview) {
    throw new Error("Failed to confirm checkout details.");
  }

  const maxCoins =
    preview.paymentRules?.maxCoinsAllowedEstimate ?? checkoutRequest.coinsToRedeem;
  const allowHybrid = resolveAllowHybridInrPayment({
    coinsToRedeem: checkoutRequest.coinsToRedeem,
    maxCoinsAllowed: maxCoins,
    totalPayable: preview.totalPayable,
    paymentRules: preview.paymentRules,
  });

  if (allowHybrid !== checkoutRequest.allowHybridInrPayment) {
    checkoutRequest = {
      ...checkoutRequest,
      allowHybridInrPayment: allowHybrid,
    };
    preview = await shopCheckoutService.previewCheckout(checkoutRequest);
    if (!preview) {
      throw new Error("Failed to confirm checkout details.");
    }
  }

  return { request: checkoutRequest, preview };
}
