import type {
  AddCartItemRequest,
  ApiCategory,
  ApiProduct,
  CartData,
  CheckoutPreview,
  CheckoutPreviewRequest,
  CheckoutRequest,
  CouponValidateResult,
  HubbleSsoTokenResponse,
  MobileSection,
  MyCoupon,
  OrderInvoice,
  ShopConfig,
  ShopOrder,
  ShopProductDetail,
  ShopVisibility,
  UpdateCartItemRequest,
} from "../types/shop.types";
import { shopCatalogService } from "./shop-catalog.service";
import {
  buildCheckoutRequest,
  shopCartService,
  shopCheckoutService,
} from "./shop-checkout.service";
import { shopCouponsService } from "./shop-coupons.service";
import { mapOrder } from "./shop-mappers";
import { shopOrdersService } from "./shop-orders.service";
import { shopPaymentService } from "./shop-payment.service";
import { shopWalletService } from "./shop-wallet.service";

export { buildCheckoutRequest };

export const shopApi = {
  ...shopCatalogService,
  fetchProductBySlug: shopCatalogService.getProductBySlug,

  fetchWalletBalance: shopWalletService.getArenaCreditsBalance,
  getCoinsBalance: shopWalletService.getCoinsBalance,
  getArenaCreditsBalance: shopWalletService.getArenaCreditsBalance,

  getMyCoupons: shopCouponsService.getMyCoupons,
  validateCoupon: shopCouponsService.validateCoupon,

  checkoutPreview: (payload: CheckoutPreviewRequest) =>
    shopCheckoutService.previewCheckout(payload),

  buildCheckoutRequest,
  placeOrder: async (request: CheckoutRequest): Promise<ShopOrder> => {
    const raw = await shopCheckoutService.placeOrder(request);
    const order = mapOrder(raw);
    if (!order) {
      throw new Error("Failed to create order");
    }
    return order;
  },

  addToCart: (
    skuId: string,
    quantity: number,
    customVoucherAmount?: number | null,
    deliveryInfo?: Record<string, string>
  ) =>
    shopCartService.addCartItem({
      skuId,
      quantity,
      customVoucherAmount,
      deliveryInfo,
    }),

  getCart: shopCartService.getCart,
  addCartItem: shopCartService.addCartItem,
  updateCartItem: (itemId: string, quantity: number, deliveryInfo?: Record<string, string>) =>
    shopCartService.updateCartItem(itemId, {
      quantity,
      ...(deliveryInfo ? { deliveryInfo } : {}),
    }),
  removeCartItem: shopCartService.removeCartItem,

  createOrder: async (payload: {
    cartItemIds?: string[] | null;
    coinsToRedeem: number;
    useWalletCredits?: boolean;
    walletCreditsToUse?: number;
    couponCode?: string | null;
    allowHybridInrPayment: boolean;
    quantity?: number;
    isSquad?: boolean;
  }): Promise<ShopOrder> => {
    return shopApi.placeOrder(
      buildCheckoutRequest({
        cartItemIds: payload.cartItemIds ?? null,
        coinsToRedeem: payload.coinsToRedeem,
        useWalletCredits: payload.useWalletCredits,
        walletCreditsToUse: payload.walletCreditsToUse,
        couponCode: payload.couponCode,
        allowHybridInrPayment: payload.allowHybridInrPayment,
        quantity: payload.quantity,
        isSquad: payload.isSquad,
      })
    );
  },

  initiatePayment: shopPaymentService.initiatePayment,
  verifyPayment: shopPaymentService.verifyPayment,

  fetchOrders: shopOrdersService.getOrders,
  getOrder: shopOrdersService.getOrder,
  cancelOrder: shopOrdersService.cancelOrder,
  fetchOrderInvoice: shopOrdersService.fetchOrderInvoice,

  searchProducts: shopCatalogService.searchProducts,
};

export type {
  AddCartItemRequest,
  ApiCategory,
  ApiProduct,
  CartData,
  CheckoutPreview,
  CheckoutPreviewRequest,
  CheckoutRequest,
  CouponValidateResult,
  HubbleSsoTokenResponse,
  MobileSection,
  MyCoupon,
  OrderInvoice,
  ShopConfig,
  ShopOrder,
  ShopProductDetail,
  ShopVisibility,
  UpdateCartItemRequest,
};
