"use client";

import Link from "next/link";
import { UserIcon } from "./icons";

/** State C — login required overlay (shop_page_analysis.md) */
export function LoginSheet({ onDismiss }: { onDismiss?: () => void }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center">
      <div
        className="w-full max-w-md overflow-hidden rounded-t-[24px] border border-[var(--line)] bg-[#0c0c0c] sm:rounded-[24px]"
        role="dialog"
        aria-labelledby="login-sheet-title"
      >
        <div className="relative px-6 pb-8 pt-10">
          <div
            className="pointer-events-none absolute -left-16 -top-16 h-48 w-48 rounded-full opacity-40 blur-3xl"
            style={{ background: "radial-gradient(circle, #fe8321, transparent 70%)" }}
          />
          <div
            className="pointer-events-none absolute -right-10 top-8 h-36 w-36 rounded-full opacity-30 blur-3xl"
            style={{ background: "radial-gradient(circle, #ff973c, transparent 70%)" }}
          />

          <div className="relative">
            <span className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--surface)]">
              <UserIcon size={22} className="text-[var(--flame)]" />
            </span>
            <h2 id="login-sheet-title" className="font-heading text-xl font-extrabold text-white">
              Sign in to shop
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
              Log in to browse gift cards, use Arena Coins, and earn cashback on every pack.
            </p>

            <Link
              href="/login"
              className="shop-pill mt-6 flex h-12 w-full items-center justify-center bg-gradient-to-r from-[#ff973c] via-[#fe8321] to-[#ff6a00] text-sm font-bold text-[#0c0c0c] transition hover:brightness-105"
            >
              Get Started
            </Link>

            {onDismiss && (
              <button
                type="button"
                onClick={onDismiss}
                className="mt-3 w-full py-2 text-sm text-[var(--muted)] transition hover:text-white"
              >
                Maybe later
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
