"use client";

import Link from "next/link";
import Image from "next/image";
import { ChevronRight, Gift } from "lucide-react";
import type { StaticGiftCard } from "../types";

type GiftCardRowProps = {
  card: StaticGiftCard;
};

function buildCardLabel(card: StaticGiftCard): string {
  const worth = card.skuLabel ?? `₹${card.amount.toLocaleString("en-IN")}`;
  if (card.category === "UC") {
    return `${worth} ${card.title} UC Card`;
  }
  return `${worth} ${card.title} card`;
}

function formatPurchasedAt(isoString: string): string {
  try {
    const date = new Date(isoString);
    const datePart = date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    const timePart = date.toLocaleTimeString("en-IN", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
    return `${datePart} - ${timePart}`;
  } catch {
    return isoString;
  }
}

export function GiftCardRow({ card }: GiftCardRowProps) {
  const cardLabel = buildCardLabel(card);
  const purchasedLabel = formatPurchasedAt(card.purchasedAtIso);

  return (
    <Link
      href={`/orders/${card.orderId}`}
      className="group flex items-center gap-3.5 rounded-[12px] border border-white/10 bg-white/[0.06] px-4 py-3.5 transition hover:border-white/15 hover:bg-white/[0.08] active:scale-[0.995]"
    >
      <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-white/10 bg-black/20">
        {card.imageUrl ? (
          <Image src={card.imageUrl} alt="" fill className="object-cover" sizes="48px" />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Gift className="h-5 w-5 text-white/40" />
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate font-sans text-[15px] font-bold leading-snug text-white">
          {card.title}
        </p>
        <p className="mt-1 truncate font-heading text-xs font-medium text-white/70">
          {cardLabel}
        </p>
        <p className="mt-0.5 truncate font-heading text-xs font-medium text-white/40">
          {purchasedLabel}
        </p>
      </div>

      <ChevronRight className="h-4 w-4 shrink-0 text-white/30 transition group-hover:text-white/50" />
    </Link>
  );
}
