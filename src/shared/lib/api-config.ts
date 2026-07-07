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
 *
 * Browser: `/api` on localhost:3000 — Next.js rewrites to NEXT_PUBLIC_SHOP_API_BASE
 * (see next.config.ts). Required so HttpOnly refresh-token cookies work.
 *
 * Server: direct backend URL from env.
 */
export function getApiBaseUrl(): string {
  if (typeof window !== "undefined") {
    return "/api";
  }

  const serverUrl = getApiServerUrl();
  return serverUrl ? `${serverUrl}/api` : "/api";
}
