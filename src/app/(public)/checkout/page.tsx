import { Suspense } from "react";
import { CheckoutShell } from "@/features/checkout";

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[var(--void)] text-white">
          Loading checkout…
        </div>
      }
    >
      <CheckoutShell />
    </Suspense>
  );
}
