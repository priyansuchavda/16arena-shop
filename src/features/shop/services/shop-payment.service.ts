import { apiClient } from "@/shared/lib/axios";
import { assertEnvelopeSuccess, type ApiEnvelope } from "./shop-api-client";

export const shopPaymentService = {
  initiatePayment: async (orderId: string) => {
    const { data } = await apiClient.post<
      ApiEnvelope<{
        orderId: string;
        orderNumber?: string;
        gatewayOrderId: string;
        amount: number;
        currency?: string;
        razorpayKeyId?: string;
        keyId?: string;
      }>
    >("/v1/shop/payment/initiate", { orderId });

    const payment = assertEnvelopeSuccess(data, "Payment initiation failed");
    if (!payment.gatewayOrderId) {
      throw new Error("Payment gateway order id missing.");
    }
    return payment;
  },

  verifyPayment: async (payload: {
    orderId: string;
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
  }) => {
    const { data } = await apiClient.post<ApiEnvelope<unknown>>(
      "/v1/shop/payment/verify",
      payload
    );
    if (data.success === false) {
      throw new Error(data.message ?? "Payment verification failed");
    }
    return data;
  },
};
