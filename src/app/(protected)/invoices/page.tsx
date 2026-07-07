import { Suspense } from "react";
import { InvoicesShell } from "@/features/invoices";

export default function InvoicesPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[var(--void)] text-white">
          Loading…
        </div>
      }
    >
      <InvoicesShell />
    </Suspense>
  );
}
