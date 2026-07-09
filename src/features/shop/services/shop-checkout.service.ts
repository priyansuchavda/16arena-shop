import type {
  AddCartItemRequest,
  CartData,
  CheckoutPreview,
  CheckoutPreviewRequest,
  CheckoutRequest,
  SyncCartPreviewInput,
  UpdateCartItemRequest,
} from "../types/shop.types";
import { formatDeliveryVoucherAmount } from "../utils/checkout.utils";
import { apiClient } from "@/shared/lib/axios";
import { assertEnvelopeSuccess, type ApiEnvelope, unwrapData } from "./shop-api-client";
import { mapCartData, mapCheckoutPreview } from "./shop-mappers";

export function buildDeliveryInfo(
  customVoucherAmount?: number | null,
  deliveryFields?: Record<string, string>
): Record<string, string> | undefined {
  const deliveryInfo: Record<string, string> = { ...(deliveryFields ?? {}) };

  if (customVoucherAmount != null && customVoucherAmount > 0) {
    deliveryInfo.customVoucherAmount = formatDeliveryVoucherAmount(customVoucherAmount);
  }

  return Object.keys(deliveryInfo).length > 0 ? deliveryInfo : undefined;
}

export function buildCheckoutRequest(state: {
  cartItemIds?: string[] | null;
  coinsToRedeem: number;
  useWalletCredits?: boolean;
  walletCreditsToUse?: number;
  couponCode?: string | null;
  isSquad?: boolean;
  allowHybridInrPayment: boolean;
  quantity?: number;
  idempotencyKey?: string;
}): CheckoutPreviewRequest {
  return {
    cartItemIds: state.cartItemIds ?? null,
    coinsToRedeem: state.coinsToRedeem,
    useWalletCredits: state.useWalletCredits ?? false,
    walletCreditsToUse: state.walletCreditsToUse ?? 0,
    couponCode: state.couponCode ?? null,
    isSquad: state.isSquad ?? (state.quantity ?? 1) >= 5,
    allowHybridInrPayment: state.allowHybridInrPayment,
    ...(state.idempotencyKey ? { idempotencyKey: state.idempotencyKey } : {}),
  };
}

export const shopCheckoutService = {
  previewCheckout: async (
    request: CheckoutPreviewRequest
  ): Promise<CheckoutPreview | null> => {
    const { data } = await apiClient.post<ApiEnvelope<unknown>>(
      "/v1/shop/checkout/preview",
      request
    );

    if (data.success === false) {
      throw new Error(data.message ?? "Checkout preview failed");
    }

    return mapCheckoutPreview(data);
  },

  syncCartAndPreview: async (
    input: SyncCartPreviewInput
  ): Promise<{ preview: CheckoutPreview | null; cart: CartData; cartItemIds: string[] }> => {
    const cart = await shopCartService.addCartItem({
      skuId: input.skuId,
      quantity: input.quantity,
      customVoucherAmount: input.customVoucherAmount,
      deliveryInfo: input.deliveryInfo,
    });

    if (!cart) {
      throw new Error("Could not update cart for this selection.");
    }

    const preview = await shopCheckoutService.previewCheckout({
      cartItemIds: input.cartItemIds ?? null,
      coinsToRedeem: input.coinsToRedeem,
      useWalletCredits: input.useWalletCredits ?? false,
      walletCreditsToUse: input.walletCreditsToUse ?? 0,
      couponCode: input.couponCode ?? null,
      isSquad: input.isSquad ?? input.quantity >= 5,
      allowHybridInrPayment: input.allowHybridInrPayment,
    });

    const cartItemIds =
      cart.items.map((item) => item.id).filter(Boolean).length > 0
        ? cart.items.map((item) => item.id).filter(Boolean)
        : preview?.lines
            ?.map((line) => line.cartItemId)
            .filter((id): id is string => Boolean(id)) ?? [];

    return { preview, cart, cartItemIds };
  },

  placeOrder: async (request: CheckoutRequest) => {
    if (!request.idempotencyKey) {
      throw new Error("Checkout idempotency key is required.");
    }
    const { data } = await apiClient.post<ApiEnvelope<unknown>>(
      "/v1/shop/orders",
      request
    );
    return assertEnvelopeSuccess(data as ApiEnvelope<unknown>, "Failed to create order");
  },
};

export const shopCartService = {
  getCart: async (): Promise<CartData | null> => {
    try {
      const { data } = await apiClient.get<ApiEnvelope<unknown>>("/v1/shop/cart");
      return mapCartData(data);
    } catch {
      return null;
    }
  },

  addCartItem: async (body: AddCartItemRequest) => {
    const { data } = await apiClient.post<ApiEnvelope<unknown>>("/v1/shop/cart/items", {
      skuId: body.skuId,
      quantity: body.quantity,
      deliveryInfo: buildDeliveryInfo(body.customVoucherAmount, body.deliveryInfo),
      giftRecipientUserId: body.giftRecipientUserId ?? null,
    });

    if (data.success === false) {
      throw new Error(data.message ?? "Failed to add item to cart");
    }

    return mapCartData(data) ?? unwrapData(data);
  },

  updateCartItem: async (cartItemId: string, body: UpdateCartItemRequest) => {
    const { data } = await apiClient.put<ApiEnvelope<unknown>>(
      `/v1/shop/cart/items/${cartItemId}`,
      {
        quantity: body.quantity,
        ...(body.deliveryInfo ? { deliveryInfo: body.deliveryInfo } : {}),
        ...(body.giftRecipientUserId !== undefined
          ? { giftRecipientUserId: body.giftRecipientUserId }
          : {}),
      }
    );

    if (data.success === false) {
      throw new Error(data.message ?? "Failed to update cart item");
    }

    return mapCartData(data) ?? unwrapData(data);
  },

  removeCartItem: async (cartItemId: string) => {
    const { data } = await apiClient.delete<ApiEnvelope<unknown>>(
      `/v1/shop/cart/items/${cartItemId}`
    );

    if (data.success === false) {
      throw new Error(data.message ?? "Failed to remove cart item");
    }

    return mapCartData(data) ?? unwrapData(data);
  },
};
