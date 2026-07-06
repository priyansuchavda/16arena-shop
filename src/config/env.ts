/**
 * Application environment configuration.
 */
export const env = {
  SHOP_API_BASE: process.env.NEXT_PUBLIC_SHOP_API_BASE ?? "http://192.168.29.71:5006",
} as const;
