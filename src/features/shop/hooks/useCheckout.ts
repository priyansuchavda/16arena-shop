"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { buildCheckoutRequest, shopApi } from "../api";
import { useAuthStore } from "@/features/auth";
import { getApiErrorMessage } from "../services/shop-api-client";
import { confirmCheckoutPreview } from "../utils/confirm-checkout";

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

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => {
      open: () => void;
      on: (event: string, handler: (response: unknown) => void) => void;
    };
  }
}

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export const useCheckout = () => {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needsResync, setNeedsResync] = useState(false);

  const navigateToSuccess = useCallback(
    (orderId: string) => {
      router.push(`/shop/orders/${orderId}/success`);
    },
    [router]
  );

  const openRazorpayCheckout = useCallback(
    async ({
      orderId,
      payment,
      productName,
    }: {
      orderId: string;
      payment: {
        gatewayOrderId: string;
        amount: number;
        currency?: string;
        orderNumber?: string;
        razorpayKeyId?: string;
        keyId?: string;
      };
      productName: string;
    }) => {
      const razorpayKeyId = payment.razorpayKeyId ?? payment.keyId;
      if (!razorpayKeyId) {
        throw new Error("Razorpay is not configured on the server.");
      }
      if (!payment.gatewayOrderId) {
        throw new Error("Payment gateway order id missing.");
      }

      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        throw new Error("Failed to load Razorpay payment SDK.");
      }

      return new Promise<void>((resolve, reject) => {
        const options: Record<string, unknown> = {
          key: razorpayKeyId,
          amount: Math.round(payment.amount * 100),
          currency: payment.currency ?? "INR",
          order_id: payment.gatewayOrderId,
          name: "16Arena Shop",
          description: payment.orderNumber ?? productName,
          prefill: {
            contact: user?.phoneNumber ?? "",
            email: user?.email ?? "",
          },
          theme: { color: "#fe8321" },
          handler: async (response: {
            razorpay_order_id: string;
            razorpay_payment_id: string;
            razorpay_signature: string;
          }) => {
            try {
              await shopApi.verifyPayment({
                orderId,
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
              });
              resolve();
            } catch (verifyErr) {
              reject(verifyErr);
            }
          },
          modal: {
            ondismiss: () => {
              reject(new Error("Payment cancelled."));
            },
          },
        };

        const RazorpayCtor = window.Razorpay;
        if (!RazorpayCtor) {
          reject(new Error("Razorpay SDK unavailable."));
          return;
        }

        const rzp = new RazorpayCtor(options);
        rzp.on("payment.failed", (response: unknown) => {
          const failed = response as { error?: { description?: string } };
          reject(
            new Error(failed?.error?.description ?? "Payment failed. Please try again.")
          );
        });
        rzp.open();
      });
    },
    [user]
  );

  const handleCheckout = useCallback(
    async (params: CheckoutParams) => {
      setLoading(true);
      setError(null);
      let orderId: string | null = null;

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

        let checkoutRequest = buildCheckoutRequest({
          cartItemIds: params.isCartCheckout ? null : currentCartItemIds ?? null,
          coinsToRedeem: params.coinsToRedeem,
          useWalletCredits: params.useWalletCredits,
          walletCreditsToUse: params.walletCreditsToUse,
          couponCode: params.couponCode,
          allowHybridInrPayment: params.allowHybridInrPayment,
          quantity: params.quantity,
        });

        const { request: confirmedRequest, preview: finalPreview } =
          await confirmCheckoutPreview(checkoutRequest, params.previewHint);
        checkoutRequest = confirmedRequest;

        const createdOrder = await shopApi.placeOrder(checkoutRequest);

        orderId = createdOrder.id;
        if (!orderId) {
          throw new Error("Failed to create order. Please try again.");
        }

        const totalPaid = createdOrder.totalPaid ?? finalPreview.totalPayable ?? 0;

        if (totalPaid > 0) {
          const payment = await shopApi.initiatePayment(orderId);
          await openRazorpayCheckout({
            orderId,
            payment,
            productName: params.productName,
          });
        }

        navigateToSuccess(orderId);
      } catch (err) {
        if (orderId) {
          setNeedsResync(true);
          try {
            await shopApi.cancelOrder(orderId);
          } catch (cancelErr) {
            console.error("Failed to cancel order after payment error:", cancelErr);
          }
        }
        setError(getApiErrorMessage(err, "Checkout failed. Please try again."));
      } finally {
        setLoading(false);
      }
    },
    [navigateToSuccess, openRazorpayCheckout, needsResync]
  );

  return {
    handleCheckout,
    loading,
    error,
    setError,
  };
};
