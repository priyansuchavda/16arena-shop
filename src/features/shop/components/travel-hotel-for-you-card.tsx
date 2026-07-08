"use client";

import Link from "next/link";
import Image from "next/image";
import coinImg from "@/assets/png/coin.png";
import { CardModel } from "@/features/shop/types/shop.types";

export const TRAVEL_HOTEL_CARD_WIDTH = 341;
export const TRAVEL_HOTEL_CARD_HEIGHT = 206;

function getBadgeStyle(product: CardModel) {
  const slug = (product.slug || "").toLowerCase();
  
  if (
    slug.includes("booking") ||
    slug.includes("goibibo") ||
    slug.includes("flipkart") ||
    slug.includes("ikea")
  ) {
    return { bg: "#1060eb", fg: "#FFFFFF" };
  }
  
  if (
    slug.includes("zomato") ||
    slug.includes("apple") ||
    slug.includes("gaana")
  ) {
    return { bg: "#E84855", fg: "#FFFFFF" };
  }
  
  return { bg: "#25C26E", fg: "#FFFFFF" };
}

function getBadgeLabel(product: CardModel): string | null {
  if (product.badge?.label) {
    return product.badge.label;
  }
  if (product.savePct != null && product.savePct > 0) {
    return `${product.savePct}% Off`;
  }
  // Fallback: calculate from original price and current price strings
  if (product.originalStr && product.priceStr) {
    const original = parseFloat(product.originalStr.replace(/[^0-9.]/g, ""));
    const price = parseFloat(product.priceStr.replace(/[^0-9.]/g, ""));
    if (original > 0 && price > 0 && original > price) {
      const pct = Math.round(((original - price) / original) * 100);
      if (pct > 0) {
        return `${pct}% Off`;
      }
    }
  }
  // Specific static fallback for travel, food, shopping, music cards to match design expectations
  const slug = (product.slug || "").toLowerCase();
  const MOCKED_SLUGS = [
    "makemytrip", "booking", "goibibo",
    "swiggy", "zomato", "bigbasket",
    "amazon", "flipkart", "ikea",
    "spotify", "apple", "apple-music", "gaana"
  ];
  if (MOCKED_SLUGS.includes(slug)) {
    return "50% Off";
  }
  return null;
}

export function TravelHotelForYouCard({ product }: { product: CardModel }) {
  const caption = product.brand;

  const slug = (product.slug || "").toLowerCase();
  const brand = (product.brand || "").toLowerCase();
  const MOCKED_SLUGS = [
    "makemytrip", "booking", "goibibo",
    "swiggy", "zomato", "bigbasket",
    "amazon", "flipkart", "ikea",
    "spotify", "apple", "apple-music", "gaana"
  ];
  const isMockedBrand = MOCKED_SLUGS.includes(slug) || MOCKED_SLUGS.some(s => brand.includes(s));

  // Mocking values for travel/food/shopping/music cards "for now" as requested
  const originalStr = isMockedBrand ? "₹1,000" : product.originalStr;
  const priceStr = isMockedBrand ? "₹500" : product.priceStr;
  const coinAmount = isMockedBrand ? 1000 : product.coinAmount;

  const badgeStyle = getBadgeStyle(product);
  const badgeLabel = getBadgeLabel({ ...product, originalStr, priceStr, coinAmount });

  return (
    <Link
      href={`/shop/${product.slug}`}
      className="shop-card-lift group relative flex h-[206px] w-[341px] shrink-0 flex-col overflow-hidden rounded-[10px] border border-white/10 bg-white/[0.05]"
    >
      <div className="relative min-h-0 flex-1 overflow-hidden p-2.5 pb-2.5">
        {product.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.imageUrl}
            alt={caption}
            className="h-full w-full object-cover rounded-[6px] transition-opacity duration-300 group-hover:opacity-95"
          />
        ) : (
          <div
            className="flex h-full w-full items-center justify-center rounded-[6px]"
            style={{
              background: `linear-gradient(155deg, ${product.accent} 0%, ${product.accent2} 100%)`,
            }}
          >
            <span className="px-4 text-center text-lg font-extrabold text-white [text-shadow:0_2px_8px_rgba(0,0,0,0.35)]">
              {caption}
            </span>
          </div>
        )}
      </div>

      {badgeLabel && (
        <span
          className="absolute left-1/2 top-0 z-10 -translate-x-1/2 rounded-b-[5px] px-3.5 py-[5.5px] text-[10.5px] font-bold uppercase leading-none tracking-[0.03em] shadow-[0_2px_8px_rgba(0,0,0,0.35)]"
          style={{ backgroundColor: badgeStyle.bg, color: badgeStyle.fg }}
        >
          {badgeLabel}
        </span>
      )}

      <div className="relative flex h-[36px] shrink-0 items-center justify-between px-3.5">
        {priceStr || coinAmount ? (
          <>
            <div>
              {originalStr && (
                <span className="text-[13.5px] font-extrabold text-white">
                  {originalStr}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1 text-white">
              <span className="text-[13.5px] font-extrabold">{priceStr}</span>
              {coinAmount != null && (
                <>
                  <span className="text-[12px] font-extrabold text-white">+</span>
                  <Image
                    src={coinImg}
                    alt="Coins"
                    width={14}
                    height={14}
                    className="h-[14px] w-[14px] object-contain"
                  />
                  <span className="text-[13.5px] font-extrabold tabular-nums text-[#F5A623]">
                    {coinAmount.toLocaleString("en-IN")}
                  </span>
                </>
              )}
            </div>
          </>
        ) : (
          <p className="font-heading absolute inset-x-2.5 top-1/2 line-clamp-2 -translate-y-1/2 text-center text-[13px] font-extrabold leading-[1.2] text-white">
            {product.name || product.brand}
          </p>
        )}
      </div>
    </Link>
  );
}
