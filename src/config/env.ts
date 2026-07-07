/**
 * Application environment configuration.
 */
export const env = {
  SHOP_API_BASE: process.env.NEXT_PUBLIC_SHOP_API_BASE ?? "http://192.168.29.71:5006",
  /** Same as mobile `Environment.invoiceWebUrl` — where /?id= invoice pages are served */
  INVOICE_WEB_URL:
    process.env.NEXT_PUBLIC_INVOICE_WEB_URL ?? "http://192.168.29.221:3000",
} as const;
