import { apiClient } from "@/shared/lib/axios";

export const userApi = {
  uploadAvatar: async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);

    const { data } = await apiClient.post("/v1/media/upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return data;
  },

  uploadMedia: async (file: File, folderName: string) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("folderName", folderName);

    const { data } = await apiClient.post("/v1/media/upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return data;
  },

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  updateProfile: async (payload: any) => {
    const { data } = await apiClient.put("/v1/auth/profile", payload);
    return data;
  },

  checkUsernameAvailability: async (username: string) => {
    try {
      const { data } = await apiClient.put("/v1/auth/profile", {
        username,
        userName: username,
      });
      return { available: true, data };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      const message = error?.response?.data?.message || error?.message || "";
      const isTaken =
        message.toLowerCase().includes("username") ||
        message.toLowerCase().includes("already taken") ||
        message.toLowerCase().includes("taken");
      if (isTaken) {
        return { available: false, message: "That username is already taken." };
      }
      throw error;
    }
  },

  requestEmailOtp: async (email: string) => {
    const { data } = await apiClient.post("/v1/auth/profile/email/request-otp", { email });
    return data?.data || data;
  },

  verifyEmailOtp: async (payload: { otpToken: string; otp: string }) => {
    const { data } = await apiClient.post("/v1/auth/profile/email/verify-otp", payload);
    return data?.data || data;
  },

  requestPhoneOtp: async (payload: { phoneNumber: string; countryCode: string }) => {
    const { data } = await apiClient.post("/v1/auth/profile/phone/request-otp", payload);
    return data?.data || data;
  },

  verifyPhoneOtp: async (payload: { otpToken: string; otp: string }) => {
    const { data } = await apiClient.post("/v1/auth/profile/phone/verify-otp", payload);
    return data?.data || data;
  },

  getPlayerProfile: async (userId: string) => {
    const { data } = await apiClient.get(`/v1/auth/player-profile/${userId}`);
    return data?.data || data;
  },
};
