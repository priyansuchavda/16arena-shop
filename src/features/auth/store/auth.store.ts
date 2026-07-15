import { create } from "zustand";
import type { AuthState } from "../types/auth.types";

function hasValidAccessToken(accessToken: string | null): boolean {
  return typeof accessToken === "string" && accessToken.length > 0;
}

export const useAuthStore = create<AuthState>()((set, get) => ({
  user: null,
  accessToken: null,
  isAuthenticated: false,
  _sessionInitialized: false,
  isAuthModalOpen: false,
  openAuthModal: () => set({ isAuthModalOpen: true }),
  closeAuthModal: () => set({ isAuthModalOpen: false }),
  isRegisterModalOpen: false,
  registerReturnUrl: "/",
  registerMessage: "",
  openRegisterModal: (returnUrl = "/", message = "") =>
    set({ isRegisterModalOpen: true, registerReturnUrl: returnUrl, registerMessage: message }),
  closeRegisterModal: () => set({ isRegisterModalOpen: false, registerMessage: "" }),
  setAuth: (user, accessToken) => {
    set({
      user,
      accessToken,
      isAuthenticated: hasValidAccessToken(accessToken),
    });
  },
  setAccessToken: (accessToken) => {
    set({
      accessToken,
      isAuthenticated: hasValidAccessToken(accessToken),
    });
  },
  setUser: (user) => {
    const { accessToken } = get();
    set({
      user,
      isAuthenticated: hasValidAccessToken(accessToken),
    });
  },
  logout: () => {
    set({
      user: null,
      accessToken: null,
      isAuthenticated: false,
    });
  },
  setSessionInitialized: (initialized) => set({ _sessionInitialized: initialized }),
}));
