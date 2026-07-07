import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";
import { useAuthStore } from "@/features/auth/store/auth.store";
import { getApiBaseUrl } from "@/shared/lib/api-config";
import {
  enqueueAccessTokenRefresh,
  isAuthFlowRequest,
} from "@/shared/lib/auth-session";

type RetryableAxiosRequestConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
};

export const apiClient = axios.create({
  baseURL: getApiBaseUrl(),
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.request.use((config) => {
  const { accessToken } = useAuthStore.getState();
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetryableAxiosRequestConfig | undefined;
    const status = error.response?.status;
    const requestUrl = originalRequest?.url || "";

    if (!originalRequest || status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    if (isAuthFlowRequest(requestUrl)) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      const accessToken = await enqueueAccessTokenRefresh();
      useAuthStore.getState().setAccessToken(accessToken);
      originalRequest.headers.Authorization = `Bearer ${accessToken}`;
      return apiClient(originalRequest);
    } catch (refreshError) {
      useAuthStore.getState().logout();

      if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
        const returnUrl = encodeURIComponent(
          `${window.location.pathname}${window.location.search}`
        );
        window.location.href = `/login?returnUrl=${returnUrl}`;
      }

      return Promise.reject(refreshError);
    }
  }
);
