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

const PRODUCTION_API_ORIGIN = "https://api.16arena.com";

/**
 * REST client base URL resolver.
 *
 * Browser: `/api` on localhost:3000 — Next.js rewrites to NEXT_PUBLIC_API_BASE_URL
 * (see next.config.ts). Required so HttpOnly refresh-token cookies work.
 *
 * Server: direct backend URL from env. Relative `/api` is invalid for Node/axios
 * during SSR and static generation, so we fall back to the production origin.
 */
export function getApiBaseUrl(): string {
  if (typeof window !== "undefined") {
    return "/api";
  }

  const serverUrl = getApiServerUrl();
  if (serverUrl) {
    return `${serverUrl}/api`;
  }

  return `${PRODUCTION_API_ORIGIN}/api`;
}
