import { apiClient } from "@/shared/lib/axios";
import { unwrapData } from "./shop-api-client";

export const shopWalletService = {
  getCoinsBalance: async (): Promise<number> => {
    try {
      const { data } = await apiClient.get("/v1/wallet/balance");
      const balanceData = unwrapData<Record<string, unknown>>(data) ?? data;
      const n =
        balanceData?.balance ??
        balanceData?.coinBalance ??
        balanceData?.coins ??
        balanceData?.walletBalance;
      return typeof n === "number" && Number.isFinite(n) ? n : 0;
    } catch {
      return 0;
    }
  },

  getArenaCreditsBalance: async (): Promise<number> => {
    try {
      const { data } = await apiClient.get("/v1/shop/wallet/balance");
      const balanceData = unwrapData<Record<string, unknown>>(data) ?? data;
      const n = balanceData?.balance ?? balanceData?.walletBalance;
      return typeof n === "number" && Number.isFinite(n) ? n : 0;
    } catch {
      return 0;
    }
  },
};
