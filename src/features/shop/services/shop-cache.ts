import { unstable_cache } from "next/cache";
import { shopApi } from "../api";
import type { ApiProduct, ShopProductDetail } from "../types/shop.types";

export const getCachedCategories = unstable_cache(
  async () => shopApi.fetchCategories(),
  ["shop-categories-list"],
  {
    revalidate: 300, // 5 minutes cache
    tags: ["categories"],
  }
);

// Map to store unstable_cache generated functions for products to ensure they are created only once per parameter set
const productsCacheMap = new Map<string, () => Promise<ApiProduct[]>>();

export const getCachedProducts = (categoryId?: string, page = 1, pageSize = 150) => {
  const cacheKey = `${categoryId || "all"}-${page}-${pageSize}`;
  if (!productsCacheMap.has(cacheKey)) {
    const cachedFn = unstable_cache(
      async () => shopApi.fetchProducts(categoryId, page, pageSize),
      ["shop-products-list", categoryId || "all", String(page), String(pageSize)],
      {
        revalidate: 300,
        tags: ["products"],
      }
    );
    productsCacheMap.set(cacheKey, cachedFn);
  }
  return productsCacheMap.get(cacheKey)!();
};

export const getCachedFeaturedProducts = unstable_cache(
  async () => shopApi.fetchFeaturedProducts(),
  ["shop-featured-products"],
  {
    revalidate: 300,
    tags: ["products", "featured-products"],
  }
);

export const getCachedShopSections = unstable_cache(
  async () => shopApi.fetchShopSections(),
  ["shop-sections"],
  {
    revalidate: 300,
    tags: ["sections"],
  }
);

export const getCachedShopVisibility = unstable_cache(
  async () => shopApi.checkShopVisibility(),
  ["shop-visibility"],
  {
    revalidate: 300,
    tags: ["visibility"],
  }
);

// Map to store unstable_cache generated functions for product details to ensure they are created only once per slug
const productDetailCacheMap = new Map<string, () => Promise<ShopProductDetail | null>>();

export const getCachedProductDetail = (slug: string) => {
  if (!productDetailCacheMap.has(slug)) {
    const cachedFn = unstable_cache(
      async () => shopApi.fetchProductDetail(slug),
      ["shop-product-detail", slug],
      {
        revalidate: 300,
        tags: ["products", `product-${slug}`],
      }
    );
    productDetailCacheMap.set(slug, cachedFn);
  }
  return productDetailCacheMap.get(slug)!();
};
