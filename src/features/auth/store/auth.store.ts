import { create } from "zustand";
import type { AuthState } from "../types/auth.types";

export const useAuthStore = create<AuthState>()((set, get) => ({
  user: null,
  accessToken: null,
  isAuthenticated: false,
  _sessionInitialized: false,
  isAuthModalOpen: false,
  openAuthModal: () => set({ isAuthModalOpen: true }),
  closeAuthModal: () => set({ isAuthModalOpen: false }),
  isRegisterModalOpen: false,
  registerReturnUrl: "/shop",
  openRegisterModal: (returnUrl = "/shop") =>
    set({ isRegisterModalOpen: true, registerReturnUrl: returnUrl }),
  closeRegisterModal: () => set({ isRegisterModalOpen: false }),
  setAuth: (user, accessToken) => {
    set({
      user,
      accessToken,
      isAuthenticated: Boolean(user && accessToken),
    });
  },
  setAccessToken: (accessToken) => {
    const { user } = get();
    set({
      accessToken,
      isAuthenticated: Boolean(user && accessToken),
    });
  },
  setUser: (user) => {
    const { accessToken } = get();
    set({
      user,
      isAuthenticated: Boolean(user && accessToken),
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
