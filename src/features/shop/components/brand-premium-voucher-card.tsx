"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { useLogoColors, useTransparentLogo } from "./live-product-detail";
import { gradientFor } from "@/features/shop/utils/mappers";
import { formatPercent } from "@/features/shop/utils/checkout.utils";

export type BrandPremiumVoucherCardProps = {
  brandName: string;
  logoUrl?: string | null;
  savingsPercent?: number | null;
  footerWorth?: { label: string; value: string };
  className?: string;
};

export function BrandPremiumVoucherCard({
  brandName,
  logoUrl = null,
  savingsPercent,
  footerWorth,
  className = "",
}: BrandPremiumVoucherCardProps) {
  const fallbackG = useMemo(() => gradientFor(brandName), [brandName]);
  const g = useLogoColors(logoUrl, fallbackG);
  const transparentLogoUrl = useTransparentLogo(logoUrl);

  const cardRef = useRef<HTMLDivElement>(null);
  const [cardWidth, setCardWidth] = useState(0);

  useEffect(() => {
    if (!cardRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setCardWidth(entry.contentRect.width);
      }
    });
    observer.observe(cardRef.current);
    return () => observer.disconnect();
  }, []);

  const flatStop = useMemo(() => {
    if (cardWidth <= 0) return 0.1;
    const logoInset = 10;
    const logoMaxWidth = 188;
    const logoEndFraction = (logoInset + logoMaxWidth) / cardWidth;
    const gradientStartBias = 0.76;
    return Math.min(0.42, Math.max(0.08, logoEndFraction * gradientStartBias));
  }, [cardWidth]);

  const showDiscount = savingsPercent != null && savingsPercent > 0;

  return (
    <div
      ref={cardRef}
      className={`relative w-full aspect-[1.85/1] rounded-[14px] overflow-hidden flex flex-col ${className}`}
      style={{
        background: `linear-gradient(to top right, ${g.accent} 0%, ${g.accent} ${flatStop * 100}%, ${g.accent2} 100%)`,
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.15)",
      }}
    >
      {showDiscount && (
        <div
          className="absolute top-0 left-1/2 z-20 -translate-x-1/2 rounded-b-[8px] rounded-t-none border-x border-b border-white/20 px-4.5 py-1.5 font-sans text-[11px] font-extrabold uppercase tracking-wider text-white shadow-[0_2px_8px_rgba(0,0,0,0.15)]"
          style={{
            background: `linear-gradient(to right, ${g.accent2}, ${g.accent})`,
          }}
        >
          {formatPercent(savingsPercent)}% Off
        </div>
      )}

      <div className="pointer-events-none absolute inset-0 z-0 select-none overflow-hidden">
        <div
          className="absolute rounded-full"
          style={{
            left: "20%",
            top: "38%",
            width: "140%",
            height: "34%",
            transform: "rotate(45deg)",
            filter: "blur(21px)",
            background:
              "linear-gradient(to right, rgba(255,255,255,0) 0%, rgba(255,255,255,0.36) 50%, rgba(255,255,255,0) 100%)",
          }}
        />
        <div
          className="absolute rounded-full"
          style={{
            left: "18%",
            top: "34%",
            width: "72%",
            height: "14%",
            transform: "rotate(45deg)",
            filter: "blur(20px)",
            background:
              "linear-gradient(to right, rgba(255,255,255,0) 0%, rgba(255,255,255,0.14) 50%, rgba(255,255,255,0) 100%)",
          }}
        />
        <div
          className="absolute rounded-full"
          style={{
            left: "52%",
            top: "-4%",
            width: "42%",
            height: "10%",
            transform: "rotate(45deg)",
            filter: "blur(16px)",
            background:
              "linear-gradient(to right, rgba(255,255,255,0) 0%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0) 100%)",
          }}
        />
      </div>

      <div
        className={`relative z-10 flex flex-1 flex-col justify-between p-6 ${
          footerWorth ? "pb-16" : ""
        }`}
      >
        <div className="flex items-start justify-between">
          <span className="font-sans text-[20px] font-black leading-none tracking-tight text-white">
            {brandName}
          </span>
        </div>

        <div className="relative z-10 flex items-center gap-3">
          {transparentLogoUrl ? (
            <Image
              src={transparentLogoUrl}
              alt=""
              width={276}
              height={92}
              className="h-[92px] w-auto translate-y-5 object-contain"
            />
          ) : (
            <span className="text-xs font-bold uppercase tracking-[0.05em] text-white/90">
              {brandName}
            </span>
          )}
        </div>
      </div>

      {footerWorth && (
        <div className="absolute inset-x-0 bottom-0 z-20 flex items-end justify-between border-t border-white/10 bg-black/60 px-5 py-3 backdrop-blur-sm">
          <span className="pb-0.5 text-sm font-heading font-medium tracking-[0.12em] text-white/65">
            {footerWorth.label}
          </span>
          <span className="text-2xl font-semibold leading-none tracking-tight text-white">
            {footerWorth.value}
          </span>
        </div>
      )}
    </div>
  );
}
