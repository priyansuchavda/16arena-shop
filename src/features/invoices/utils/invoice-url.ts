import { env } from "@/config/env";
import { getApiServerUrl } from "@/shared/lib/api-config";

/**
 * Public invoice page URL — matches mobile `invoice_web_view_page.dart`:
 * `${Environment.invoiceWebUrl}/?id=${orderId}`
 */
export function buildInvoicePageUrl(
  orderId: string,
  options?: { token?: string | null; chrome?: boolean }
): string {
  const base = env.INVOICE_WEB_URL.replace(/\/+$/, "");
  if (!base || !orderId) return "";

  const params = new URLSearchParams({ id: orderId });
  if (options?.token) params.set("token", options.token);
  if (options?.chrome) params.set("chrome", "1");

  return `${base}/?${params.toString()}`;
}

/**
 * Backend invoice document URL loaded inside the WebView iframe.
 */
export function buildInvoiceDocumentUrl(orderId: string, token?: string | null): string {
  const base = getApiServerUrl();
  if (!base || !orderId) return "";

  const params = new URLSearchParams({ id: orderId });
  if (token) params.set("token", token);

  return `${base}/api/v1/shop/orders/${encodeURIComponent(orderId)}/invoice?${params.toString()}`;
}

/** @deprecated Use buildInvoicePageUrl — kept for share helper alias */
export function buildInvoiceShareUrl(orderId: string): string {
  return buildInvoicePageUrl(orderId);
}

export function isOnInvoiceWebHost(): boolean {
  if (typeof window === "undefined") return true;
  try {
    const target = new URL(env.INVOICE_WEB_URL);
    return window.location.origin === target.origin;
  } catch {
    return true;
  }
}
