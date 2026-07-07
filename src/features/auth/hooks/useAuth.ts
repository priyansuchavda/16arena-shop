import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { authApi } from "../services/auth.service";
import { useAuthStore } from "../store/auth.store";
import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { auth, googleProvider } from "@/shared/lib/firebase";

export const useGoogleLogin = () => {
  const setAuth = useAuthStore((state) => state.setAuth);

  return useMutation({
    mutationFn: async (fcmToken?: string) => {
      const userCredential = await signInWithPopup(auth, googleProvider);
      const credential = GoogleAuthProvider.credentialFromResult(userCredential);
      const idToken = credential?.idToken;

      if (!idToken) {
        throw new Error("Failed to retrieve Google ID token from credential");
      }

      return authApi.googleLogin(idToken, fcmToken);
    },
    onSuccess: (response) => {
      const session = authApi.parseSessionResponse(response);
      if (session) {
        setAuth(session.user, session.accessToken);
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
      const session = authApi.parseSessionResponse(response);
      if (session) {
        setAuth(session.user, session.accessToken);
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
