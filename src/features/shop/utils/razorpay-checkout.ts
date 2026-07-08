"use client";

import { shopApi } from "../api";

export const PAYMENT_CANCELLED_MESSAGE = "Payment cancelled. No charge.";

export class PaymentCancelledError extends Error {
  constructor(message = PAYMENT_CANCELLED_MESSAGE) {
    super(message);
    this.name = "PaymentCancelledError";
  }
}

export function isPaymentCancelledError(err: unknown): boolean {
  return (
    err instanceof PaymentCancelledError ||
    (err instanceof Error && err.message === PAYMENT_CANCELLED_MESSAGE)
  );
}

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => {
      open: () => void;
      on: (event: string, handler: (response: unknown) => void) => void;
    };
  }
}

export function loadRazorpayScript(): Promise<boolean> {
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

type InitiatePaymentResult = {
  gatewayOrderId: string;
  amount: number;
  currency?: string;
  orderNumber?: string;
  razorpayKeyId?: string;
  keyId?: string;
};

export async function openRazorpayCheckout(params: {
  orderId: string;
  payment: InitiatePaymentResult;
  productName: string;
  contact?: string;
  email?: string;
}): Promise<void> {
  const { orderId, payment, productName, contact = "", email = "" } = params;
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
      prefill: { contact, email },
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
          reject(new PaymentCancelledError(PAYMENT_CANCELLED_MESSAGE));
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
        new Error(
          failed?.error?.description ??
            "Payment was not completed. You can retry without creating a new order."
        )
      );
    });
    rzp.open();
  });
}

export async function initiateAndOpenRazorpay(params: {
  orderId: string;
  productName: string;
  contact?: string;
  email?: string;
}): Promise<void> {
  const payment = await shopApi.initiatePayment(params.orderId);
  await openRazorpayCheckout({
    orderId: params.orderId,
    payment,
    productName: params.productName,
    contact: params.contact,
    email: params.email,
  });
}
