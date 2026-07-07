"use client";

import { useEffect } from "react";
import { useAuthStore, AuthCard } from "@/features/auth";

type AuthModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const openRegisterModal = useAuthStore((state) => state.openRegisterModal);

  // Prevent body scroll when modal is open
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

  const handleSuccess = (isProfileComplete: boolean) => {
    if (!isProfileComplete) {
      openRegisterModal("/shop");
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/75 backdrop-blur-[4px] p-4 transition-all duration-300">
      {/* Click outside to close */}
      <div className="absolute inset-0" onClick={onClose} />

      <AuthCard
        onSuccess={handleSuccess}
        onClose={onClose}
        showCloseButton={true}
      />
    </div>
  );
}
