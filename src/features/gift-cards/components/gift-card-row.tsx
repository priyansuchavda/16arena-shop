"use client";

import Link from "next/link";
import Image from "next/image";
import { Gift } from "lucide-react";
import type { StaticGiftCard } from "../types";

type GiftCardRowProps = {
  card: StaticGiftCard;
};

function GiftCardGraphic({
  title,
  amount,
  imageUrl,
}: {
  title: string;
  amount: number;
  imageUrl: string;
}) {
  const titleLower = title.toLowerCase();
  const isBgmi = titleLower.includes("bgmi") || titleLower.includes("uc");
  const isSwiggy = titleLower.includes("swiggy");
  const isBigBasket = titleLower.includes("bigbasket") || titleLower.includes("basket");

  // Choose premium gradients based on the brand
  const gradient = isBgmi
    ? "linear-gradient(135deg, #162447 0%, #1f4068 100%)" // Deep military blue for BGMI
    : isSwiggy
    ? "linear-gradient(135deg, #fc8019 0%, #b84f00 100%)" // Vibrant orange for Swiggy
    : isBigBasket
    ? "linear-gradient(135deg, #84c225 0%, #4f800e 100%)" // Fresh green for BigBasket
    : "linear-gradient(135deg, #1f1f1f 0%, #2e2e2e 100%)"; // Generic dark

  return (
    <div
      className="relative w-full rounded-xl overflow-hidden shadow-md"
      style={{ aspectRatio: "1.586/1", background: gradient }}
    >
      {/* Glare overlay */}
      <div
        className="absolute inset-0 opacity-20 pointer-events-none"
        style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.2) 0%, transparent 60%)" }}
      />

      {/* Brand logo top-left */}
      <div className="absolute top-3.5 left-3.5 flex items-center gap-2">
        <div className="relative w-8 h-8 rounded-lg overflow-hidden bg-black/20 border border-white/10 shrink-0">
          {imageUrl ? (
            <Image src={imageUrl} alt="" fill className="object-contain p-1" />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <Gift className="h-4 w-4 text-white/50" />
            </div>
          )}
        </div>
        <div>
          <p className="text-white text-[11px] font-black leading-tight truncate max-w-[125px]">{title}</p>
          <p className="text-white/40 text-[9px] font-semibold">Gift Card</p>
        </div>
      </div>

      {/* Worth bottom-right */}
      <div className="absolute bottom-3.5 right-3.5 text-right">
        <p className="text-white/40 text-[8px] font-semibold uppercase tracking-widest mb-0.5">Worth</p>
        <p className="text-white text-lg font-black tracking-tight">₹{amount.toLocaleString("en-IN")}</p>
      </div>

      {/* Chip emblem */}
      <div className="absolute bottom-3.5 left-3.5 opacity-20">
        <div className="w-6 h-4.5 rounded-sm border border-white/40 grid grid-cols-2 gap-px p-px">
          <div className="bg-white/40 rounded-[0.5px]" />
          <div className="bg-white/40 rounded-[0.5px]" />
          <div className="bg-white/40 rounded-[0.5px]" />
          <div className="bg-white/40 rounded-[0.5px]" />
        </div>
      </div>
    </div>
  );
}

export function GiftCardRow({ card }: GiftCardRowProps) {
  return (
    <Link
      href={`/orders/${card.orderId}`}
      className="shop-card-lift relative rounded-2xl border border-white/10 bg-black overflow-hidden shadow-lg p-5 flex flex-col gap-4 group cursor-pointer"
    >
      {/* Cashback/Savings Badge */}
      {card.cashbackText && (
        <div className="absolute top-3.5 right-3.5 z-10 rounded-md bg-emerald-500 px-2 py-0.5 text-[9px] font-bold text-black shadow-md">
          {card.cashbackText}
        </div>
      )}

      {/* Visual Card Graphic */}
      <div className="relative w-full">
        <GiftCardGraphic title={card.title} amount={card.amount} imageUrl={card.imageUrl} />
      </div>

      {/* Purchase Details */}
      <div className="flex flex-col gap-3.5 pt-1 text-xs">
        <div className="flex items-center justify-between text-white/40">
          <p>Purchased on</p>
          <p>{card.purchasedAt}</p>
        </div>
        
        <div className="flex items-center justify-between font-bold text-white">
          <p className="text-white/50">{card.category ?? "Voucher"}</p>
          <p>{card.skuLabel ?? `₹${card.amount.toLocaleString("en-IN")} Voucher`}</p>
        </div>

        {/* Divider */}
        <div className="h-px bg-white/[0.08]" />

        {/* View Details text */}
        <div className="text-left">
          <span className="inline-block text-xs font-bold text-emerald-400 underline group-hover:text-emerald-300 transition-colors">
            View Details
          </span>
        </div>
      </div>
    </Link>
  );
}
