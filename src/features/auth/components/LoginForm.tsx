"use client";

import React, { useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthStore } from "../store/auth.store";
import { AuthCard } from "./auth-card";

export const LoginForm = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const openRegisterModal = useAuthStore((state) => state.openRegisterModal);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const sessionInitialized = useAuthStore((state) => state._sessionInitialized);
  const user = useAuthStore((state) => state.user);

  const returnUrl = searchParams.get("returnUrl") || "/";

  const handleSuccess = (isProfileComplete: boolean) => {
    if (!isProfileComplete) {
      openRegisterModal(returnUrl);
    }
    router.replace(returnUrl);
  };

  // Mobile Google sign-in lands back here via a full-page redirect (no button
  // click to hang a success callback off), so pick up the completed session
  // once AuthInitializer has finished processing the redirect result.
  const handledRedirectRef = useRef(false);
  useEffect(() => {
    if (handledRedirectRef.current) return;
    if (!sessionInitialized || !isAuthenticated) return;
    handledRedirectRef.current = true;
    const isProfileComplete = !!user?.displayName;
    if (!isProfileComplete) {
      openRegisterModal(returnUrl);
    }
    router.replace(returnUrl);
  }, [sessionInitialized, isAuthenticated, user, returnUrl, openRegisterModal, router]);

  return (
    <AuthCard
      onSuccess={handleSuccess}
      showCloseButton={true}
      onClose={() => router.push("/")}
    />
  );
};
