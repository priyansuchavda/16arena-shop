import Link from "next/link";
import { ArrowLeft, ShoppingBag } from "lucide-react";
import { buttonVariants } from "@/shared/components/ui/button";

export function CartShell() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--void)] p-6 text-center">
      <div className="relative mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-white/5 border border-white/10">
        <ShoppingBag className="h-10 w-10 text-[var(--flame)]" />
        <span className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-[var(--flame)] text-xs font-bold text-white">
          0
        </span>
      </div>
      <h1 className="font-heading text-2xl font-bold tracking-tight text-white sm:text-3xl">
        Your Cart is Empty
      </h1>
      <p className="mt-2 max-w-md text-sm text-[var(--faint)]">
        Looks like you haven&apos;t added any digital cards or vouchers to your cart yet. Explore our collection to find the best gaming top-ups and gift cards!
      </p>
      <div className="mt-8 flex flex-col gap-4 sm:flex-row">
        <Link
          href="/shop"
          className={buttonVariants({
            className: "bg-[var(--flame)] hover:bg-[var(--flame)]/90 text-white font-medium px-6 py-6 h-auto rounded-xl flex items-center justify-center"
          })}
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Return to Shop
        </Link>
      </div>
    </div>
  );
}
