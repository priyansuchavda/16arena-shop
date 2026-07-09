import Link from "next/link";
import { type CardModel } from "@/features/shop/types/shop.types";
import { formatPercent } from "@/features/shop/utils/checkout.utils";
import {
  SAVE_BADGE_GREEN,
  ShopCategorySectionCoinPriceRow,
} from "./shop-category-section-coin-price-row";

/**
 * Mirrors Flutter ShopCategorySectionCard + productSummary /
 * _productSummaryFallback in shop_category_section_card.dart.
 */
export const SECTION_CARD_WIDTH = 140;
const CARD_HEIGHT = 202;
const IMAGE_SIZE = 126;
const FOOTER_HEIGHT = 29;
const MIDDLE_TEXT = "rgba(255,255,255,0.45)";

function SectionBadge({ label }: { label: string }) {
  return (
    <span
      className="absolute left-1/2 top-0 z-10 -translate-x-1/2 rounded-b-[5px] px-[9px] py-[2px] text-[8.5px] font-bold leading-none text-white"
      style={{ backgroundColor: SAVE_BADGE_GREEN }}
    >
      {label}
    </span>
  );
}

function SkuMiddle({ label }: { label: string }) {
  return (
    <div className="flex flex-1 items-center justify-center px-2 py-1 text-center">
      <span className="line-clamp-2 text-[10px] font-bold leading-tight text-white">
        {label}
      </span>
    </div>
  );
}

function FallbackMiddle({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-2 py-1 text-center">
      <span className="font-heading line-clamp-1 text-[12px] font-bold leading-tight text-white">
        {title}
      </span>
      <span
        className="mt-0.5 line-clamp-1 text-[9px] font-semibold"
        style={{ color: MIDDLE_TEXT }}
      >
        {subtitle}
      </span>
    </div>
  );
}

export function ShopCategorySectionCard({ product }: { product: CardModel }) {
  const showSku = product.showSku === true;
  const saveLabel =
    product.savePct != null && product.savePct > 0
      ? `Save ${formatPercent(product.savePct)}%`
      : null;

  // Flutter: Save badge only on showSku path; fallback puts Save in the footer.
  const topBadge = showSku && saveLabel ? saveLabel : null;
  const middleLabel = product.displayLabel || product.name || product.brand;
  const price = product.price ?? 0;
  const maxCoins = product.maxCoins ?? product.coinAmount ?? 0;
  const isCoinOnly = product.isCoinOnly ?? false;

  return (
    <Link
      href={`/shop/${product.slug}`}
      draggable={false}
      onDragStart={(e) => e.preventDefault()}
      className="shop-card-lift group relative flex w-full shrink-0 flex-col overflow-hidden rounded-[11px] border border-white/10 bg-white/[0.03]"
      style={{ height: CARD_HEIGHT, maxWidth: SECTION_CARD_WIDTH }}
    >
      {topBadge && <SectionBadge label={topBadge} />}

      {/* Fixed 126×126 image area — matches Flutter imageSize */}
      <div className="shrink-0 px-[7px] pt-[7px]">
        <div
          className="overflow-hidden rounded-[7px] bg-[#0D1F4A]"
          style={{ width: IMAGE_SIZE, height: IMAGE_SIZE }}
        >
          {product.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={product.imageUrl}
              alt={product.brand}
              draggable={false}
              className="pointer-events-none h-full w-full object-cover transition-opacity duration-200 group-hover:opacity-90"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center px-2 text-center text-sm font-extrabold text-white">
              {product.brand}
            </div>
          )}
        </div>
      </div>

      {showSku ? (
        <SkuMiddle label={middleLabel} />
      ) : (
        <FallbackMiddle
          title={product.name || product.brand}
          subtitle={product.sub || "Shop"}
        />
      )}

      {/* Footer — Flutter: CoinPriceRow for showSku, Save label for fallback */}
      {showSku ? (
        <ShopCategorySectionCoinPriceRow
          price={price}
          maxCoins={maxCoins}
          isCoinOnly={isCoinOnly}
        />
      ) : (
        <div
          className="flex shrink-0 items-center justify-center bg-gradient-to-b from-white/25 to-white/[0.08] px-2"
          style={{ height: FOOTER_HEIGHT }}
        >
          {saveLabel && (
            <span className="text-[12px] font-bold text-white">{saveLabel}</span>
          )}
        </div>
      )}
    </Link>
  );
}
