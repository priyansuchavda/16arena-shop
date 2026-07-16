"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Loader2, Coins, AlertCircle } from "lucide-react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { shopApi } from "@/features/shop";
import { ShopAccountShell } from "@/features/shop/components/shop-account-shell";
import coinImg from "@/assets/png/coin.png";

type TabType = "all" | "earned" | "spent";

function ExpandableDescription({ text }: { text: string }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const isLong = text.length > 80;

  return (
    <div className="text-[11px] md:text-[13px] text-white/50 font-normal leading-relaxed mt-0.5 md:mt-1">
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
  const allRef = React.useRef<HTMLButtonElement>(null);
  const earnedRef = React.useRef<HTMLButtonElement>(null);
  const spentRef = React.useRef<HTMLButtonElement>(null);
  const [indicatorStyle, setIndicatorStyle] = useState<{ left: number; width: number } | null>(null);

  useEffect(() => {
    const updatePosition = () => {
      const activeEl =
        activeTab === "all"
          ? allRef.current
          : activeTab === "earned"
          ? earnedRef.current
          : spentRef.current;

      if (activeEl) {
        setIndicatorStyle({
          left: activeEl.offsetLeft,
          width: activeEl.offsetWidth,
        });
      }
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    return () => window.removeEventListener("resize", updatePosition);
  }, [activeTab]);

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
      <div className="flex flex-col gap-4 md:gap-6 max-w-4xl mx-auto px-3 md:px-0">
        {/* Header Nav */}
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-base font-bold text-white tracking-tight md:text-2xl">
              Transactions History
            </h1>
            <p className="text-[11px] md:text-sm text-white/50">
              View details of your coins earned and spent.
            </p>
          </div>
        </div>

        {/* Custom Tab Bar with dividers */}
        <div className="flex items-center border-b border-white/10 pb-2 md:pb-3 mt-2 md:mt-4">
          <div className="flex items-center gap-2 md:gap-3 text-xs md:text-base relative">
            <button
              ref={allRef}
              onClick={() => setActiveTab("all")}
              className={`px-2 md:px-3 py-1 transition-all relative ${
                activeTab === "all" ? "text-white font-semibold" : "text-white/60 font-normal"
              }`}
            >
              All Transactions
            </button>
            <span className="text-white/10 font-light">|</span>
            <button
              ref={earnedRef}
              onClick={() => setActiveTab("earned")}
              className={`px-2 md:px-3 py-1 transition-all relative ${
                activeTab === "earned" ? "text-white font-semibold" : "text-white/60 font-normal"
              }`}
            >
              Earned
            </button>
            <span className="text-white/10 font-light">|</span>
            <button
              ref={spentRef}
              onClick={() => setActiveTab("spent")}
              className={`px-2 md:px-3 py-1 transition-all relative ${
                activeTab === "spent" ? "text-white font-semibold" : "text-white/60 font-normal"
              }`}
            >
              Spent
            </button>
            {indicatorStyle && (
              <span
                className="absolute bottom-[-9px] md:bottom-[-12px] h-[2px] bg-[#008AFF] transition-all duration-300 ease-in-out"
                style={{
                  left: indicatorStyle.left,
                  width: indicatorStyle.width,
                }}
              />
            )}
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
            <div className="border border-white/10 rounded-xl md:rounded-2xl bg-white/[0.02] p-1.5 md:p-4 flex flex-col divide-y divide-white/5 shadow-xl">
              {filteredTransactions.map((tx) => {
                const isEarned = tx.transactionType.toLowerCase() === "earned";
                return (
                  <div
                    key={tx.id}
                    className="flex items-start justify-between gap-2 md:gap-4 py-2.5 md:py-4 px-1.5 md:px-4"
                  >
                    {/* Left: Coin Icon & Text Details */}
                    <div className="flex items-center gap-2 md:gap-3">
                      <Image
                        src={coinImg}
                        alt="coin"
                        width={36}
                        height={36}
                        className="object-contain shrink-0 w-6 h-6 md:w-9 md:h-9"
                      />

                      {/* Middle: Category, Description, Updated Balance */}
                      <div className="flex flex-col">
                        <span className="font-semibold text-xs md:text-base text-white">
                          {tx.categoryName}
                        </span>
                        <ExpandableDescription text={tx.description} />
                        <span className="text-[10px] md:text-[11px] text-white/30 font-medium mt-0">
                          Updated balance: {tx.balanceAfter.toLocaleString("en-IN")}
                        </span>
                      </div>
                    </div>

                    {/* Right: Value, Date */}
                    <div className="flex flex-col items-end shrink-0 text-right justify-center">
                      <span
                        className={`text-xs md:text-base font-semibold leading-none ${
                          isEarned ? "text-[#4CAF50]" : "text-[#EF4444]"
                        }`}
                      >
                        {isEarned ? "+" : "-"}
                        {tx.amount.toLocaleString("en-IN")}
                      </span>
                      <span className="text-[10px] md:text-[11px] text-white/30 font-normal mt-1 md:mt-2">
                        {formatDate(tx.createdAt)}
                      </span>
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
