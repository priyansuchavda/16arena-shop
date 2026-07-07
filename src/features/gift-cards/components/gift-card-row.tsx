"use client";

import Link from "next/link";
import Image from "next/image";
import { ChevronRight, Gift } from "lucide-react";
import type { StaticGiftCard } from "../types";

type GiftCardRowProps = {
  card: StaticGiftCard;
};

export function GiftCardRow({ card }: GiftCardRowProps) {
  return (
    <Link
      href={`/orders/${card.orderId}`}
      className="flex items-center justify-between gap-3 rounded-[12px] border border-[var(--line)] bg-[var(--surface)] pl-2 pr-4 py-2 transition hover:border-white/15 hover:bg-white/[0.03]"
    >
      <div className="flex min-w-0 items-center gap-4">
        <div className="relative h-[72px] w-[76px] shrink-0 overflow-hidden rounded-[8px] border border-white/10 bg-black/30">
          {card.imageUrl ? (
            <Image src={card.imageUrl} alt="" fill className="object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <Gift className="h-5 w-5 text-white/40" />
            </div>
          )}
        </div>
        <div className="min-w-0">
          <p className="truncate text-lg font-extrabold leading-tight text-white">
            ₹{card.amount.toLocaleString("en-IN")} {card.title}
          </p>
          <p className="truncate pt-1 text-sm leading-none text-white/55">{card.purchasedAt}</p>
        </div>
      </div>
      <ChevronRight className="h-5 w-5 shrink-0 text-white/35" />
    </Link>
  );
}
