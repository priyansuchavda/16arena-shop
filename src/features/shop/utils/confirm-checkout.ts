import type { CheckoutPreview, CheckoutRequest } from "../types/shop.types";
import { shopCheckoutService } from "../services/shop-checkout.service";
import { previewCheckoutWithHybridRetry } from "./checkout.utils";

export async function confirmCheckoutPreview(
  request: CheckoutRequest,
  _previewHint?: CheckoutPreview | null
): Promise<{ request: CheckoutRequest; preview: CheckoutPreview }> {
  const preview = await previewCheckoutWithHybridRetry(
    request,
    (req) => shopCheckoutService.previewCheckout(req)
  );

  return { request, preview };
}
