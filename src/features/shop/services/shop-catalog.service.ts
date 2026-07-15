import { apiClient } from "@/shared/lib/axios";
import type {
  ApiCategory,
  ApiProduct,
  HubbleSsoTokenResponse,
  MobileSection,
  ShopConfig,
  ShopProductDetail,
  ShopVisibility,
  MobileBanner,
} from "../types/shop.types";
import { normalizeShopProductDetail } from "../utils/normalize-product";
import { type ApiEnvelope, unwrapData } from "./shop-api-client";

export const shopCatalogService = {
  fetchCategories: async (): Promise<ApiCategory[]> => {
    const { data } = await apiClient.get<{ data: ApiCategory[] }>("/v1/shop/categories");
    return data.data;
  },

  fetchProducts: async (categoryId?: string, page = 1, pageSize = 20): Promise<ApiProduct[]> => {
    const path = categoryId
      ? `/v1/shop/products?categoryId=${categoryId}&page=${page}&pageSize=${pageSize}`
      : `/v1/shop/products?page=${page}&pageSize=${pageSize}`;
    const { data } = await apiClient.get<{ data: { items: ApiProduct[] } }>(path);
    const items = data.data?.items ?? (data.data as unknown as ApiProduct[]);
    return Array.isArray(items) ? items : [];
  },

  fetchProductsPaginated: async (
    categoryId?: string,
    featured?: boolean,
    page = 1,
    pageSize = 20
  ): Promise<{
    items: ApiProduct[];
    totalPages: number;
    page: number;
    totalCount: number;
    categoryBannerUrl?: string | null;
  }> => {
    let path = `/v1/shop/products?page=${page}&pageSize=${pageSize}`;
    if (categoryId) path += `&categoryId=${categoryId}`;
    if (featured !== undefined) path += `&featured=${featured}`;
    const { data } = await apiClient.get<{
      data: {
        items: ApiProduct[];
        totalPages?: number;
        page?: number;
        totalCount?: number;
      };
    }>(path);
    const items = data.data?.items ?? (data.data as unknown as ApiProduct[]);
    const totalPages = data.data?.totalPages ?? 1;
    const currentPage = data.data?.page ?? page;
    const totalCount = data.data?.totalCount ?? (Array.isArray(items) ? items.length : 0);
    // categoryBannerUrl is per-item in the API response — grab it from the first item
    const categoryBannerUrl = Array.isArray(items) && items.length > 0
      ? (items[0].categoryBannerUrl ?? null)
      : null;
    return {
      items: Array.isArray(items) ? items : [],
      totalPages,
      page: currentPage,
      totalCount,
      categoryBannerUrl,
    };
  },

  getProductBySlug: async (slug: string): Promise<ApiProduct | null> => {
    try {
      const { data } = await apiClient.get<{ data: ApiProduct }>(`/v1/shop/products/${slug}`);
      return data.data;
    } catch {
      return null;
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

  searchProducts: async (q: string, page = 1, pageSize = 20): Promise<ApiProduct[]> => {
    if (q.trim().length < 1) return [];
    const { data } = await apiClient.get<{ data: { items?: ApiProduct[] } }>(
      `/v1/shop/products/search?q=${encodeURIComponent(q)}&page=${page}&pageSize=${pageSize}`
    );
    const items = data.data?.items ?? unwrapData<ApiProduct[]>(data);
    return Array.isArray(items) ? items : [];
  },

  fetchFeaturedProducts: async (): Promise<ApiProduct[]> => {
    const { data } = await apiClient.get<{ data: ApiProduct[] }>("/v1/shop/products/featured");
    return data.data;
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

  fetchMobileBanners: async (): Promise<MobileBanner[]> => {
    try {
      const { data } = await apiClient.get<{ data: MobileBanner[] }>(
        "/v1/MobileBanner/getAllBanners"
      );
      return data.data ?? [];
    } catch {
      return [];
    }
  },
};
