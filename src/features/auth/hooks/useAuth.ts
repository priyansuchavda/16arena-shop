import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { authApi } from "../services/auth.service";
import { useAuthStore } from "../store/auth.store";
import { signInWithPopup, signInWithRedirect, GoogleAuthProvider } from "firebase/auth";
import { auth, googleProvider } from "@/shared/lib/firebase";
import { isMobileAuthDevice } from "../utils/device";

// Mobile browsers (iOS Safari especially, plus most in-app/Android WebViews)
// block or silently drop signInWithPopup — Firebase's own guidance is to use
// the redirect flow there. Desktop keeps the popup so the page never navigates.
export const useGoogleLogin = () => {
  const setAuth = useAuthStore((state) => state.setAuth);

  return useMutation({
    mutationFn: async () => {
      if (isMobileAuthDevice()) {
        await signInWithRedirect(auth, googleProvider);
        // Browser navigates away here; result is handled by
        // consumeGoogleRedirectResult on the page we land back on.
        return null;
      }

      const userCredential = await signInWithPopup(auth, googleProvider);
      const credential = GoogleAuthProvider.credentialFromResult(userCredential);
      const idToken = credential?.idToken;

      if (!idToken) {
        throw new Error("Failed to retrieve Google ID token from credential");
      }

      return authApi.googleLogin(idToken);
    },
    onSuccess: (response) => {
      if (!response) return;
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
    }: {
      otpToken: string;
      otp: string;
    }) => authApi.verifyOtp(otpToken, otp),
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
