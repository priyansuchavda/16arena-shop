import { apiClient } from "@/shared/lib/axios";
import { assertEnvelopeSuccess, type ApiEnvelope } from "./shop-api-client";

export const shopPaymentService = {
  initiatePayment: async (orderId: string) => {
    const { data } = await apiClient.post<
      ApiEnvelope<{
        orderId: string;
        orderNumber?: string;
        gatewayOrderId?: string;
        amount: number;
        currency?: string;
        accessKey?: string;
        merchantKey?: string;
        environment?: string;
        isExistingGatewaySession?: boolean;
        paymentExpiresAt?: string;
      }>
    >("/v1/shop/payment/initiate", { orderId });

    const payment = assertEnvelopeSuccess(data, "Payment initiation failed");
    if (!payment.accessKey || !payment.merchantKey) {
      throw new Error("Easebuzz access key or merchant key missing.");
    }
    return payment;
  },

  verifyPayment: async (payload: {
    orderId: string;
    txnId: string;
    easebuzzId?: string | null;
    status: string;
    amount: string;
    hash: string;
    productInfo?: string | null;
    firstName?: string | null;
    email?: string | null;
    key?: string | null;
    udf1?: string | null;
    udf2?: string | null;
    udf3?: string | null;
    udf4?: string | null;
    udf5?: string | null;
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
