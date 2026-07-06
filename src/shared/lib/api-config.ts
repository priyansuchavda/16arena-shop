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
 */
export function getApiBaseUrl(): string {
  const serverUrl = getApiServerUrl();
  return serverUrl ? `${serverUrl}/api` : "/api";
}
