"use client";

import React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthStore } from "../store/auth.store";
import { AuthCard } from "./auth-card";

export const LoginForm = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const openRegisterModal = useAuthStore((state) => state.openRegisterModal);
  
  const returnUrl = searchParams.get("returnUrl") || "/";

  const handleSuccess = (isProfileComplete: boolean) => {
    if (!isProfileComplete) {
      openRegisterModal(returnUrl);
    }
    router.replace(returnUrl);
  };

  return (
    <AuthCard
      onSuccess={handleSuccess}
      showCloseButton={true}
      onClose={() => router.push("/")}
    />
  );
};
