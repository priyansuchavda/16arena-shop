import Link from "next/link";
import { ArrowLeft, CreditCard } from "lucide-react";
import { buttonVariants } from "@/shared/components/ui/button";

export function CheckoutShell() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--void)] p-6 text-center">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-white/5 border border-white/10">
        <CreditCard className="h-10 w-10 text-[var(--flame)]" />
      </div>
      <h1 className="font-heading text-2xl font-bold tracking-tight text-white sm:text-3xl">
        Checkout
      </h1>
      <p className="mt-2 max-w-md text-sm text-[var(--faint)]">
        Secure digital payment processing. Please add items to your cart first to proceed to checkout.
      </p>
      <div className="mt-8">
        <Link
          href="/shop"
          className={buttonVariants({
            className: "bg-[var(--flame)] hover:bg-[var(--flame)]/90 text-white font-medium px-6 py-6 h-auto rounded-xl flex items-center justify-center"
          })}
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Go to Shop
        </Link>
      </div>
    </div>
  );
}
