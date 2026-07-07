"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, ClipboardList, Copy, Check, Calendar, Receipt, AlertCircle, Loader2 } from "lucide-react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { shopApi } from "@/features/shop";
import { ShopAccountShell } from "@/features/shop/components/shop-account-shell";
import coinImg from "@/assets/png/coin.png";

export function OrdersShell() {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
  } = useInfiniteQuery({
    queryKey: ["shop", "orders"],
    queryFn: ({ pageParam = 1 }) => shopApi.fetchOrders(pageParam, 20),
    getNextPageParam: (lastPage, allPages) => {
      const loadedCount = allPages.reduce((acc, curr) => acc + curr.orders.length, 0);
      return loadedCount < lastPage.totalCount ? allPages.length + 1 : undefined;
    },
    initialPageParam: 1,
  });

  // Attach infinite scroll listener (triggers past 85% viewport height)
  useEffect(() => {
    const handleScroll = () => {
      if (!hasNextPage || isFetchingNextPage) return;
      const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
      if (scrollTop + clientHeight >= scrollHeight - 200) {
        fetchNextPage();
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const formatDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
    } catch {
      return isoString;
    }
  };

  const allOrders = data ? data.pages.flatMap((page) => page.orders) : [];

  if (isLoading) {
    return (
      <ShopAccountShell>
        <div className="flex flex-col items-center justify-center rounded-2xl border border-[var(--line)] bg-[var(--surface)] py-24">
          <Loader2 className="mb-4 h-8 w-8 animate-spin text-[var(--flame)]" />
          <span className="text-sm text-[var(--muted)]">Loading order history...</span>
        </div>
      </ShopAccountShell>
    );
  }

  if (isError) {
    return (
      <ShopAccountShell>
        <div className="flex flex-col items-center justify-center rounded-2xl border border-[var(--line)] bg-[var(--surface)] px-6 py-16 text-center">
          <AlertCircle className="mb-4 h-12 w-12 text-red-500" />
          <h2 className="font-heading mb-2 text-lg font-bold text-white">Failed to load orders</h2>
          <p className="mb-6 max-w-sm text-xs text-[var(--muted)]">
            There was an error communicating with the API. Please try again.
          </p>
          <Link
            href="/shop"
            className="rounded-xl bg-gradient-to-r from-[#ff973c] to-[#ff6a00] px-5 py-2.5 text-xs font-bold text-black"
          >
            Return to Shop
          </Link>
        </div>
      </ShopAccountShell>
    );
  }

  return (
    <ShopAccountShell>
      <div className="mb-8 flex items-center gap-4">
        <Link
          href="/shop"
          className="rounded-full border border-[var(--line)] p-2 transition hover:bg-white/5"
        >
          <ArrowLeft className="h-5 w-5 text-white" />
        </Link>
        <div>
          <h1 className="font-heading text-2xl font-black text-white">Order History</h1>
          <p className="text-xs font-medium text-[var(--muted)]">
            View all your purchased brand vouchers and UC top-ups.
          </p>
        </div>
      </div>

      {allOrders.length === 0 ? (
        <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] px-6 py-16 text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-[var(--flame)]/20 bg-[var(--flame)]/10">
            <ClipboardList className="h-8 w-8 text-[var(--flame)]" />
          </div>
          <h2 className="font-heading text-lg font-bold text-white">No orders yet</h2>
          <p className="mx-auto mt-2 max-w-xs text-xs text-[var(--muted)]">
            You haven&apos;t purchased any digital gift cards or top-ups yet.
          </p>
          <Link
            href="/shop"
            className="mt-6 inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-[#ff973c] to-[#ff6a00] px-6 py-2.5 text-xs font-bold text-black transition active:scale-95"
          >
            Go to Store
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          {allOrders.map((order) => {
            const dateStr = formatDate(order.createdAt);
            const status = order.status.toLowerCase();
            const isFulfilled = status === "fulfilled";
            const isPending = ["pending", "processing", "payment_initiated", "payment_success"].includes(status);
            
            return (
              <Link
                key={order.id}
                href={`/orders/${order.id}`}
                className="block overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--surface)] shadow-lg transition-all duration-200 hover:border-white/15 hover:bg-[#181818]/50"
              >
                {/* Order Header */}
                <div className="p-4 border-b border-white/5 bg-[#161616]/40 flex flex-wrap justify-between items-center gap-3">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-white/30 font-bold uppercase">Order Number</span>
                    <span className="text-xs font-bold text-white font-mono mt-0.5">{order.orderNumber}</span>
                  </div>

                  <div className="flex flex-col items-end">
                    <span className="text-[10px] text-white/30 font-bold uppercase text-right">Order Date</span>
                    <span className="text-xs font-bold text-white mt-0.5 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-white/30" />
                      {dateStr}
                    </span>
                  </div>
                </div>

                {/* Items list */}
                <div className="p-4 flex flex-col gap-4">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex flex-col gap-4">
                      <div className="flex gap-4 items-start">
                        {item.productImageUrl && (
                          <div className="relative w-12 h-12 rounded-xl overflow-hidden border border-white/10 shrink-0">
                            <Image src={item.productImageUrl} alt="" fill className="object-cover" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-black text-white truncate leading-snug">
                            {item.productName}
                          </h3>
                          <p className="text-[10px] text-[var(--muted)] font-semibold mt-0.5 uppercase tracking-wide">
                            {item.skuLabel} (Qty: {item.quantity})
                          </p>
                        </div>

                        {/* Status badge */}
                        <span className={`px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                          isFulfilled 
                            ? "bg-[rgba(37,194,110,0.1)] text-[var(--win)] border border-[var(--win)]/20"
                            : isPending
                              ? "bg-[var(--flame)]/10 text-[var(--flame)] border border-[var(--flame)]/20 animate-pulse"
                              : "bg-red-500/10 text-red-400 border border-red-500/20"
                        }`}>
                          {order.status}
                        </span>
                      </div>

                      {/* Vouchers and pin delivery codes */}
                      {isFulfilled && item.vouchers && item.vouchers.length > 0 && (
                        <div className="mt-2 p-3 bg-black/40 border border-white/5 rounded-xl flex flex-col gap-3">
                          {item.vouchers.map((voucher, idx) => (
                            <div key={idx} className="flex flex-col gap-2.5">
                              {/* Card Code */}
                              <div className="flex items-center justify-between gap-3 bg-white/[0.02] border border-white/5 p-2 rounded-lg">
                                <div className="flex flex-col">
                                  <span className="text-[8px] text-white/30 uppercase font-bold tracking-wider">Card Code</span>
                                  <span className="text-xs font-mono font-bold text-white mt-0.5">{voucher.cardNumber}</span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleCopy(voucher.cardNumber, `${item.id}-code-${idx}`)}
                                  className="p-1.5 bg-white/5 rounded-md hover:bg-white/10 transition border border-white/5 focus:outline-none"
                                  style={{ outline: "none", boxShadow: "none" }}
                                >
                                  {copiedId === `${item.id}-code-${idx}` ? (
                                    <Check className="w-3.5 h-3.5 text-[var(--win)]" />
                                  ) : (
                                    <Copy className="w-3.5 h-3.5 text-white/50" />
                                  )}
                                </button>
                              </div>

                              {/* Card Pin */}
                              {voucher.cardPin && (
                                <div className="flex items-center justify-between gap-3 bg-white/[0.02] border border-white/5 p-2 rounded-lg">
                                  <div className="flex flex-col">
                                    <span className="text-[8px] text-white/30 uppercase font-bold tracking-wider">Pin Number</span>
                                    <span className="text-xs font-mono font-bold text-[#FFA000] mt-0.5">{voucher.cardPin}</span>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => handleCopy(voucher.cardPin!, `${item.id}-pin-${idx}`)}
                                    className="p-1.5 bg-white/5 rounded-md hover:bg-white/10 transition border border-white/5 focus:outline-none"
                                    style={{ outline: "none", boxShadow: "none" }}
                                  >
                                    {copiedId === `${item.id}-pin-${idx}` ? (
                                      <Check className="w-3.5 h-3.5 text-[var(--win)]" />
                                    ) : (
                                      <Copy className="w-3.5 h-3.5 text-white/50" />
                                    )}
                                  </button>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Footer Pricing Summary */}
                <div className="p-4 border-t border-white/5 bg-[#161616]/20 flex justify-between items-center">
                  <span className="text-[10px] text-white/30 uppercase font-bold tracking-wider flex items-center gap-1.5">
                    <Receipt className="w-3.5 h-3.5" /> Paid Details
                  </span>
                  
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-extrabold text-white">₹{order.totalPaid.toLocaleString()}</span>
                    {order.coinsSpent > 0 && (
                      <>
                        <span className="text-xs text-white/30 font-light">+</span>
                        <div className="flex items-center gap-1 bg-white/5 px-2 py-1 rounded-lg border border-white/5 leading-none">
                          <Image src={coinImg} alt="Coins" width={12} height={12} />
                          <span className="text-xs font-bold text-[#FFA000]">{order.coinsSpent.toLocaleString()}</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}

          {/* Loader for Infinite scroll pages */}
          {isFetchingNextPage && (
            <div className="flex justify-center p-4">
              <Loader2 className="h-6 w-6 animate-spin text-[var(--flame)]" />
            </div>
          )}
        </div>
      )}
    </ShopAccountShell>
  );
}
