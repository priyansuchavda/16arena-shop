"use client";

import React, { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "../store/auth.store";
import { Loader2 } from "lucide-react";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, _sessionInitialized } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (_sessionInitialized && !isAuthenticated) {
      router.replace(`/login?returnUrl=${encodeURIComponent(pathname)}`);
    }
  }, [_sessionInitialized, isAuthenticated, router, pathname]);

  if (!_sessionInitialized || !isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[var(--void)]">
        <Loader2 className="w-8 h-8 text-[var(--flame)] animate-spin" />
      </div>
    );
  }

  return <>{children}</>;
}
