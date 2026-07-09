"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import Image from "next/image";
import coinImg from "@/assets/png/coin.png";
import { formatCoins, formatInr } from "../utils/checkout.utils";
import {
  formatHybridPriceRow,
  resolveSectionPriceRowMode,
  type HybridFormatTier,
  type SectionPriceRowInput,
} from "../utils/shop-category-section-pricing";

const SAVE_BADGE_GREEN = "#2E9E4D";

export { SAVE_BADGE_GREEN };

type ShopCategorySectionCoinPriceRowProps = SectionPriceRowInput & {
  className?: string;
};

function CoinIcon({ size = 13 }: { size?: number }) {
  return (
    <Image
      src={coinImg}
      alt=""
      width={size}
      height={size}
      className="shrink-0 object-contain"
      style={{ width: size, height: size }}
    />
  );
}

function CoinOnlyRow({ maxCoins }: { maxCoins: number }) {
  return (
    <div className="inline-flex items-center justify-center gap-1">
      <CoinIcon />
      <span className="text-[12px] font-bold tabular-nums text-[#FBCD00]">
        {formatCoins(maxCoins)}
      </span>
    </div>
  );
}

function HybridPriceRow({ price, maxCoins }: { price: number; maxCoins: number }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const [tier, setTier] = useState<HybridFormatTier>(0);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    setTier(0);
    setScale(1);
  }, [price, maxCoins]);

  useLayoutEffect(() => {
    const container = containerRef.current;
    const inner = innerRef.current;
    if (!container || !inner) return;

    const fit = () => {
      const available = container.clientWidth;
      if (available <= 0) return;

      if (inner.scrollWidth <= available) {
        if (scale !== 1) setScale(1);
        return;
      }

      if (tier < 2) {
        setTier((current) => (current + 1) as HybridFormatTier);
        return;
      }

      const nextScale = Math.min(1, available / inner.scrollWidth);
      if (Math.abs(nextScale - scale) > 0.01) {
        setScale(nextScale);
      }
    };

    fit();

    const observer = new ResizeObserver(fit);
    observer.observe(container);
    return () => observer.disconnect();
  }, [tier, price, maxCoins, scale]);

  const { priceText, coinsText } = formatHybridPriceRow(price, maxCoins, tier);

  return (
    <div ref={containerRef} className="flex w-full justify-center overflow-hidden">
      <div
        ref={innerRef}
        className="inline-flex w-max max-w-none items-center justify-center gap-1 origin-center whitespace-nowrap"
        style={{ transform: `scale(${scale})` }}
      >
        <span className="text-[12px] font-bold text-white">{priceText}</span>
        <span className="text-[12px] font-bold text-white">+</span>
        <CoinIcon />
        <span className="text-[12px] font-bold tabular-nums text-[#FBCD00]">{coinsText}</span>
      </div>
    </div>
  );
}

export function ShopCategorySectionCoinPriceRow({
  price,
  maxCoins,
  isCoinOnly,
  className = "",
}: ShopCategorySectionCoinPriceRowProps) {
  const mode = resolveSectionPriceRowMode({ price, maxCoins, isCoinOnly });

  return (
    <div
      className={`flex h-[29px] shrink-0 items-center justify-center bg-gradient-to-b from-white/25 to-white/[0.08] px-2 ${className}`}
    >
      {mode === "free" && (
        <span className="text-[12px] font-bold text-white">Free</span>
      )}
      {mode === "inr" && price != null && price > 0 && (
        <span className="text-[12px] font-bold text-white">{formatInr(price)}</span>
      )}
      {mode === "coins" && maxCoins != null && maxCoins > 0 && (
        <CoinOnlyRow maxCoins={maxCoins} />
      )}
      {mode === "hybrid" && price != null && maxCoins != null && (
        <HybridPriceRow price={price} maxCoins={maxCoins} />
      )}
    </div>
  );
}
