/**
 * Application routes dictionary.
 */
export const ROUTES = {
  shop: {
    home: "/shop",
    bySlug: (slug: string) => `/shop/${slug}`,
  },
  cart: "/cart",
  checkout: "/checkout",
  orders: "/orders",
  invoices: "/invoices",
} as const;
