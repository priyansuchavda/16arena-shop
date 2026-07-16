"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/features/auth";
import { RegisterForm } from "@/features/auth/components/RegisterForm";

export function RegisterModal() {
  const isOpen = useAuthStore((state) => state.isRegisterModalOpen);
  const closeRegisterModal = useAuthStore((state) => state.closeRegisterModal);
  const returnUrl = useAuthStore((state) => state.registerReturnUrl);
  const registerMessage = useAuthStore((state) => state.registerMessage);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center overflow-y-auto bg-black/75 backdrop-blur-[4px] p-3 sm:p-4 transition-all duration-300">
      <div className="absolute inset-0" aria-hidden />
      <div className="relative w-full max-w-[420px] my-auto">
        <RegisterForm returnUrl={returnUrl} onClose={closeRegisterModal} initialError={registerMessage} />
      </div>
    </div>
  );
}
