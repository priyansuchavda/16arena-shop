import { apiClient } from "@/shared/lib/axios";
import type {
  ApiCategory,
  ApiProduct,
  HubbleSsoTokenResponse,
  ShopConfig,
  ShopVisibility,
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
    const { data } = await apiClient.get("/v1/Wallet/balance");
    const balanceData = data?.data || data;
    const n =
      balanceData?.balance ??
      balanceData?.coinBalance ??
      balanceData?.coins ??
      balanceData?.walletBalance;
    return typeof n === "number" && Number.isFinite(n) ? n : 0;
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
};
