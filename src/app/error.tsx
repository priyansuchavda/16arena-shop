"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Unhandled runtime error:", error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--void)] p-6 text-center text-white">
      <AlertTriangle className="mb-4 h-12 w-12 text-[var(--flame)] animate-bounce" />
      <h1 className="font-heading text-2xl font-black">Something went wrong</h1>
      <p className="mt-2 max-w-sm text-xs text-[var(--muted)]">
        An unexpected error occurred. Our engineers have been notified.
      </p>
      <div className="mt-8 flex gap-4">
        <button
          type="button"
          onClick={() => reset()}
          className="rounded-xl bg-white/5 border border-white/10 px-5 py-2.5 text-xs font-bold hover:bg-white/10 transition active:scale-95"
        >
          Try Again
        </button>
        <Link
          href="/"
          className="rounded-xl bg-gradient-to-r from-[#ff973c] to-[#ff6a00] px-5 py-2.5 text-xs font-bold text-black hover:opacity-95 transition active:scale-95"
        >
          Return to Shop
        </Link>
      </div>
    </div>
  );
}
