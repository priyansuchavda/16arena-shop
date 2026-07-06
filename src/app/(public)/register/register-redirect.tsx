"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAuthStore } from "@/features/auth";

export function RegisterRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const openRegisterModal = useAuthStore((state) => state.openRegisterModal);

  useEffect(() => {
    const returnUrl = searchParams.get("returnUrl") || "/shop";
    openRegisterModal(returnUrl);
    router.replace(returnUrl);
  }, [openRegisterModal, router, searchParams]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--void)]">
      <Loader2 className="w-8 h-8 text-[var(--flame)] animate-spin" />
    </div>
  );
}
