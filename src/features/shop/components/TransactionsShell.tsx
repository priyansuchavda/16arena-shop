"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Loader2, Calendar, Coins, AlertCircle } from "lucide-react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { shopApi } from "@/features/shop";
import { ShopAccountShell } from "@/features/shop/components/shop-account-shell";
import coinImg from "@/assets/png/coin.png";

type TabType = "all" | "earned" | "spent";

function ExpandableDescription({ text }: { text: string }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const isLong = text.length > 80;

  return (
    <div className="text-[13px] text-white/50 font-normal leading-relaxed mt-1">
      {isExpanded || !isLong ? (
        <span>{text}</span>
      ) : (
        <span>
          {text.slice(0, 80)}...{" "}
          <button
            onClick={() => setIsExpanded(true)}
            className="text-[#FE8321] font-semibold hover:underline focus:outline-none"
          >
            view more
          </button>
        </span>
      )}
      {isExpanded && isLong && (
        <button
          onClick={() => setIsExpanded(false)}
          className="text-[#FE8321] font-semibold hover:underline focus:outline-none ml-1.5"
        >
          show less
        </button>
      )}
    </div>
  );
}

export function TransactionsShell() {
  const [activeTab, setActiveTab] = useState<TabType>("all");

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
  } = useInfiniteQuery({
    queryKey: ["shop", "wallet-transactions"],
    queryFn: ({ pageParam = 1 }) => shopApi.fetchWalletTransactions(pageParam, 20),
    getNextPageParam: (lastPage) => {
      const loadedCount = lastPage.pageNumber * lastPage.pageSize;
      return loadedCount < lastPage.totalCount ? lastPage.pageNumber + 1 : undefined;
    },
    initialPageParam: 1,
  });

  // Infinite scroll detector
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

  // Flatten transactions
  const allTransactions = data?.pages.flatMap((page) => page.transactions) ?? [];

  // Filter local items by type
  const filteredTransactions = allTransactions.filter((tx) => {
    const type = tx.transactionType.toLowerCase();
    if (activeTab === "earned") {
      return type === "earned";
    }
    if (activeTab === "spent") {
      return type === "spent";
    }
    return true; // "all"
  });

  const formatDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    } catch {
      return isoString;
    }
  };

  return (
    <ShopAccountShell hideSidebar>
      <div className="flex flex-col gap-6 max-w-4xl mx-auto px-4 md:px-0">
        {/* Header Nav */}
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight md:text-2xl">
              Transactions History
            </h1>
            <p className="text-xs md:text-sm text-white/50">
              View details of your coins earned and spent.
            </p>
          </div>
        </div>

        {/* Custom Tab Bar with dividers */}
        <div className="flex items-center border-b border-white/10 pb-3 mt-4">
          <div className="flex items-center gap-3 text-sm md:text-base">
            <button
              onClick={() => setActiveTab("all")}
              className={`px-3 py-1 font-semibold transition-all relative ${
                activeTab === "all" ? "text-[#FE8321]" : "text-white/60 hover:text-white"
              }`}
            >
              All
            </button>
            <span className="text-white/10 font-light">|</span>
            <button
              onClick={() => setActiveTab("earned")}
              className={`px-3 py-1 font-semibold transition-all relative ${
                activeTab === "earned" ? "text-[#FE8321]" : "text-white/60 hover:text-white"
              }`}
            >
              Earned
            </button>
            <span className="text-white/10 font-light">|</span>
            <button
              onClick={() => setActiveTab("spent")}
              className={`px-3 py-1 font-semibold transition-all relative ${
                activeTab === "spent" ? "text-[#FE8321]" : "text-white/60 hover:text-white"
              }`}
            >
              Spent
            </button>
          </div>
        </div>

        {/* Content Section */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="animate-spin text-[#FE8321]" size={32} />
            <p className="text-sm text-white/40">Loading transactions...</p>
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center justify-center py-16 px-6 border border-red-500/10 rounded-2xl bg-red-500/[0.01] gap-3">
            <AlertCircle className="text-red-500" size={32} />
            <p className="text-sm text-red-500/80 text-center font-medium">
              Failed to load transaction history. Please try again.
            </p>
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-6 border border-white/5 rounded-2xl bg-white/[0.01] text-center">
            <Coins className="text-white/20 mb-4" size={40} />
            <h3 className="text-base font-semibold text-white">No Transactions Found</h3>
            <p className="text-xs md:text-sm text-white/40 mt-1 max-w-sm">
              There are no transactions in this category. Perform actions in the arena to earn or spend coins!
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="border border-white/10 rounded-2xl bg-white/[0.02] p-2 md:p-4 flex flex-col divide-y divide-white/5 shadow-xl">
              {filteredTransactions.map((tx) => {
                const isEarned = tx.transactionType.toLowerCase() === "earned";
                return (
                  <div
                    key={tx.id}
                    className="flex items-start justify-between gap-4 py-4 px-2 md:px-4 hover:bg-white/[0.01] rounded-xl transition-all duration-150"
                  >
                    {/* Left: Coin Icon */}
                    <div className="flex items-start gap-4">
                      <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03]">
                        <Image
                          src={coinImg}
                          alt="coin"
                          width={24}
                          height={24}
                          className="object-contain"
                        />
                      </div>

                      {/* Middle: Category, Description, Updated Balance */}
                      <div className="flex flex-col">
                        <span className="font-semibold text-sm md:text-base text-white">
                          {tx.categoryName}
                        </span>
                        <ExpandableDescription text={tx.description} />
                        <span className="text-[11px] text-white/30 font-medium mt-1">
                          Updated balance: {tx.balanceAfter.toLocaleString("en-IN")}
                        </span>
                      </div>
                    </div>

                    {/* Right: Value, Date */}
                    <div className="flex flex-col items-end shrink-0 text-right">
                      <span
                        className={`font-data text-sm md:text-base font-bold leading-none tabular-nums ${
                          isEarned ? "text-[#4CAF50]" : "text-[#FE8321]"
                        }`}
                      >
                        {isEarned ? "+" : "-"}
                        {tx.amount.toLocaleString("en-IN")}
                      </span>
                      <div className="flex items-center gap-1.5 text-[11px] text-white/30 font-medium mt-2">
                        <Calendar size={10} />
                        <span>{formatDate(tx.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Bottom loading indicator */}
            {isFetchingNextPage && (
              <div className="flex justify-center py-4">
                <Loader2 className="animate-spin text-[#FE8321]" size={24} />
              </div>
            )}
          </div>
        )}
      </div>
    </ShopAccountShell>
  );
}
