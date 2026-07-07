import { MetadataRoute } from "next";
import { shopApi } from "@/features/shop";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SHOP_WEB_URL || "https://shop.16arena.com";

  const routes = [
    "",
    "/cart",
    "/checkout",
    "/login",
    "/register",
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: "daily" as const,
    priority: route === "" ? 1.0 : 0.8,
  }));

  try {
    const products = await shopApi.fetchProducts(undefined, 1, 150);
    const productRoutes = products.map((p) => ({
      url: `${baseUrl}/shop/${p.slug}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }));

    const categories = await shopApi.fetchCategories();
    const categoryRoutes = categories.map((c) => ({
      url: `${baseUrl}/shop/${c.slug}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.6,
    }));

    return [...routes, ...productRoutes, ...categoryRoutes];
  } catch {
    return routes;
  }
}
