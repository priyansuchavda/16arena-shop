import { Store } from "lucide-react";

/** State A — loading / redirection (shop_page_analysis.md) */
export function ShopLoading() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
      <div
        className="h-10 w-10 animate-spin rounded-full border-[3px] border-[var(--flame)]/25 border-t-[var(--flame)]"
        role="status"
        aria-label="Loading shop"
      />
      <p className="text-sm text-[var(--muted)]">Opening gift card store…</p>
    </div>
  );
}

/** State B — shop disabled globally */
export function ShopUnavailable() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-5 px-6 text-center">
      <div className="flex h-[140px] w-[140px] items-center justify-center rounded-3xl bg-[var(--surface)]">
        <Store size={80} strokeWidth={1.2} className="text-[var(--flame)]" />
      </div>
      <p className="font-heading max-w-sm text-base text-white">
        Shop is currently unavailable. Please try again later.
      </p>
    </div>
  );
}
