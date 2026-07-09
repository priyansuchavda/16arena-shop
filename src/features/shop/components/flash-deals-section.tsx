"use client";

import bannerBg from "@/assets/png/flash-deal-banner-bg.jpg";
import leftStar from "@/assets/svg/left-star-deal.svg";
import rightStar from "@/assets/svg/right-star-deal.svg";
import { FlashDealsCarousel } from "./flash-deals-carousel";
import { CardModel } from "@/features/shop/types/shop.types";

export function FlashDealsSection({
  items,
  title = "Flash Deals",
  ctaLabel = "Hurry! Up to 50% OFF Ends Today",
  bannerUrl,
  ctaColor = "#2b2bf5",
  onCtaClick,
}: {
  items: CardModel[];
  title?: string;
  ctaLabel?: string;
  bannerUrl?: string;
  ctaColor?: string;
  onCtaClick?: () => void;
}) {
  if (!items.length) return null;

  const bg = bannerUrl || bannerBg.src;

  return (
    <section>
      <div
        className="relative overflow-hidden rounded-[20px] border border-white/10 bg-[#0a0d2e]"
        style={{
          backgroundImage: `url("${bg}")`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="relative z-10 flex flex-col gap-5 py-6 lg:py-7">
          {/* Title flanked by stars */}
          <div className="flex items-center justify-center gap-3 px-5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={leftStar.src} alt="" aria-hidden className="h-[26px] w-auto shrink-0" />
            <h2 className="font-heading text-[22px] font-extrabold tracking-[-0.01em] text-white lg:text-[26px]">
              {title}
            </h2>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={rightStar.src} alt="" aria-hidden className="h-[26px] w-auto shrink-0" />
          </div>

          {/* Featured cards — center-focused, auto-playing, infinite coverflow */}
          <FlashDealsCarousel items={items} />

          {/* CTA */}
          <div className="flex justify-center px-5">
            <button
              type="button"
              onClick={onCtaClick}
              style={{
                background: `linear-gradient(90deg, ${ctaColor} 0%, color-mix(in srgb, ${ctaColor} 62%, #ffffff) 50%, ${ctaColor} 100%)`,
              }}
              className="group relative w-full max-w-[520px] overflow-hidden rounded-[10px] py-3 text-center text-[15px] font-bold tracking-[0.01em] text-white transition-transform duration-200 hover:brightness-110 active:scale-[0.99]"
            >
              <span className="relative z-10">{ctaLabel}</span>
              {/* Looping shine sweep */}
              <span
                aria-hidden
                className="pointer-events-none absolute inset-y-0 left-0 w-1/4 bg-gradient-to-r from-transparent via-white/55 to-transparent blur-[2px] animate-[cta-shine_3s_ease-in-out_infinite]"
              />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
