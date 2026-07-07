"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";

export function CheckoutShell() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");

  useEffect(() => {
    if (orderId) {
      router.replace(`/shop/orders/${orderId}/success`);
      return;
    }
    router.replace("/cart");
  }, [orderId, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--void)] text-white">
      <div className="text-center">
        <Loader2 className="mx-auto mb-3 h-8 w-8 animate-spin text-[var(--flame)]" />
        <p className="text-sm text-[var(--muted)]">Redirecting to checkout…</p>
      </div>
    </div>
  );
}
