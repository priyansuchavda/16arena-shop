import { apiClient } from "@/shared/lib/axios";
import type {
  ApiCategory,
  ApiProduct,
  HubbleSsoTokenResponse,
  ShopConfig,
  ShopVisibility,
  MobileSection,
  ShopProductDetail,
  CheckoutPreview,
  ShopOrder,
  CartData,
  OrderInvoice,
} from "./types/shop.types";
import { formatDeliveryVoucherAmount } from "./utils/checkout.utils";
import { normalizeShopProductDetail } from "./utils/normalize-product";

type ApiEnvelope<T> = {
  success?: boolean;
  message?: string;
  data?: T;
};

function unwrapData<T>(payload: unknown): T | null {
  if (!payload || typeof payload !== "object") return null;
  const record = payload as Record<string, unknown>;
  if ("data" in record && record.data != null) {
    return record.data as T;
  }
  return payload as T;
}

function mapCartData(raw: unknown): CartData | null {
  const data = unwrapData<Record<string, unknown>>(raw);
  if (!data) return null;

  const itemsRaw = Array.isArray(data.items) ? data.items : [];
  const items = itemsRaw.map((item) => {
    const row = item as Record<string, unknown>;
    return {
      id: String(row.id ?? ""),
      skuId: String(row.skuId ?? ""),
      quantity: Number(row.quantity ?? 1),
      productName: String(row.productName ?? ""),
      skuLabel: String(row.skuLabel ?? ""),
      unitPrice: Number(row.unitPrice ?? 0),
      heroImageUrl: (row.heroImageUrl ?? row.productImageUrl) as string | null | undefined,
      productImageUrl: row.productImageUrl as string | null | undefined,
      deliveryInfo: (row.deliveryInfo as Record<string, unknown> | null) ?? null,
    };
  });

  return {
    id: String(data.id ?? ""),
    itemCount: Number(data.itemCount ?? items.length),
    items,
  };
}

function mapCheckoutPreview(raw: unknown): CheckoutPreview | null {
  const data = unwrapData<Record<string, unknown>>(raw);
  if (!data) return null;

  return {
    subtotal: Number(data.subtotal ?? 0),
    totalDiscount: Number(data.discountAmount ?? data.totalDiscount ?? 0),
    coinsDiscount: Number(data.coinsDiscount ?? 0),
    coinsSpent: Number(data.coinsSpent ?? 0),
    walletUsed: Number(data.walletUsed ?? 0),
    totalPayable: Number(data.totalPayable ?? 0),
    totalPayableInCoins: Number(data.totalPayableInCoins ?? 0),
    savingsPercent: data.savingsPercent as number | undefined,
    effectiveCashbackPercent: data.effectiveCashbackPercent as number | undefined,
    coinsBalance: Number(data.coinsBalance ?? 0),
    unitPrice: data.unitPrice as number | undefined,
    originalUnitPrice: data.originalUnitPrice as number | undefined,
    paymentRules: data.paymentRules as CheckoutPreview["paymentRules"],
  };
}

function mapOrder(raw: unknown): ShopOrder | null {
  const data = unwrapData<Record<string, unknown>>(raw);
  if (!data) return null;

  const itemsRaw = Array.isArray(data.items) ? data.items : [];
  const items = itemsRaw.map((item) => {
    const row = item as Record<string, unknown>;
    const giftCardDelivery = row.giftCardDelivery as Record<string, unknown> | undefined;
    const vouchersRaw = giftCardDelivery?.vouchers;
    const vouchers = Array.isArray(vouchersRaw)
      ? vouchersRaw.map((v) => {
          const voucher = v as Record<string, unknown>;
          return {
            cardNumber: String(voucher.cardNumber ?? ""),
            cardPin: voucher.cardPin as string | undefined,
            validTill: voucher.validTill as string | undefined,
            amount: Number(voucher.amount ?? 0),
            cardType: String(voucher.cardType ?? ""),
          };
        })
      : [];

    const detailsRaw = row.voucherDetails;
    const voucherDetails = Array.isArray(detailsRaw)
      ? detailsRaw.map((d) => {
          const detail = d as Record<string, unknown>;
          return {
            key: String(detail.key ?? ""),
            label: String(detail.label ?? ""),
            value: String(detail.value ?? ""),
          };
        })
      : [];

    return {
      id: String(row.id ?? ""),
      skuId: String(row.skuId ?? ""),
      productName: String(row.productName ?? ""),
      skuLabel: String(row.skuLabel ?? ""),
      brandName: row.brandName as string | undefined,
      brandLogoUrl: row.brandLogoUrl as string | undefined,
      productImageUrl: row.productImageUrl as string | undefined,
      faceValue: row.faceValue as number | undefined,
      quantity: Number(row.quantity ?? 1),
      unitPrice: Number(row.unitPrice ?? 0),
      fulfillmentStatus: String(row.fulfillmentStatus ?? ""),
      fulfillmentType: row.fulfillmentType as string | undefined,
      fulfillmentMessage: row.fulfillmentMessage as string | undefined,
      voucherCode: row.voucherCode as string | undefined,
      vouchers,
      voucherDetails,
    };
  });

  return {
    id: String(data.id ?? ""),
    orderNumber: String(data.orderNumber ?? ""),
    status: String(data.status ?? ""),
    subtotal: Number(data.subtotal ?? 0),
    discountAmount: Number(data.discountAmount ?? 0),
    coinsDiscount: Number(data.coinsDiscount ?? 0),
    coinsSpent: Number(data.coinsSpent ?? 0),
    walletUsed: Number(data.walletUsed ?? 0),
    totalPaid: Number(data.totalPaid ?? 0),
    cashbackEarned: Number(data.cashbackEarned ?? 0),
    cashbackCoinsEarned: data.cashbackCoinsEarned as number | undefined,
    paymentMethod: String(data.paymentMethod ?? "razorpay"),
    couponCode: data.couponCode as string | undefined,
    createdAt: String(data.createdAt ?? ""),
    items,
  };
}

export const shopApi = {
  fetchCategories: async (): Promise<ApiCategory[]> => {
    const { data } = await apiClient.get<{ data: ApiCategory[] }>("/v1/shop/categories");
    return data.data;
  },

  fetchProducts: async (categoryId?: string, page = 1, pageSize = 20): Promise<ApiProduct[]> => {
    const path = categoryId
      ? `/v1/shop/products?categoryId=${categoryId}&page=${page}&pageSize=${pageSize}`
      : `/v1/shop/products?page=${page}&pageSize=${pageSize}`;
    const { data } = await apiClient.get<{ data: { items: ApiProduct[] } }>(path);
    const items = data.data?.items ?? (data.data as any);
    return Array.isArray(items) ? items : [];
  },

  fetchProductBySlug: async (slug: string): Promise<ApiProduct | null> => {
    try {
      const { data } = await apiClient.get<{ data: ApiProduct }>(`/v1/shop/products/${slug}`);
      return data.data;
    } catch {
      return null;
    }
  },

  fetchFeaturedProducts: async (): Promise<ApiProduct[]> => {
    const { data } = await apiClient.get<{ data: ApiProduct[] }>("/v1/shop/products/featured");
    return data.data;
  },

  fetchWalletBalance: async (): Promise<number> => {
    try {
      const { data } = await apiClient.get("/v1/shop/wallet/balance");
      const balanceData = data?.data || data;
      const n =
        balanceData?.balance ??
        balanceData?.coinBalance ??
        balanceData?.coins ??
        balanceData?.walletBalance;
      return typeof n === "number" && Number.isFinite(n) ? n : 0;
    } catch {
      return 0;
    }
  },

  fetchShopConfig: async (): Promise<ShopConfig> => {
    const { data } = await apiClient.get<{ data: ShopConfig }>("/v1/shop-config");
    return data.data;
  },

  fetchHubbleSsoToken: async (): Promise<HubbleSsoTokenResponse> => {
    const { data } = await apiClient.get<{ data: HubbleSsoTokenResponse }>("/v1/hubble/sso-token");
    return data.data;
  },

  checkShopVisibility: async (): Promise<ShopVisibility> => {
    try {
      const { data } = await apiClient.get<{ data?: unknown[] }>(
        "/v1/MobileSection/getAllSections?page=shop&type=shop"
      );
      const sections = data?.data ?? [];
      return { visible: sections.length > 0 };
    } catch {
      return { visible: true };
    }
  },

  fetchProductDetail: async (slug: string): Promise<ShopProductDetail | null> => {
    try {
      const { data } = await apiClient.get<{ data: Record<string, unknown> }>(
        `/v1/shop/products/${slug}`
      );
      if (!data?.data) return null;
      return normalizeShopProductDetail(data.data);
    } catch {
      return null;
    }
  },

  fetchShopSections: async (): Promise<MobileSection[]> => {
    try {
      const { data } = await apiClient.get<{ data: MobileSection[] }>(
        "/v1/MobileSection/getAllSections?page=shop&type=shop"
      );
      return data.data ?? [];
    } catch {
      return [];
    }
  },

  checkoutPreview: async (payload: {
    skuId?: string;
    quantity: number;
    coinsToRedeem: number;
    couponCode?: string | null;
    customVoucherAmount?: number | null;
    allowHybridInrPayment: boolean;
    useWalletCredits?: boolean;
    walletCreditsToUse?: number;
  }): Promise<CheckoutPreview | null> => {
    const { data } = await apiClient.post<ApiEnvelope<CheckoutPreview>>(
      "/v1/shop/checkout/preview",
      {
        ...payload,
        useWalletCredits: payload.useWalletCredits ?? false,
        walletCreditsToUse: payload.walletCreditsToUse ?? 0,
        isSquad: payload.quantity >= 5,
      }
    );
    if (data.success === false) {
      throw new Error(data.message ?? "Checkout preview failed");
    }
    return mapCheckoutPreview(data);
  },

  validateCoupon: async (code: string, subtotal: number) => {
    const { data } = await apiClient.post<ApiEnvelope<{ valid?: boolean }>>(
      "/v1/shop/coupons/validate",
      { code, subtotal }
    );
    return data;
  },

  addToCart: async (skuId: string, quantity: number, customVoucherAmount?: number | null) => {
    const { data } = await apiClient.post<ApiEnvelope<unknown>>("/v1/shop/cart/items", {
      skuId,
      quantity,
      ...(customVoucherAmount != null && customVoucherAmount > 0
        ? {
            deliveryInfo: {
              customVoucherAmount: formatDeliveryVoucherAmount(customVoucherAmount),
            },
          }
        : {}),
    });
    if (data.success === false) {
      throw new Error(data.message ?? "Failed to add item to cart");
    }
    return data;
  },

  getCart: async (): Promise<CartData | null> => {
    try {
      const { data } = await apiClient.get<ApiEnvelope<CartData>>("/v1/shop/cart");
      return mapCartData(data);
    } catch {
      return null;
    }
  },

  updateCartItem: async (itemId: string, quantity: number) => {
    const { data } = await apiClient.put<ApiEnvelope<unknown>>(
      `/v1/shop/cart/items/${itemId}`,
      { quantity }
    );
    if (data.success === false) {
      throw new Error(data.message ?? "Failed to update cart item");
    }
    return data;
  },

  removeCartItem: async (itemId: string) => {
    const { data } = await apiClient.delete<ApiEnvelope<unknown>>(
      `/v1/shop/cart/items/${itemId}`
    );
    if (data.success === false) {
      throw new Error(data.message ?? "Failed to remove cart item");
    }
    return data;
  },

  createOrder: async (payload: {
    cartItemIds?: string[] | null;
    coinsToRedeem: number;
    useWalletCredits?: boolean;
    walletCreditsToUse?: number;
    couponCode?: string | null;
    allowHybridInrPayment: boolean;
    quantity?: number;
  }): Promise<ShopOrder> => {
    const { data } = await apiClient.post<ApiEnvelope<ShopOrder>>("/v1/shop/orders", {
      cartItemIds: payload.cartItemIds ?? null,
      coinsToRedeem: payload.coinsToRedeem,
      useWalletCredits: payload.useWalletCredits ?? false,
      walletCreditsToUse: payload.walletCreditsToUse ?? 0,
      couponCode: payload.couponCode ?? null,
      isSquad: (payload.quantity ?? 1) >= 5,
      allowHybridInrPayment: payload.allowHybridInrPayment,
    });
    if (data.success === false) {
      throw new Error(data.message ?? "Failed to create order");
    }
    const order = mapOrder(data);
    if (!order) {
      throw new Error("Failed to create order");
    }
    return order;
  },

  initiatePayment: async (orderId: string): Promise<{
    orderId: string;
    orderNumber?: string;
    gatewayOrderId: string;
    amount: number;
    currency?: string;
    razorpayKeyId?: string;
    keyId?: string;
  }> => {
    const { data } = await apiClient.post<
      ApiEnvelope<{
        orderId: string;
        orderNumber?: string;
        gatewayOrderId: string;
        amount: number;
        currency?: string;
        razorpayKeyId?: string;
        keyId?: string;
      }>
    >("/v1/shop/payment/initiate", { orderId });
    if (data.success === false) {
      throw new Error(data.message ?? "Payment initiation failed");
    }
    const payment = unwrapData<{
      orderId: string;
      orderNumber?: string;
      gatewayOrderId: string;
      amount: number;
      currency?: string;
      razorpayKeyId?: string;
      keyId?: string;
    }>(data);
    if (!payment?.gatewayOrderId) {
      throw new Error("Payment gateway order id missing.");
    }
    return payment;
  },

  verifyPayment: async (payload: {
    orderId: string;
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
  }) => {
    const { data } = await apiClient.post<ApiEnvelope<unknown>>(
      "/v1/shop/payment/verify",
      payload
    );
    if (data.success === false) {
      throw new Error(data.message ?? "Payment verification failed");
    }
    return data;
  },

  fetchOrders: async (
    page = 1,
    pageSize = 20
  ): Promise<{ orders: ShopOrder[]; totalCount: number }> => {
    try {
      const { data } = await apiClient.get(`/v1/shop/orders?page=${page}&pageSize=${pageSize}`);
      const res = unwrapData<{
        items?: unknown[];
        totalCount?: number;
      }>(data);
      const items = Array.isArray(res?.items) ? res.items : [];
      return {
        orders: items
          .map((item) => mapOrder(item))
          .filter((order): order is ShopOrder => order != null),
        totalCount: res?.totalCount ?? 0,
      };
    } catch {
      return { orders: [], totalCount: 0 };
    }
  },

  getOrder: async (id: string): Promise<ShopOrder | null> => {
    try {
      const { data } = await apiClient.get<ApiEnvelope<ShopOrder>>(`/v1/shop/orders/${id}`);
      return mapOrder(data);
    } catch {
      return null;
    }
  },

  fetchOrderInvoice: async (orderId: string): Promise<OrderInvoice | null> => {
    try {
      const { data } = await apiClient.get<ApiEnvelope<OrderInvoice>>(
        `/v1/shop/orders/${orderId}/invoice`
      );
      const invoice = unwrapData<OrderInvoice>(data);
      if (invoice) return invoice;
      const order = await shopApi.getOrder(orderId);
      if (!order) return null;
      return {
        orderId: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        createdAt: order.createdAt,
        subtotal: order.subtotal,
        discountAmount: order.discountAmount,
        coinsDiscount: order.coinsDiscount,
        coinsSpent: order.coinsSpent,
        walletUsed: order.walletUsed,
        totalPaid: order.totalPaid,
        paymentMethod: order.paymentMethod,
        couponCode: order.couponCode,
        items: order.items.map((item) => ({
          productName: item.productName,
          skuLabel: item.skuLabel,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          faceValue: item.faceValue,
        })),
      };
    } catch {
      return null;
    }
  },
};
