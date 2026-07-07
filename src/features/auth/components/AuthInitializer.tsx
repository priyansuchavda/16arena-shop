"use client";

import { useEffect } from "react";
import { authApi } from "../services/auth.service";
import { useAuthStore } from "../store/auth.store";
import { clearLegacyAuthStorage } from "@/shared/lib/auth-session";

export function AuthInitializer() {
  const setAuth = useAuthStore((state) => state.setAuth);
  const setSessionInitialized = useAuthStore((state) => state.setSessionInitialized);

  useEffect(() => {
    let cancelled = false;

    async function restoreSession() {
      clearLegacyAuthStorage();

      try {
        const { accessToken } = await authApi.refreshSession();
        if (cancelled || !accessToken) return;

        try {
          const profileResponse = await authApi.getProfile();
          if (cancelled) return;

          const user = authApi.parseProfileResponse(profileResponse);
          setAuth(user, accessToken);
        } catch {
          if (!cancelled) {
            setAuth({}, accessToken);
          }
        }
      } catch {
        if (!cancelled) {
          useAuthStore.getState().logout();
        }
      } finally {
        if (!cancelled) {
          setSessionInitialized(true);
        }
      }
    }

    void restoreSession();

    return () => {
      cancelled = true;
    };
  }, [setAuth, setSessionInitialized]);

  return null;
}
