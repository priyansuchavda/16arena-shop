import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SHOP_WEB_URL || "https://shop.16arena.com";
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/invoices/", "/orders/", "/verify-otp"],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
