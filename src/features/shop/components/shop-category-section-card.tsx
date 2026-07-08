import Image from "next/image";
import Link from "next/link";
import coinImg from "@/assets/png/coin.png";
import { type CardBadge, type CardModel } from "@/features/shop/types/shop.types";

/** Solid fills for section card top badges (doc: bold white on colored background). */
const SECTION_BADGE_FILLS: Record<CardBadge["tone"], { bg: string; fg: string }> = {
  hot: { bg: "#25C26E", fg: "#FFFFFF" },
  new: { bg: "#FE8321", fg: "#FFFFFF" },
  low: { bg: "#E84855", fg: "#FFFFFF" },
};

function isTopDeal(product: CardModel) {
  return /top-up|in-game|uc|diamonds|vp|cp\b/i.test(product.sub);
}

function badgeFor(product: CardModel) {
  if (product.savePct != null && product.savePct > 0) {
    return { label: `Save ${product.savePct}%`, bg: "#25C26E", fg: "#FFFFFF" };
  }
  if (product.badge) {
    const fill = SECTION_BADGE_FILLS[product.badge.tone];
    return { label: product.badge.label, bg: fill.bg, fg: fill.fg };
  }
  return null;
}

function SectionBadge({ label, bg, fg }: { label: string; bg: string; fg: string }) {
  return (
    <span
      className="absolute left-1/2 top-0 z-10 -translate-x-1/2 rounded-b-[5px] px-2.5 py-[4px] text-[8.5px] font-bold uppercase leading-none tracking-[0.02em] shadow-[0_2px_8px_rgba(0,0,0,0.35)]"
      style={{ backgroundColor: bg, color: fg }}
    >
      {label}
    </span>
  );
}

export const SECTION_CARD_WIDTH = 140;

function TopDealCard({ product }: { product: CardModel }) {
  const badge = badgeFor(product);

  return (
    <Link
      href={`/shop/${product.slug}`}
      className="shop-card-lift group relative flex h-[202px] w-full shrink-0 flex-col overflow-hidden rounded-[11px] border border-white/10 bg-white/[0.05]"
    >
      {badge && <SectionBadge label={badge.label} bg={badge.bg} fg={badge.fg} />}

      <div className="flex min-h-0 flex-1 flex-col">
        <div className="flex flex-1 items-end justify-center p-2.5 pb-0">
          {product.imageUrl ? (
            <div className="w-full overflow-hidden rounded-[5px]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={product.imageUrl}
                alt={product.brand}
                className="block w-full object-contain object-bottom transition-opacity duration-200 group-hover:opacity-90"
              />
            </div>
          ) : (
            <span className="pb-2 text-center text-sm font-extrabold text-white">{product.brand}</span>
          )}
        </div>
      </div>

      <div className="flex shrink-0 flex-col items-center justify-center px-2 py-2 text-center">
        <span className="font-heading line-clamp-1 text-[12px] font-bold leading-tight text-white">
          {product.name || product.brand}
        </span>
        <span className="mt-0.5 line-clamp-1 text-[9px] text-white/45">{product.sub}</span>
      </div>

      <div className="flex h-[29px] shrink-0 items-center justify-center gap-1.5 bg-gradient-to-b from-white/25 to-white/[0.08] px-2">
        {product.originalStr && (
          <span className="text-[10px] text-white line-through">{product.originalStr}</span>
        )}
        <span className="text-[10px] font-bold text-white">{product.priceStr}</span>
      </div>
    </Link>
  );
}

function TravelHotelCard({ product }: { product: CardModel }) {
  const badge = badgeFor(product);
  const coinAmount = product.coinAmount?.toLocaleString("en-IN") ?? "—";

  return (
    <Link
      href={`/shop/${product.slug}`}
      className="shop-card-lift group relative flex h-[202px] w-full shrink-0 flex-col overflow-hidden rounded-[11px] border border-white/10 bg-white/[0.05]"
    >
      {badge && <SectionBadge label={badge.label} bg={badge.bg} fg={badge.fg} />}

      <div className="flex min-h-0 flex-1 flex-col">
        <div className="flex flex-1 items-end justify-center p-2.5 pb-0">
          {product.imageUrl ? (
            <div className="w-full overflow-hidden rounded-[5px]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={product.imageUrl}
                alt={product.brand}
                className="block w-full object-contain object-bottom transition-opacity duration-200 group-hover:opacity-90"
              />
            </div>
          ) : (
            <span className="px-2 pb-2 text-center text-sm font-extrabold leading-tight text-white">
              {product.brand}
            </span>
          )}
        </div>
      </div>

      <div className="flex h-[26px] shrink-0 items-center justify-center px-2 text-center">
        <span className="text-[10px] font-bold text-white">
          {product.originalStr || "—"}
        </span>
      </div>

      <div className="flex h-[29px] shrink-0 items-center justify-center gap-1 bg-gradient-to-b from-white/25 to-white/[0.08] px-2">
        <span className="text-[10px] font-bold text-white">{product.priceStr}</span>
        <span className="text-[10px] font-bold text-white">+</span>
        <Image src={coinImg} alt="" width={13} height={13} className="h-[13px] w-[13px] object-contain" />
        <span className="text-[10px] font-bold tabular-nums text-[#FBCD00]">{coinAmount}</span>
      </div>
    </Link>
  );
}

export function ShopCategorySectionCard({ product }: { product: CardModel }) {
  if (product.coinAmount && product.coinAmount > 0) {
    return <TravelHotelCard product={product} />;
  }
  return <TopDealCard product={product} />;
}
