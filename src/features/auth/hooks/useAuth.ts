import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { authApi } from "../services/auth.service";
import { useAuthStore } from "../store/auth.store";
import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { auth, googleProvider } from "@/shared/lib/firebase";

export const useGoogleLogin = () => {
  const setAuth = useAuthStore((state) => state.setAuth);

  return useMutation({
    mutationFn: async (fcmToken?: string) => {
      console.log("Starting Google Sign-In popup...");
      const userCredential = await signInWithPopup(auth, googleProvider);
      console.log("Firebase popup authentication succeeded. User:", userCredential.user);

      const credential = GoogleAuthProvider.credentialFromResult(userCredential);
      const idToken = credential?.idToken;

      if (!idToken) {
        throw new Error("Failed to retrieve Google ID token from credential");
      }
      console.log("Retrieved Google ID token successfully. Sending to backend...");

      const response = await authApi.googleLogin(idToken, fcmToken);
      console.log("Backend response received:", response);
      return response;
    },
    onSuccess: (response) => {
      const data = response.data || response;
      console.log("Handling successful login data:", data);
      if (data.accessToken) {
        setAuth(data.user || {}, data.accessToken, data.refreshToken);
        console.log("Set auth state succeeded.");
      } else {
        console.error("No accessToken found in the login response:", data);
      }
    },
    onError: (error: any) => {
      console.error("Google Sign-In Mutation failed:", error);
      if (error.response) {
        console.error("Backend error response:", error.response.status, error.response.data);
      }
    },
  });
};

export const useRequestOtp = () => {
  return useMutation({
    mutationFn: (phone: string) => authApi.requestPhoneOtp(phone),
  });
};

export const useRequestEmailOtp = () => {
  return useMutation({
    mutationFn: (email: string) => authApi.requestEmailOtp(email),
  });
};

export const useVerifyOtp = () => {
  const setAuth = useAuthStore((state) => state.setAuth);

  return useMutation({
    mutationFn: ({
      otpToken,
      otp,
      fcmToken,
    }: {
      otpToken: string;
      otp: string;
      fcmToken?: string;
    }) => authApi.verifyOtp(otpToken, otp, fcmToken),
    onSuccess: (response) => {
      const data = response.data || response;
      if (data.accessToken) {
        setAuth(data.user || {}, data.accessToken, data.refreshToken);
      }
    },
  });
};

export const useProfile = (enabled = true) => {
  return useQuery({
    queryKey: ["auth", "profile"],
    queryFn: authApi.getProfile,
    enabled,
  });
};

export const useLogout = () => {
  const logoutState = useAuthStore((state) => state.logout);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: authApi.logout,
    onSettled: () => {
      logoutState();
      queryClient.clear();
    },
  });
};

export const useUserSummary = (enabled = true) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const queryResult = useQuery({
    queryKey: ["auth", "userSummary"],
    queryFn: authApi.fetchUserSummary,
    enabled: isAuthenticated && enabled,
  });

  if (!isAuthenticated) {
    return { ...queryResult, data: undefined };
  }
  return queryResult;
};
