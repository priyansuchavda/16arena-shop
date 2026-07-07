import { apiClient } from "@/shared/lib/axios";
import type { OrderInvoice, ShopOrder } from "../types/shop.types";
import { assertEnvelopeSuccess, type ApiEnvelope, unwrapData } from "./shop-api-client";
import { mapOrder, mapOrderInvoiceFromOrder } from "./shop-mappers";

export const shopOrdersService = {
  getOrder: async (id: string, config?: any): Promise<ShopOrder | null> => {
    try {
      const { data } = await apiClient.get<ApiEnvelope<unknown>>(`/v1/shop/orders/${id}`, config);
      return mapOrder(data);
    } catch {
      return null;
    }
  },

  getOrders: async (page = 1, pageSize = 20): Promise<{ orders: ShopOrder[]; totalCount: number }> => {
    try {
      const { data } = await apiClient.get(`/v1/shop/orders?page=${page}&pageSize=${pageSize}`);
      const res = unwrapData<{
        items?: unknown[];
        totalCount?: number;
      }>(data);
      const items = Array.isArray(res?.items) ? res.items : [];
      return {
        orders: items
          .map((item) => mapOrder(item))
          .filter((order): order is ShopOrder => order != null),
        totalCount: res?.totalCount ?? 0,
      };
    } catch {
      return { orders: [], totalCount: 0 };
    }
  },

  cancelOrder: async (orderId: string) => {
    const { data } = await apiClient.post<ApiEnvelope<unknown>>(
      `/v1/shop/orders/${orderId}/cancel`
    );
    if (data.success === false) {
      throw new Error(data.message ?? "Failed to cancel order");
    }
    return unwrapData(data);
  },

  fetchOrderInvoice: async (orderId: string): Promise<OrderInvoice | null> => {
    try {
      const { data } = await apiClient.get<ApiEnvelope<OrderInvoice>>(
        `/v1/shop/orders/${orderId}/invoice`
      );
      const invoice = unwrapData<OrderInvoice>(data);
      if (invoice) return invoice;
      const order = await shopOrdersService.getOrder(orderId);
      return order ? mapOrderInvoiceFromOrder(order) : null;
    } catch {
      return null;
    }
  },
};
