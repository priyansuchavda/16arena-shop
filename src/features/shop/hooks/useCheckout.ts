"use client";

import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { buildCheckoutRequest, shopApi } from "../api";
import { useAuthStore } from "@/features/auth";
import { getApiErrorMessage } from "../services/shop-api-client";
import { confirmCheckoutPreview } from "../utils/confirm-checkout";
import {
  isPaymentCancelledError,
  openEasebuzzCheckout,
  PAYMENT_CANCELLED_MESSAGE,
} from "../utils/easebuzz-checkout";
import {
  clearCheckoutIdempotencyKey,
  getOrCreateCheckoutIdempotencyKey,
  isRetryableCheckoutError,
  resolveCheckoutUserId,
} from "../utils/shopCheckoutIdempotency";
import type { CheckoutRequest } from "../types/shop.types";

export {
  PAYMENT_CANCELLED_MESSAGE,
  PaymentCancelledError,
  isPaymentCancelledError,
} from "../utils/easebuzz-checkout";

export type CheckoutParams = {
  skuId?: string;
  quantity: number;
  coinsToRedeem: number;
  couponCode?: string | null;
  customVoucherAmount?: number | null;
  allowHybridInrPayment: boolean;
  useWalletCredits?: boolean;
  walletCreditsToUse?: number;
  productName: string;
  cartItemIds?: string[] | null;
  isCartCheckout?: boolean;
  deliveryInfo?: Record<string, string>;
  /** Latest preview from payment sheet — used to align hybrid flag before pay */
  previewHint?: import("../types/shop.types").CheckoutPreview | null;
};

async function refreshWalletAndOrders(queryClient: ReturnType<typeof useQueryClient>) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: ["auth", "userSummary"] }),
    queryClient.invalidateQueries({ queryKey: ["shop", "orders"] }),
  ]);
}

export const useCheckout = () => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needsResync, setNeedsResync] = useState(false);
  const [pendingOrderId, setPendingOrderId] = useState<string | null>(null);
  const [pendingProductName, setPendingProductName] = useState<string | null>(null);
  const checkoutInFlightRef = useRef(false);

  const navigateToOrder = useCallback(
    (orderId: string) => {
      setPendingOrderId(null);
      setPendingProductName(null);
      router.push(`/orders/${orderId}`);
    },
    [router]
  );

  const launchEasebuzz = useCallback(
    async (orderId: string) => {
      const payment = await shopApi.initiatePayment(orderId);
      await openEasebuzzCheckout({
        orderId,
        payment,
      });
    },
    []
  );

  const resumePayment = useCallback(
    async (orderId: string, productName: string) => {
      setLoading(true);
      setError(null);
      setPendingOrderId(orderId);
      setPendingProductName(productName);

      try {
        await launchEasebuzz(orderId);
        navigateToOrder(orderId);
      } catch (err) {
        if (isPaymentCancelledError(err)) {
          setError(PAYMENT_CANCELLED_MESSAGE);
        } else {
          setError(getApiErrorMessage(err, "Payment could not be completed. Please try again."));
        }
      } finally {
        setLoading(false);
      }
    },
    [launchEasebuzz, navigateToOrder]
  );

  const cancelPendingOrder = useCallback(
    async (orderId?: string | null) => {
      const id = orderId ?? pendingOrderId;
      if (!id) return;

      setLoading(true);
      try {
        await shopApi.cancelOrder(id);
      } catch (cancelErr) {
        console.error("Failed to cancel order:", cancelErr);
        throw cancelErr;
      } finally {
        const userId = resolveCheckoutUserId(user);
        if (userId) {
          clearCheckoutIdempotencyKey(userId);
        }
        setPendingOrderId(null);
        setPendingProductName(null);
        setError(null);
        setNeedsResync(true);
        setLoading(false);
        await refreshWalletAndOrders(queryClient);
      }
    },
    [pendingOrderId, queryClient, user]
  );

  const handleCheckout = useCallback(
    async (params: CheckoutParams) => {
      // Resume existing payment-initiated order instead of placing again.
      if (pendingOrderId) {
        await resumePayment(pendingOrderId, pendingProductName ?? params.productName);
        return;
      }

      if (checkoutInFlightRef.current) return;

      const userId = resolveCheckoutUserId(user);
      if (!userId) {
        setError("You must be signed in to checkout.");
        return;
      }

      checkoutInFlightRef.current = true;
      setLoading(true);
      setError(null);
      let orderId: string | null = null;
      const idempotencyKey = getOrCreateCheckoutIdempotencyKey(userId);

      try {
        const cartAlreadySynced =
          !needsResync &&
          !params.isCartCheckout &&
          Array.isArray(params.cartItemIds) &&
          params.cartItemIds.length > 0;

        let currentCartItemIds = params.cartItemIds;

        if (!params.isCartCheckout && !cartAlreadySynced) {
          if (!params.skuId) {
            throw new Error("SKU is required for checkout.");
          }
          const cart = await shopApi.addToCart(
            params.skuId,
            params.quantity,
            params.customVoucherAmount,
            params.deliveryInfo
          );
          if (cart && Array.isArray(cart.items)) {
            currentCartItemIds = cart.items.map((item) => item.id).filter(Boolean);
          }
        }

        const previewRequest = buildCheckoutRequest({
          cartItemIds: params.isCartCheckout ? null : currentCartItemIds ?? null,
          coinsToRedeem: params.coinsToRedeem,
          useWalletCredits: params.useWalletCredits,
          walletCreditsToUse: params.walletCreditsToUse,
          couponCode: params.couponCode,
          allowHybridInrPayment: params.allowHybridInrPayment,
          quantity: params.quantity,
          idempotencyKey,
        });

        const { request: confirmedRequest, preview: finalPreview } =
          await confirmCheckoutPreview(previewRequest, params.previewHint);

        const checkoutRequest: CheckoutRequest = {
          ...confirmedRequest,
          idempotencyKey,
        };

        const createdOrder = await shopApi.placeOrder(checkoutRequest);

        orderId = createdOrder.id;
        if (!orderId) {
          throw new Error("Failed to create order. Please try again.");
        }

        clearCheckoutIdempotencyKey(userId);

        setPendingOrderId(orderId);
        setPendingProductName(params.productName);

        const totalPaid = createdOrder.totalPaid ?? finalPreview.totalPayable ?? 0;

        if (totalPaid > 0) {
          await launchEasebuzz(orderId);
        }

        navigateToOrder(orderId);
      } catch (err) {
        if (orderId) {
          setPendingOrderId(orderId);
          setPendingProductName(params.productName);
          setNeedsResync(true);
          if (isPaymentCancelledError(err)) {
            setError(PAYMENT_CANCELLED_MESSAGE);
          } else {
            setError(getApiErrorMessage(err, "Checkout failed. Please try again."));
          }
          return;
        }
        if (!isRetryableCheckoutError(err)) {
          clearCheckoutIdempotencyKey(userId);
        }
        setError(getApiErrorMessage(err, "Checkout failed. Please try again."));
      } finally {
        checkoutInFlightRef.current = false;
        setLoading(false);
      }
    },
    [
      launchEasebuzz,
      navigateToOrder,
      needsResync,
      pendingOrderId,
      pendingProductName,
      resumePayment,
      user,
    ]
  );

  return {
    handleCheckout,
    resumePayment,
    cancelPendingOrder,
    loading,
    error,
    setError,
    pendingOrderId,
    pendingProductName,
  };
};
