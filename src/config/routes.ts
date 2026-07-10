/**
 * Application routes dictionary.
 */
export const ROUTES = {
  shop: {
    home: "/",
    bySlug: (slug: string) => `/${slug}`,
  },
  cart: "/cart",
  checkout: "/checkout",
  orders: "/orders",
  invoices: "/invoices",
} as const;
