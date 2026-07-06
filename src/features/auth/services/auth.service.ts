import { apiClient } from "@/shared/lib/axios";

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

  verifyOtp: async (otpToken: string, otp: string, fcmToken?: string) => {
    const { data } = await apiClient.post("/v1/auth/verify-otp", {
      otpToken,
      otp,
      deviceId: "web-browser",
      deviceInfo: typeof navigator !== "undefined" ? navigator.userAgent : "NodeJS Server",
      ...(fcmToken && { fcmToken }),
    });
    return data;
  },

  getProfile: async () => {
    const { data } = await apiClient.get("/v1/auth/profile");
    return data;
  },

  googleLogin: async (idToken: string, fcmToken?: string) => {
    const { data } = await apiClient.post("/v1/auth/oauth", {
      provider: "google",
      token: idToken,
      deviceId: "web-browser",
      deviceInfo: JSON.stringify({
        platform: "web",
        userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "NodeJS Server",
      }),
      ...(fcmToken && { fcmToken }),
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "",
    });
    return data;
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
};
