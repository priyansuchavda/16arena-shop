import { getRedirectResult, GoogleAuthProvider } from "firebase/auth";
import { apiClient } from "@/shared/lib/axios";
import { refreshAccessToken } from "@/shared/lib/auth-session";
import { applyAccessToken } from "@/shared/lib/auth-token";
import { auth } from "@/shared/lib/firebase";
import type { UserProfile } from "../types/auth.types";

function unwrapData<T>(payload: unknown): T {
  if (!payload || typeof payload !== "object") {
    return payload as T;
  }

  const root = payload as Record<string, unknown>;
  if ("data" in root && root.data !== undefined) {
    return root.data as T;
  }

  return payload as T;
}

function normalizeUser(user: unknown): UserProfile {
  if (!user || typeof user !== "object") {
    return {};
  }

  const profile = user as UserProfile;
  return {
    ...profile,
    id: profile.id ?? profile.userId ?? profile.uid,
    uid: profile.uid ?? profile.userId ?? profile.id,
    userId: profile.userId ?? profile.id ?? profile.uid,
    avatarUrl: profile.avatarUrl ?? profile.image ?? profile.photoURL ?? null,
    photoURL: profile.photoURL ?? profile.image ?? profile.avatarUrl ?? null,
  };
}

function parseSessionResponse(response: unknown) {
  const session = unwrapData<{
    accessToken?: string;
    user?: UserProfile;
  }>(response);

  if (!session?.accessToken) {
    return null;
  }

  return {
    accessToken: session.accessToken,
    user: normalizeUser(session.user),
  };
}

function persistSessionFromResponse(response: unknown): void {
  const session = parseSessionResponse(response);
  if (session?.accessToken) {
    applyAccessToken(session.accessToken);
  }
}

export const authApi = {
  requestPhoneOtp: async (phone: string, countryCode: string = "+91") => {
    const { data } = await apiClient.post("/v1/auth/phone-login", {
      phoneNumber: phone,
      countryCode,
    });
    return data;
  },

  requestEmailOtp: async (email: string) => {
    const { data } = await apiClient.post("/v1/auth/email-login", {
      email,
    });
    return data;
  },

  verifyOtp: async (otpToken: string, otp: string) => {
    const { data } = await apiClient.post("/v1/auth/verify-otp", {
      otpToken,
      otp,
      deviceId: "web-browser",
      deviceInfo: typeof navigator !== "undefined" ? navigator.userAgent : "NodeJS Server",
    });
    persistSessionFromResponse(data);
    return data;
  },

  refreshSession: async () => {
    const accessToken = await refreshAccessToken();
    return { accessToken };
  },

  getProfile: async () => {
    const { data } = await apiClient.get("/v1/auth/profile");
    return data;
  },

  googleLogin: async (idToken: string) => {
    const { data } = await apiClient.post("/v1/auth/oauth", {
      provider: "google",
      token: idToken,
      deviceId: "web-browser",
      deviceInfo: JSON.stringify({
        platform: "web",
        userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "NodeJS Server",
      }),
    });
    persistSessionFromResponse(data);
    return data;
  },

  // Completes the signInWithRedirect flow (mobile Google sign-in) after the
  // browser navigates back. Returns null if there was no pending redirect.
  consumeGoogleRedirectResult: async () => {
    const userCredential = await getRedirectResult(auth);
    if (!userCredential) return null;

    const credential = GoogleAuthProvider.credentialFromResult(userCredential);
    const idToken = credential?.idToken;
    if (!idToken) return null;

    return authApi.googleLogin(idToken);
  },

  logout: async () => {
    const { data } = await apiClient.post("/v1/auth/logout");
    return data;
  },

  fetchUserSummary: async () => {
    const { data } = await apiClient.get("/v1/client-home/user-summary");
    const result = data?.data || data;
    return {
      ...result,
      arenaCoins:
        result?.walletBalance?.arenaCoins ??
        result?.walletBalance?.balance ??
        result?.arenaCoins ??
        0,
      displayName:
        result?.userProfile?.displayName ||
        result?.userProfile?.name ||
        result?.displayName ||
        "",
      avatarUrl: result?.userProfile?.image || result?.avatarUrl || null,
    };
  },

  applyReferral: async (referralCode: string) => {
    const { data } = await apiClient.post("/v1/auth/apply-referral", {
      referralCode,
    });
    return data;
  },

  parseSessionResponse,

  parseProfileResponse: (response: unknown) => {
    const profile = unwrapData<UserProfile | { user?: UserProfile }>(response);
    if (profile && typeof profile === "object" && "user" in profile) {
      return normalizeUser(profile.user);
    }
    return normalizeUser(profile);
  },
};
