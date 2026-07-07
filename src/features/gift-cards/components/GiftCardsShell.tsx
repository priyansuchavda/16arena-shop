"use client";

import { ShopAccountShell } from "@/features/shop/components/shop-account-shell";
import { STATIC_GIFT_CARDS } from "../data/static-gift-cards";
import { GiftCardRow } from "./gift-card-row";

export function GiftCardsShell() {
  return (
    <ShopAccountShell fullWidth>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {STATIC_GIFT_CARDS.map((card) => (
          <GiftCardRow key={card.id} card={card} />
        ))}
      </div>
    </ShopAccountShell>
  );
}
