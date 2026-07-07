import axios from "axios";
import { applyAccessToken } from "@/shared/lib/auth-token";
import { getApiBaseUrl } from "@/shared/lib/api-config";

const LEGACY_AUTH_STORAGE_KEY = "auth-storage";
const LEGACY_ACCESS_TOKEN_COOKIE = "accessToken";

type RefreshQueueEntry = {
  resolve: (accessToken: string) => void;
  reject: (error: unknown) => void;
};

const refreshClient = axios.create({
  baseURL: getApiBaseUrl(),
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

let refreshPromise: Promise<string> | null = null;
let refreshQueue: RefreshQueueEntry[] = [];

function flushRefreshQueue(error: unknown | null, accessToken?: string) {
  const queue = refreshQueue;
  refreshQueue = [];

  for (const entry of queue) {
    if (error || !accessToken) {
      entry.reject(error ?? new Error("Token refresh failed"));
      continue;
    }
    entry.resolve(accessToken);
  }
}

function extractAccessToken(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") return null;

  const root = payload as Record<string, unknown>;
  const nested = root.data;

  if (typeof root.accessToken === "string" && root.accessToken.length > 0) {
    return root.accessToken;
  }

  if (nested && typeof nested === "object") {
    const data = nested as Record<string, unknown>;
    if (typeof data.accessToken === "string" && data.accessToken.length > 0) {
      return data.accessToken;
    }
  }

  return null;
}

export function isAuthFlowRequest(url = ""): boolean {
  return (
    url.includes("/v1/auth/phone-login") ||
    url.includes("/v1/auth/email-login") ||
    url.includes("/v1/auth/password-login") ||
    url.includes("/v1/auth/verify-otp") ||
    url.includes("/v1/auth/oauth") ||
    url.includes("/v1/auth/refresh-token")
  );
}

export async function refreshAccessToken(): Promise<string> {
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = refreshClient
    .post("/v1/auth/refresh-token")
    .then((response) => {
      const accessToken = extractAccessToken(response.data);
      if (!accessToken) {
        throw new Error("Refresh response did not include an access token");
      }
      applyAccessToken(accessToken);
      flushRefreshQueue(null, accessToken);
      return accessToken;
    })
    .catch((error) => {
      flushRefreshQueue(error);
      throw error;
    })
    .finally(() => {
      refreshPromise = null;
    });

  return refreshPromise;
}

export function enqueueAccessTokenRefresh(): Promise<string> {
  if (refreshPromise) {
    return new Promise<string>((resolve, reject) => {
      refreshQueue.push({ resolve, reject });
    });
  }

  return refreshAccessToken();
}

export function clearLegacyAuthStorage() {
  if (typeof window === "undefined") return;

  localStorage.removeItem(LEGACY_AUTH_STORAGE_KEY);
  document.cookie = `${LEGACY_ACCESS_TOKEN_COOKIE}=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT; SameSite=Lax; Secure`;
}
