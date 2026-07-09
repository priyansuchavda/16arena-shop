"use client";

import { useMemo, useState, useEffect } from "react";
import { Search, SlidersHorizontal, X, CheckCircle2, Clock, Loader2, CreditCard, Wallet } from "lucide-react";
import { ShopAccountShell } from "@/features/shop/components/shop-account-shell";
import { GiftCardRow } from "./gift-card-row";
import { GiftCardsFilterSheet } from "./gift-cards-filter-sheet";
import { shopApi } from "@/features/shop";
import type { ShopOrder } from "@/features/shop/types/shop.types";
import type { StaticGiftCard } from "../types";
import {
  countActiveFilters,
  DEFAULT_GIFT_CARD_FILTERS,
  filterGiftCards,
  timePeriodLabel,
  type GiftCardFilters,
} from "../utils/gift-card-filters";

export function GiftCardsShell() {
  const [orders, setOrders] = useState<ShopOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"active" | "expired">("active");
  const [filters, setFilters] = useState<GiftCardFilters>(DEFAULT_GIFT_CARD_FILTERS);
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);

  useEffect(() => {
    let active = true;
    async function loadData() {
      try {
        const res = await shopApi.fetchOrders(1, 100);
        if (active) {
          setOrders(res.orders);
        }
      } catch (err) {
        console.error("Failed to load gift cards:", err);
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }
    loadData();
    return () => {
      active = false;
    };
  }, []);

  const formatDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "2-digit",
      });
    } catch {
      return isoString;
    }
  };

  const allGiftCards = useMemo(() => {
    const cards: StaticGiftCard[] = [];

    for (const order of orders) {
      const statusLower = order.status.toLowerCase();
      const isSuccess = ["fulfilled", "completed", "delivered", "success"].includes(statusLower);
      if (!isSuccess) continue;

      for (const item of order.items) {
        let isExpired = false;
        if (item.vouchers && item.vouchers.length > 0) {
          for (const v of item.vouchers) {
            if (v.validTill) {
              try {
                const expiryDate = new Date(v.validTill);
                if (expiryDate.getTime() < Date.now()) {
                  isExpired = true;
                }
              } catch {}
            }
          }
        }

        let cashbackText: string | undefined;
        if (order.coinsDiscount > 0) {
          cashbackText = `Saved ₹${Math.round(order.coinsDiscount)} with Coins`;
        } else if (order.discountAmount > 0) {
          cashbackText = `Saved ₹${Math.round(order.discountAmount)} with Coupon`;
        }

        cards.push({
          id: `${order.id}-${item.id}`,
          title: item.brandName ?? item.productName ?? "Gift Card",
          amount:
            item.faceValue && item.faceValue > 0
              ? item.faceValue
              : item.unitPrice || order.subtotal,
          purchasedAt: formatDate(order.createdAt),
          purchasedAtIso: order.createdAt,
          imageUrl: item.productImageUrl ?? item.brandLogoUrl ?? "/coin_box.png",
          orderId: order.id,
          status: isExpired ? "expired" : "active",
          skuLabel: item.skuLabel ?? `${item.productName}`,
          category: item.skuLabel ? "Voucher" : "UC",
          cashbackText,
        });
      }
    }

    return cards;
  }, [orders]);

  const brandCategories = useMemo(
    () =>
      [...new Set(allGiftCards.map((card) => card.title))].sort((a, b) =>
        a.localeCompare(b)
      ),
    [allGiftCards]
  );

  const filteredGiftCards = useMemo(
    () => filterGiftCards(allGiftCards, filters),
    [allGiftCards, filters]
  );

  const activeCards = filteredGiftCards.filter((card) => card.status === "active");
  const expiredCards = filteredGiftCards.filter((card) => card.status === "expired");
  const displayCards = activeTab === "active" ? activeCards : expiredCards;

  const activeFilterCount = countActiveFilters(filters);

  const clearSheetFilters = () => {
    setFilters((prev) => ({
      ...DEFAULT_GIFT_CARD_FILTERS,
      searchQuery: prev.searchQuery,
    }));
  };

  const removeTimePeriodFilter = () => {
    setFilters((prev) => ({ ...prev, timePeriod: "all" }));
  };

  const removeCategoryFilter = (category: string) => {
    setFilters((prev) => ({
      ...prev,
      categories: prev.categories.filter((c) => c !== category),
    }));
  };

  if (isLoading) {
    return (
      <ShopAccountShell hideSidebar>
        <div className="mx-auto flex w-full max-w-[1000px] flex-col items-center justify-center py-24">
          <Loader2 className="mb-4 h-8 w-8 animate-spin text-[var(--flame)]" />
          <p className="text-sm text-[var(--muted)]">Loading your gift cards…</p>
        </div>
      </ShopAccountShell>
    );
  }

  return (
    <ShopAccountShell hideSidebar>
      <div className="mx-auto w-full max-w-[1000px]">
        <h1 className="font-heading mb-6 text-2xl font-black text-white">My Gift Cards</h1>

        <div className="mb-8 grid grid-cols-1 gap-4 rounded-2xl border border-white/10 bg-black p-5 sm:grid-cols-2">
          <div className="flex items-center gap-4 py-1">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5">
              <CreditCard className="h-5 w-5 text-[var(--flame)]" />
            </div>
            <div>
              <p className="mb-0.5 text-[10px] font-bold uppercase tracking-wider text-white/30">
                Gift cards owned
              </p>
              <p className="text-lg font-black text-white">{activeCards.length}</p>
            </div>
          </div>

          <div className="flex items-center gap-4 py-1 sm:border-l sm:border-white/5 sm:pl-6">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-emerald-500/25 bg-emerald-500/10">
              <Wallet className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <p className="mb-0.5 text-[10px] font-bold uppercase tracking-wider text-white/30">
                Total savings
              </p>
              <p className="text-lg font-black text-emerald-400">
                ₹
                {activeCards
                  .reduce((acc, card) => {
                    if (card.cashbackText) {
                      const match = card.cashbackText.match(/₹(\d+(\.\d+)?)/);
                      if (match) return acc + parseFloat(match[1]);
                    }
                    return acc;
                  }, 0)
                  .toLocaleString("en-IN", {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 2,
                  })}
              </p>
            </div>
          </div>
        </div>

        <div className="mb-4 flex items-center gap-3">
          <label className="flex h-11 min-w-0 flex-1 items-center gap-2.5 rounded-[10px] border border-white/10 bg-[#141414] px-3.5 transition-colors focus-within:border-white/25">
            <Search className="h-4 w-4 shrink-0 text-white/40" />
            <input
              type="search"
              value={filters.searchQuery}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, searchQuery: e.target.value }))
              }
              placeholder="Search orders, brands, amo..."
              className="min-w-0 flex-1 border-none bg-transparent text-sm text-white placeholder:text-white/30"
              style={{ outline: "none", boxShadow: "none" }}
            />
            {filters.searchQuery && (
              <button
                type="button"
                onClick={() => setFilters((prev) => ({ ...prev, searchQuery: "" }))}
                className="shrink-0 rounded-full p-1 text-white/40 transition hover:bg-white/10 hover:text-white"
                aria-label="Clear search"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </label>

          <button
            type="button"
            onClick={() => setFilterSheetOpen(true)}
            className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-[10px] border border-white/10 bg-[#141414] text-white/70 transition hover:border-white/20 hover:text-white"
            aria-label="Open filters"
          >
            <SlidersHorizontal className="h-4 w-4" />
            {activeFilterCount > 0 && (
              <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--flame)] px-1 text-[10px] font-bold text-black">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>

        {activeFilterCount > 0 && (
          <div className="mb-4 flex flex-wrap items-center gap-2">
            {filters.timePeriod !== "all" && (
              <button
                type="button"
                onClick={removeTimePeriodFilter}
                className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white/80 transition hover:bg-white/10"
              >
                {timePeriodLabel(filters.timePeriod)}
                <X className="h-3 w-3 text-white/50" />
              </button>
            )}
            {filters.categories.map((category) => (
              <button
                key={category}
                type="button"
                onClick={() => removeCategoryFilter(category)}
                className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white/80 transition hover:bg-white/10"
              >
                {category}
                <X className="h-3 w-3 text-white/50" />
              </button>
            ))}
            <button
              type="button"
              onClick={clearSheetFilters}
              className="text-xs font-bold text-[var(--flame)] transition hover:opacity-80"
            >
              Clear all
            </button>
          </div>
        )}

        <div className="mb-6 flex items-center gap-3">
          <button
            onClick={() => setActiveTab("active")}
            className={`flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-bold transition focus:outline-none ${
              activeTab === "active"
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                : "border-white/5 bg-white/5 text-white/40 hover:text-white/80"
            }`}
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            Active • {activeCards.length}
          </button>

          <button
            onClick={() => setActiveTab("expired")}
            className={`flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-bold transition focus:outline-none ${
              activeTab === "expired"
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                : "border-white/5 bg-white/5 text-white/40 hover:text-white/80"
            }`}
          >
            <Clock className="h-3.5 w-3.5" />
            Used/Expired • {expiredCards.length}
          </button>
        </div>

        {displayCards.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-black p-12 text-center">
            <p className="text-sm font-semibold text-white/40">
              No gift cards found in this section.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {displayCards.map((card) => (
              <GiftCardRow key={card.id} card={card} />
            ))}
          </div>
        )}
      </div>

      <GiftCardsFilterSheet
        open={filterSheetOpen}
        onClose={() => setFilterSheetOpen(false)}
        categories={brandCategories}
        filters={filters}
        onApply={setFilters}
      />
    </ShopAccountShell>
  );
}
