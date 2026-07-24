"use client";

// import { shopApi } from "../api";

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

/** Payment via Easebuzz checkout — disabled until launch. */
export async function openEasebuzzCheckout(_params: {
  orderId: string;
  payment: Record<string, unknown>;
}): Promise<void> {
  throw new Error("Online payment is coming soon.");
}

/** Payment via Easebuzz checkout — disabled until launch. */
export async function initiateAndOpenEasebuzz(_params: {
  orderId: string;
  productName?: string;
  contact?: string;
  email?: string;
}): Promise<void> {
  throw new Error("Online payment is coming soon.");
}

// Payment via Easebuzz checkout — disabled until launch
//
// declare global {
//   interface Window {
//     // eslint-disable-next-line @typescript-eslint/no-explicit-any
//     EasebuzzCheckout?: any;
//   }
// }
//
// export function loadEasebuzzScript(): Promise<boolean> {
//   return new Promise((resolve) => {
//     if (window.EasebuzzCheckout) {
//       resolve(true);
//       return;
//     }
//     const existing = document.getElementById("easebuzz-script");
//     if (existing) {
//       if (window.EasebuzzCheckout) {
//         resolve(true);
//       } else {
//         existing.addEventListener("load", () => resolve(true));
//         existing.addEventListener("error", () => resolve(false));
//       }
//       return;
//     }
//     const script = document.createElement("script");
//     script.id = "easebuzz-script";
//     script.src = "https://ebz-static.s3.ap-south-1.amazonaws.com/easecheckout/v2.0.0/easebuzz-checkout-v2.min.js";
//     script.async = true;
//     script.onload = () => resolve(true);
//     script.onerror = () => resolve(false);
//     document.body.appendChild(script);
//   });
// }
//
// type InitiatePaymentResult = {
//   orderId: string;
//   orderNumber?: string;
//   gatewayOrderId?: string;
//   amount: number;
//   currency?: string;
//   accessKey?: string;
//   merchantKey?: string;
//   environment?: string;
//   isExistingGatewaySession?: boolean;
//   paymentExpiresAt?: string;
// };
//
// export async function openEasebuzzCheckout(params: {
//   orderId: string;
//   payment: InitiatePaymentResult;
// }): Promise<void> {
//   const { payment } = params;
//
//   if (!payment.accessKey || !payment.merchantKey) {
//     throw new Error("Easebuzz is not configured on the server.");
//   }
//
//   const scriptLoaded = await loadEasebuzzScript();
//   if (!scriptLoaded) {
//     throw new Error("Failed to load Easebuzz payment SDK.");
//   }
//
//   return new Promise<void>((resolve, reject) => {
//     const env = (payment.environment || "test").toLowerCase();
//     const payMode = env === "prod" || env === "production" || env === "live" ? "prod" : "test";
//
//     const EasebuzzCtor = window.EasebuzzCheckout;
//     if (!EasebuzzCtor) {
//       reject(new Error("Easebuzz SDK unavailable."));
//       return;
//     }
//
//     const checkout = new EasebuzzCtor(payment.merchantKey, payMode);
//
//     checkout.initiatePayment({
//       access_key: payment.accessKey,
//       // eslint-disable-next-line @typescript-eslint/no-explicit-any
//       onResponse: async (response: any) => {
//         const paymentResponse = response?.payment_response || response || {};
//         const result = response?.result || "";
//
//         if (result === "user_cancelled" || result === "back_pressed") {
//           reject(new PaymentCancelledError(PAYMENT_CANCELLED_MESSAGE));
//           return;
//         }
//
//         if (result === "payment_failed" || paymentResponse?.status === "failed") {
//           reject(new Error("Payment failed. Please try again."));
//           return;
//         }
//
//         if (result === "txn_session_timeout" || result === "invalid_input_data") {
//           reject(new Error("Payment session expired or is invalid. Please try again."));
//           return;
//         }
//
//         const verifyPayload = {
//           orderId: payment.orderId,
//           txnId: paymentResponse?.txnid || "",
//           easebuzzId: paymentResponse?.easebuzz_id || paymentResponse?.easepayid || null,
//           status: paymentResponse?.status || "",
//           amount: paymentResponse?.amount != null ? String(paymentResponse.amount) : "",
//           hash: paymentResponse?.hash || "",
//           productInfo: paymentResponse?.productinfo || null,
//           firstName: paymentResponse?.firstname || null,
//           email: paymentResponse?.email || null,
//           key: paymentResponse?.key || null,
//           udf1: paymentResponse?.udf1 || null,
//           udf2: paymentResponse?.udf2 || null,
//           udf3: paymentResponse?.udf3 || null,
//           udf4: paymentResponse?.udf4 || null,
//           udf5: paymentResponse?.udf5 || null,
//         };
//
//         try {
//           await shopApi.verifyPayment(verifyPayload);
//           resolve();
//         } catch (verifyErr) {
//           reject(verifyErr);
//         }
//       },
//       theme: "#111827",
//     });
//   });
// }
//
// export async function initiateAndOpenEasebuzz(params: {
//   orderId: string;
//   productName?: string;
//   contact?: string;
//   email?: string;
// }): Promise<void> {
//   const payment = await shopApi.initiatePayment(params.orderId);
//   await openEasebuzzCheckout({
//     orderId: params.orderId,
//     payment,
//   });
// }
