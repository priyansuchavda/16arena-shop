import { env } from "@/config/env";
import type {
  HubbleSsoTokenResponse,
  ShopConfig,
  ShopVisibility,
} from "../types/shop.types";

export const SHOP_API_BASE = env.SHOP_API_BASE;

export async function getData<T>(path: string): Promise<T> {
  const res = await fetch(`${SHOP_API_BASE}${path}`, {
    cache: "no-store",
    signal: AbortSignal.timeout(4000),
  });
  if (!res.ok) throw new Error(`${path} → ${res.status}`);
  const json = (await res.json()) as { data: T };
  return json.data;
}

export async function fetchWalletBalance(): Promise<number> {
  const data = await getData<{
    balance?: number;
    coinBalance?: number;
    coins?: number;
    walletBalance?: number;
    data?: { balance?: number; coins?: number };
  }>("/api/v1/Wallet/balance");
  const n =
    data?.balance ??
    data?.coinBalance ??
    data?.coins ??
    data?.walletBalance ??
    data?.data?.balance ??
    data?.data?.coins;
  return typeof n === "number" && Number.isFinite(n) ? n : 0;
}

export async function fetchShopConfig(): Promise<ShopConfig> {
  return getData<ShopConfig>("/api/v1/shop-config");
}

export async function fetchHubbleSsoToken(): Promise<HubbleSsoTokenResponse> {
  return getData<HubbleSsoTokenResponse>("/api/v1/hubble/sso-token");
}

export async function checkShopVisibility(): Promise<ShopVisibility> {
  try {
    const res = await fetch(
      `${SHOP_API_BASE}/api/v1/MobileSection/getAllSections?page=shop&type=shop`,
      { cache: "no-store", signal: AbortSignal.timeout(4000) },
    );
    if (!res.ok) return { visible: true };
    const json = (await res.json()) as { data?: unknown[] };
    const sections = json.data ?? [];
    return { visible: sections.length > 0 };
  } catch {
    return { visible: true };
  }
}
