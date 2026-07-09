import type { StaticGiftCard } from "../types";

export type TimePeriodFilter =
  | "all"
  | "this_month"
  | "last_month"
  | "last_3_months"
  | "this_year";

export type GiftCardStatusFilter = "active" | "expired";

export type GiftCardFilters = {
  timePeriod: TimePeriodFilter;
  categories: string[];
  searchQuery: string;
  status: GiftCardStatusFilter;
};

export const DEFAULT_GIFT_CARD_FILTERS: GiftCardFilters = {
  timePeriod: "all",
  categories: [],
  searchQuery: "",
  status: "active",
};

export const STATUS_OPTIONS: { value: GiftCardStatusFilter; label: string }[] = [
  { value: "active", label: "Active" },
  { value: "expired", label: "Used/Expired" },
];

export const TIME_PERIOD_OPTIONS: { value: TimePeriodFilter; label: string }[] = [
  { value: "all", label: "All time" },
  { value: "this_month", label: "This month" },
  { value: "last_month", label: "Last month" },
  { value: "last_3_months", label: "Last 3 months" },
  { value: "this_year", label: "This year" },
];

export function timePeriodLabel(period: TimePeriodFilter): string {
  return TIME_PERIOD_OPTIONS.find((o) => o.value === period)?.label ?? "All time";
}

export function statusLabel(status: GiftCardStatusFilter): string {
  return STATUS_OPTIONS.find((o) => o.value === status)?.label ?? "Active";
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function endOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
}

export function isInTimePeriod(date: Date, period: TimePeriodFilter): boolean {
  if (period === "all") return true;

  const now = new Date();

  switch (period) {
    case "this_month":
      return date >= startOfMonth(now) && date <= endOfMonth(now);
    case "last_month": {
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      return date >= startOfMonth(lastMonth) && date <= endOfMonth(lastMonth);
    }
    case "last_3_months": {
      const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
      return date >= threeMonthsAgo && date <= now;
    }
    case "this_year":
      return date.getFullYear() === now.getFullYear();
    default:
      return true;
  }
}

export function countActiveFilters(filters: GiftCardFilters): number {
  let count = 0;
  if (filters.status !== "active") count += 1;
  if (filters.timePeriod !== "all") count += 1;
  if (filters.categories.length > 0) count += 1;
  return count;
}

export function filterGiftCards(cards: StaticGiftCard[], filters: GiftCardFilters): StaticGiftCard[] {
  const query = filters.searchQuery.trim().toLowerCase();

  return cards.filter((card) => {
    if (card.status !== filters.status) {
      return false;
    }

    if (filters.timePeriod !== "all") {
      const purchasedAt = new Date(card.purchasedAtIso);
      if (Number.isNaN(purchasedAt.getTime()) || !isInTimePeriod(purchasedAt, filters.timePeriod)) {
        return false;
      }
    }

    if (filters.categories.length > 0 && !filters.categories.includes(card.title)) {
      return false;
    }

    if (query) {
      const haystack = [
        card.title,
        card.skuLabel ?? "",
        card.orderId,
        String(card.amount),
      ]
        .join(" ")
        .toLowerCase();

      if (!haystack.includes(query)) return false;
    }

    return true;
  });
}
