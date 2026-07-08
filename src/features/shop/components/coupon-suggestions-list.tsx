"use client";

import { Fragment } from "react";
import { Loader2, Tag as TagIcon } from "lucide-react";
import type { MyCoupon } from "../types/shop.types";
import {
  formatCouponDiscountLabel,
  formatCouponExpiry,
  formatCouponSubtitle,
} from "../utils/coupon.utils";

type CouponSuggestionsListProps = {
  coupons: MyCoupon[];
  loading: boolean;
  error?: string | null;
  onSelect: (code: string) => void;
  onClose: () => void;
};

export function CouponSuggestionsList({
  coupons,
  loading,
  error,
  onSelect,
  onClose,
}: CouponSuggestionsListProps) {
  return (
    <div
      className="absolute left-0 right-0 top-[calc(100%+6px)] z-50 overflow-hidden rounded-[20px] border border-white/10 bg-[#2C2C2C] shadow-2xl animate-in fade-in slide-in-from-top-1 duration-150"
      role="listbox"
      aria-label="Your coupons"
    >
      <div className="flex items-center justify-between border-b border-white/5 px-3 py-2">
        <span className="text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--muted)]">
          Your coupons
        </span>
        <button
          type="button"
          onClick={onClose}
          onMouseDown={(e) => e.preventDefault()}
          className="text-[10px] font-bold text-white/40 hover:text-white transition"
        >
          Close
        </button>
      </div>

      <div className="max-h-[240px] overflow-y-auto flex flex-col">
        {loading && (
          <div className="flex items-center justify-center gap-2 py-6 text-xs text-white/50">
            <Loader2 className="h-4 w-4 animate-spin text-[var(--flame)]" />
            Loading coupons…
          </div>
        )}

        {!loading && error && (
          <p className="px-2 py-4 text-center text-xs font-semibold text-red-400">{error}</p>
        )}

        {!loading && !error && coupons.length === 0 && (
          <p className="px-2 py-4 text-center text-xs text-white/40">
            No coupons available right now.
          </p>
        )}

        {!loading &&
          !error &&
          coupons.map((coupon, index) => {
            const expiry = formatCouponExpiry(coupon.validUntil);
            return (
              <Fragment key={coupon.code}>
                {index > 0 && <div className="border-b border-white/5" />}
                <button
                  type="button"
                  role="option"
                  onClick={() => onSelect(coupon.code)}
                  className="flex w-full items-start gap-3 px-4 py-3 text-left transition hover:bg-white/[0.02]"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/[0.04]">
                    <TagIcon className="h-4 w-4 text-[var(--flame)]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="truncate text-xs font-extrabold text-white">{coupon.code}</p>
                      <span className="shrink-0 text-[11px] font-bold text-[var(--win)]">
                        {formatCouponDiscountLabel(coupon)}
                      </span>
                    </div>
                    <p className="mt-0.5 text-[10px] text-white/50">{formatCouponSubtitle(coupon)}</p>
                    {expiry && (
                      <p className="mt-0.5 text-[10px] text-white/35">Valid till {expiry}</p>
                    )}
                  </div>
                </button>
              </Fragment>
            );
          })}
      </div>
    </div>
  );
}
