import type { MyCoupon } from "../types/shop.types";

export function formatCouponDiscountLabel(coupon: MyCoupon): string {
  const type = coupon.discountType ?? "percent";
  const value = coupon.discountValue ?? 0;
  if (type === "flat") {
    return `₹${value.toLocaleString("en-IN")} off`;
  }
  return `${Math.round(value)}% off`;
}

export function formatCouponSubtitle(coupon: MyCoupon): string {
  const minOrder = coupon.minOrderValue ?? 0;
  const minOrderText = `Min. order ₹${minOrder.toLocaleString("en-IN")}`;
  if (coupon.maxDiscount != null && coupon.maxDiscount > 0) {
    return `${minOrderText} · Max save ₹${coupon.maxDiscount.toLocaleString("en-IN")}`;
  }
  return minOrderText;
}

export function formatCouponExpiry(validUntil?: string | null): string {
  if (!validUntil) return "";
  const date = new Date(validUntil);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
