"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { shopApi } from "../api";
import { useAuthStore } from "@/features/auth";

export const useCheckout = () => {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadRazorpayScript = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if ((window as any).Razorpay) {
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
  };

  const handleCheckout = async ({
    skuId,
    quantity,
    coinsToRedeem,
    couponCode,
    customVoucherAmount,
    allowHybridInrPayment,
    productName,
  }: {
    skuId: string;
    quantity: number;
    coinsToRedeem: number;
    couponCode?: string | null;
    customVoucherAmount?: number | null;
    allowHybridInrPayment: boolean;
    productName: string;
  }) => {
    setLoading(true);
    setError(null);

    try {
      // 1. Add item to cart
      await shopApi.addToCart(skuId, quantity, customVoucherAmount);

      // 2. Create order
      const orderRes = await shopApi.createOrder({
        coinsToRedeem,
        couponCode,
        allowHybridInrPayment,
        quantity,
      });

      const order = orderRes?.data || orderRes;
      if (!order || !order.id) {
        throw new Error("Failed to create order. Please try again.");
      }

      const orderId = order.id;
      const totalPaid = order.totalPaid ?? 0;

      // 3. Check if INR payment is required
      if (totalPaid > 0) {
        // Load Razorpay script
        const scriptLoaded = await loadRazorpayScript();
        if (!scriptLoaded) {
          throw new Error("Failed to load Razorpay payment SDK.");
        }

        // Initiate payment gateway order details
        const paymentRes = await shopApi.initiatePayment(orderId);
        const payment = paymentRes?.data || paymentRes;

        if (!payment || !payment.gatewayOrderId) {
          throw new Error("Failed to initiate payment gateway.");
        }

        const options = {
          key: payment.keyId,
          amount: payment.amount,
          currency: "INR",
          name: "16Arena Shop",
          description: productName,
          order_id: payment.gatewayOrderId,
          handler: async function (response: any) {
            try {
              setLoading(true);
              await shopApi.verifyPayment({
                orderId,
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
              });
              router.push(`/shop/orders/${orderId}/success`);
            } catch (err: any) {
              setError(err?.response?.data?.message || "Payment verification failed.");
              setLoading(false);
            }
          },
          prefill: {
            contact: user?.phoneNumber || "",
            email: user?.email || "",
          },
          theme: {
            color: "#fe8321",
          },
          modal: {
            ondismiss: function () {
              setLoading(false);
            },
          },
        };

        const rzp = new (window as any).Razorpay(options);
        rzp.open();
      } else {
        // Fully paid with coins/credits - go directly to Success Page
        router.push(`/shop/orders/${orderId}/success`);
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || "Checkout failed. Please try again.");
      setLoading(false);
    }
  };

  return {
    handleCheckout,
    loading,
    error,
  };
};
