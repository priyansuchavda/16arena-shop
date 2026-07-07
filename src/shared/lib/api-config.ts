/**
 * Server origin URL resolver.
 */
export function getApiServerUrl(): string {
  const raw = (
    process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_SHOP_API_BASE
  )?.trim();
  if (!raw) return "";
  return raw.replace(/\/+$/, "").replace(/\/api$/, "");
}

/**
 * REST client base URL resolver.
 * Browser uses same-origin `/api` so HttpOnly refresh cookies work via Next rewrites.
 * Server-side calls use the configured API host directly.
 */
export function getApiBaseUrl(): string {
  if (typeof window !== "undefined") {
    return "/api";
  }

  const serverUrl = getApiServerUrl();
  return serverUrl ? `${serverUrl}/api` : "/api";
}
