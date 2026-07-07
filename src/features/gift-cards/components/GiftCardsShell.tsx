"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ShopAccountShell } from "@/features/shop/components/shop-account-shell";
import { STATIC_GIFT_CARDS } from "../data/static-gift-cards";
import { GiftCardRow } from "./gift-card-row";
import { CreditCard, Wallet, CheckCircle2, Clock, Loader2 } from "lucide-react";
import { shopApi } from "@/features/shop";
import type { ShopOrder } from "@/features/shop/types/shop.types";
import type { StaticGiftCard } from "../types";

export function GiftCardsShell() {
  const [orders, setOrders] = useState<ShopOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"active" | "expired">("active");

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

  // Format date helper matching UI mockup (e.g. 7 Jul 26)
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

  // Convert orders to gift cards dynamically
  const dynamicGiftCards: StaticGiftCard[] = [];

  for (const order of orders) {
    const statusLower = order.status.toLowerCase();
    const isSuccess = ["fulfilled", "completed", "delivered", "success"].includes(statusLower);
    
    // Only display successfully completed/fulfilled cards
    if (!isSuccess) continue;

    for (const item of order.items) {
      // Determine if expired based on voucher validity dates
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

      // Determine savings text (coins discount or coupon discount)
      let cashbackText: string | undefined = undefined;
      if (order.coinsDiscount > 0) {
        cashbackText = `Saved ₹${Math.round(order.coinsDiscount)} with Coins`;
      } else if (order.discountAmount > 0) {
        cashbackText = `Saved ₹${Math.round(order.discountAmount)} with Coupon`;
      }

      dynamicGiftCards.push({
        id: `${order.id}-${item.id}`,
        title: item.brandName ?? item.productName ?? "Gift Card",
        amount: item.faceValue && item.faceValue > 0 ? item.faceValue : (item.unitPrice || order.subtotal),
        purchasedAt: formatDate(order.createdAt),
        imageUrl: item.productImageUrl ?? item.brandLogoUrl ?? "/coin_box.png",
        orderId: order.id,
        status: isExpired ? "expired" : "active",
        skuLabel: item.skuLabel ?? `${item.productName}`,
        category: item.skuLabel ? "Voucher" : "UC",
        cashbackText,
      });
    }
  }

  // Fallback to static cards only if the API returns no fulfilled orders (for initial dev / empty db state)
  const giftCardsToRender = dynamicGiftCards.length > 0 ? dynamicGiftCards : STATIC_GIFT_CARDS;

  const activeCards = giftCardsToRender.filter((card) => card.status === "active");
  const expiredCards = giftCardsToRender.filter((card) => card.status === "expired");

  const displayCards = activeTab === "active" ? activeCards : expiredCards;

  if (isLoading) {
    return (
      <ShopAccountShell hideSidebar>
        <div className="mx-auto w-full max-w-[1000px] flex flex-col items-center justify-center py-24">
          <Loader2 className="mb-4 h-8 w-8 animate-spin text-[var(--flame)]" />
          <p className="text-sm text-[var(--muted)]">Loading your gift cards…</p>
        </div>
      </ShopAccountShell>
    );
  }

  return (
    <ShopAccountShell hideSidebar>
      <div className="mx-auto w-full max-w-[1000px]">
        {/* Breadcrumb */}
        <div className="mb-4 flex items-center gap-2 text-xs font-semibold text-[var(--muted)]">
          <Link href="/shop" className="hover:text-white transition">Home</Link>
          <span className="text-white/20">&gt;</span>
          <span className="text-white/60">My Gift Cards</span>
        </div>

        {/* Title */}
        <h1 className="font-heading text-2xl font-black text-white mb-6">My Gift Cards</h1>

        {/* Stats Dashboard Panel */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-5 bg-black border border-white/10 rounded-2xl mb-8">
          {/* Card count stat */}
          <div className="flex items-center gap-4 py-1">
            <div className="flex items-center justify-center w-12 h-12 bg-white/5 border border-white/10 rounded-xl shrink-0">
              <CreditCard className="w-5 h-5 text-[var(--flame)]" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-white/30 mb-0.5">Gift cards owned</p>
              <p className="text-lg font-black text-white">{activeCards.length}</p>
            </div>
          </div>

          {/* Savings stat */}
          <div className="flex items-center gap-4 py-1 sm:border-l border-white/5 sm:pl-6">
            <div className="flex items-center justify-center w-12 h-12 bg-emerald-500/10 border border-emerald-500/25 rounded-xl shrink-0">
              <Wallet className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-white/30 mb-0.5">Total savings</p>
              <p className="text-lg font-black text-emerald-400">
                ₹{activeCards.reduce((acc, card) => {
                  if (card.cashbackText) {
                    const match = card.cashbackText.match(/₹(\d+(\.\d+)?)/);
                    if (match) return acc + parseFloat(match[1]);
                  }
                  return acc;
                }, 0).toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => setActiveTab("active")}
            className={`flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-bold transition focus:outline-none ${
              activeTab === "active"
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                : "border-white/5 bg-white/5 text-white/40 hover:text-white/80"
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
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
            <Clock className="w-3.5 h-3.5" />
            Used/Expired • {expiredCards.length}
          </button>
        </div>

        {/* Gift Cards Grid */}
        {displayCards.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-black p-12 text-center">
            <p className="text-sm text-white/40 font-semibold">No gift cards found in this section.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayCards.map((card) => (
              <GiftCardRow key={card.id} card={card} />
            ))}
          </div>
        )}
      </div>
    </ShopAccountShell>
  );
}
