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
} from "./types/shop.types";

export const shopApi = {
  fetchCategories: async (): Promise<ApiCategory[]> => {
    const { data } = await apiClient.get<{ data: ApiCategory[] }>("/v1/shop/categories");
    return data.data;
  },

  fetchProducts: async (categoryId?: string): Promise<ApiProduct[]> => {
    const path = categoryId
      ? `/v1/shop/products?categoryId=${categoryId}&page=1&pageSize=20`
      : "/v1/shop/products";
    const { data } = await apiClient.get<{ data: { items: ApiProduct[] } }>(path);
    return data.data.items ?? [];
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

  // Newly Migrated Endpoints
  fetchProductDetail: async (slug: string): Promise<ShopProductDetail | null> => {
    try {
      const { data } = await apiClient.get<{ data: ShopProductDetail }>(`/v1/shop/products/${slug}`);
      return data.data;
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
  }): Promise<CheckoutPreview | null> => {
    try {
      const { data } = await apiClient.post<{ data: CheckoutPreview }>(
        "/v1/shop/checkout/preview",
        payload
      );
      return data.data;
    } catch {
      return null;
    }
  },

  addToCart: async (skuId: string, quantity: number, customVoucherAmount?: number | null) => {
    const { data } = await apiClient.post("/v1/shop/cart/items", {
      skuId,
      quantity,
      ...(customVoucherAmount && {
        deliveryInfo: {
          customVoucherAmount: String(customVoucherAmount),
        },
      }),
    });
    return data?.data || data;
  },

  getCart: async (): Promise<CartData | null> => {
    try {
      const { data } = await apiClient.get<{ data: CartData }>("/v1/shop/cart");
      return data.data;
    } catch {
      return null;
    }
  },

  createOrder: async (payload: {
    cartItemIds?: string[] | null;
    coinsToRedeem: number;
    useWalletCredits?: boolean;
    walletCreditsToUse?: number;
    couponCode?: string | null;
    allowHybridInrPayment: boolean;
    quantity?: number;
  }) => {
    const { data } = await apiClient.post("/v1/shop/orders", {
      ...payload,
      isSquad: (payload.quantity ?? 1) >= 5,
    });
    return data?.data || data;
  },

  initiatePayment: async (orderId: string) => {
    const { data } = await apiClient.post("/v1/shop/payment/initiate", { orderId });
    return data?.data || data;
  },

  verifyPayment: async (payload: {
    orderId: string;
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
  }) => {
    const { data } = await apiClient.post("/v1/shop/payment/verify", payload);
    return data?.data || data;
  },

  fetchOrders: async (page = 1, pageSize = 20): Promise<{ orders: ShopOrder[]; totalCount: number }> => {
    try {
      const { data } = await apiClient.get(`/v1/shop/orders?page=${page}&pageSize=${pageSize}`);
      const res = data?.data || data;
      return {
        orders: res?.items ?? [],
        totalCount: res?.totalCount ?? 0,
      };
    } catch {
      return { orders: [], totalCount: 0 };
    }
  },

  getOrder: async (id: string): Promise<ShopOrder | null> => {
    try {
      const { data } = await apiClient.get<{ data: ShopOrder }>(`/v1/shop/orders/${id}`);
      return data.data;
    } catch {
      return null;
    }
  },
};
