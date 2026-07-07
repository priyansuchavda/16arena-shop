import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AuthState } from "../types/auth.types";

function setCookie(name: string, value: string, days = 7) {
  if (typeof document === "undefined") return;
  let expires = "";
  if (days) {
    const date = new Date();
    date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
    expires = "; expires=" + date.toUTCString();
  }
  document.cookie = `${name}=${value || ""}${expires}; path=/; SameSite=Lax; Secure`;
}

function clearCookie(name: string) {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT; SameSite=Lax; Secure`;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      _hasHydrated: false,
      isAuthModalOpen: false,
      openAuthModal: () => set({ isAuthModalOpen: true }),
      closeAuthModal: () => set({ isAuthModalOpen: false }),
      isRegisterModalOpen: false,
      registerReturnUrl: "/shop",
      openRegisterModal: (returnUrl = "/shop") =>
        set({ isRegisterModalOpen: true, registerReturnUrl: returnUrl }),
      closeRegisterModal: () => set({ isRegisterModalOpen: false }),
      setAuth: (user, accessToken, refreshToken) => {
        if (accessToken) {
          setCookie("accessToken", accessToken, 7);
        } else {
          clearCookie("accessToken");
        }
        set({
          user,
          accessToken,
          refreshToken: refreshToken || null,
          isAuthenticated: !!user && !!accessToken,
        });
      },
      setUser: (user) => set({ user }),
      logout: () => {
        clearCookie("accessToken");
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
        });
      },
      setHasHydrated: (v) => set({ _hasHydrated: v }),
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
