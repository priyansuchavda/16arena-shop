import { apiClient } from "@/shared/lib/axios";
import type { CouponValidateResult, MyCoupon } from "../types/shop.types";
import { unwrapData, type ApiEnvelope } from "./shop-api-client";

export const shopCouponsService = {
  getMyCoupons: async (): Promise<MyCoupon[]> => {
    const { data } = await apiClient.get<ApiEnvelope<MyCoupon[]>>("/v1/shop/coupons/mine");
    const coupons = unwrapData<MyCoupon[]>(data);
    return Array.isArray(coupons) ? coupons : [];
  },

  validateCoupon: async (
    code: string,
    options?: { subtotal?: number; cartItemIds?: string[] | null }
  ): Promise<CouponValidateResult> => {
    const { data } = await apiClient.post<ApiEnvelope<CouponValidateResult>>(
      "/v1/shop/coupons/validate",
      {
        code: code.trim(),
        ...(options?.subtotal != null ? { subtotal: options.subtotal } : {}),
        cartItemIds: options?.cartItemIds ?? null,
      }
    );

    const result = unwrapData<CouponValidateResult>(data);
    if (!result) {
      throw new Error(data.message ?? "Coupon validation failed");
    }

    return {
      ...result,
      valid: result.valid === true,
      message: result.message ?? data.message,
      code: result.code ?? code.trim().toUpperCase(),
    };
  },
};
