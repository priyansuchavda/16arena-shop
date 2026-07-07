"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { categoryImageFor } from "@/features/shop/utils/category-icons";
import { CategoryNavIcon } from "./category-nav-icon";

export type ShopCategoryChip = {
  label: string;
  slug: string;
  iconUrl?: string | null;
};

type ShopCategoryCardsProps = {
  categories: ShopCategoryChip[];
  selectedSlug: string;
  onCategoryTap: (slug: string) => void;
};

export function ShopCategoryCards({
  categories,
  selectedSlug,
  onCategoryTap,
}: ShopCategoryCardsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  return (
    <>
      <div
        ref={scrollRef}
        className="shop-scroll flex min-w-0 w-full gap-3 overflow-x-auto py-1 select-none"
      >
        {categories.map((category) => {
          const isSelected = category.slug === selectedSlug;
          const image = categoryImageFor(category.slug, category.label);

          return (
            <button
              key={category.slug}
              type="button"
              onClick={() => onCategoryTap(category.slug)}
              className={[
                "group relative flex h-[72px] w-[73px] shrink-0 flex-col justify-between overflow-hidden rounded-[9px] border text-center transition-all duration-200 active:scale-95",
                isSelected
                  ? "border-[#FF973C] shadow-[0_4px_12px_rgba(255,151,60,0.15)]"
                  : "border-white/20 bg-white/[0.03] hover:border-white/40",
              ].join(" ")}
              style={
                isSelected
                  ? {
                      background:
                        "radial-gradient(105% 105% at 50% 68%, rgba(255, 106, 0, 0.6) 0%, #6B3018 52%, #3A1A0A 100%)",
                    }
                  : undefined
              }
            >
              <div className="relative flex flex-1 items-center justify-center">
                <div
                  className={[
                    "pointer-events-none absolute bottom-1 h-[12px] w-[40px] rounded-full opacity-80 mix-blend-screen transition-all duration-200",
                    isSelected ? "bg-[#FF973C] blur-[15px]" : "bg-[#D9D9D9] blur-[12px]",
                  ].join(" ")}
                  aria-hidden
                />
                <div
                  className={[
                    "pointer-events-none absolute bottom-1 h-[3px] w-[40px] rounded-full mix-blend-screen transition-all duration-200",
                    isSelected ? "bg-[#FF973C] blur-[4px]" : "bg-[#D9D9D9] blur-[3px]",
                  ].join(" ")}
                  aria-hidden
                />

                {image ? (
                  <Image
                    src={image}
                    alt=""
                    width={42}
                    height={42}
                    className="relative z-10 object-contain transition-transform group-hover:scale-105"
                  />
                ) : (
                  <span className="relative z-10 flex h-[42px] w-[42px] items-center justify-center transition-transform group-hover:scale-105">
                    <CategoryNavIcon slug={category.slug} label={category.label} active={isSelected} size={42} iconUrl={category.iconUrl} />
                  </span>
                )}
              </div>

              <div
                className={[
                  "w-full border-t border-white/5 py-0.5 text-[9px] font-semibold tracking-wide text-white",
                  isSelected ? "bg-transparent" : "bg-white/[0.03]",
                ].join(" ")}
              >
                {category.label}
              </div>
            </button>
          );
        })}

        {/* View All Card */}
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="group relative flex h-[72px] w-[73px] shrink-0 flex-col justify-between overflow-hidden rounded-[9px] border text-center transition-all duration-200 active:scale-95 border-white/20 bg-white/[0.03] hover:border-white/40"
        >
          <div className="relative flex flex-1 items-center justify-center">
            <div
              className="pointer-events-none absolute bottom-1 h-[12px] w-[40px] rounded-full opacity-80 mix-blend-screen transition-all duration-200 bg-[#D9D9D9] blur-[12px]"
              aria-hidden
            />
            <div
              className="pointer-events-none absolute bottom-1 h-[3px] w-[40px] rounded-full mix-blend-screen transition-all duration-200 bg-[#D9D9D9] blur-[3px]"
              aria-hidden
            />
            <span className="relative z-10 flex h-[42px] w-[42px] items-center justify-center transition-transform group-hover:scale-105 text-white/70">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="3" y="3" width="4" height="4" rx="1.5" fill="currentColor"/>
                <rect x="10" y="3" width="4" height="4" rx="1.5" fill="currentColor"/>
                <rect x="17" y="3" width="4" height="4" rx="1.5" fill="currentColor"/>
                <rect x="3" y="10" width="4" height="4" rx="1.5" fill="currentColor"/>
                <rect x="10" y="10" width="4" height="4" rx="1.5" fill="currentColor"/>
                <rect x="17" y="10" width="4" height="4" rx="1.5" fill="currentColor"/>
                <rect x="3" y="17" width="4" height="4" rx="1.5" fill="currentColor"/>
                <rect x="10" y="17" width="4" height="4" rx="1.5" fill="currentColor"/>
                <rect x="17" y="17" width="4" height="4" rx="1.5" fill="currentColor"/>
              </svg>
            </span>
          </div>
          <div className="w-full border-t border-white/5 py-0.5 text-[9px] font-semibold tracking-wide text-white bg-white/[0.03]">
            View All
          </div>
        </button>
      </div>

      {/* Bottom Popup Dialog */}
      {isOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-end justify-center bg-black/75 backdrop-blur-[4px] p-4 animate-in fade-in duration-200"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="w-full max-w-[380px] bg-[#141414] border border-white/10 rounded-[28px] p-6 mb-6 shadow-2xl animate-in slide-in-from-bottom-8 duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="grid grid-cols-3 gap-x-3 gap-y-8">
              {categories.map((c) => {
                const isSelected = c.slug === selectedSlug;
                return (
                  <button
                    key={c.slug}
                    type="button"
                    onClick={() => {
                      onCategoryTap(c.slug);
                      setIsOpen(false);
                    }}
                    className="flex flex-col items-center gap-2 text-center group focus:outline-none"
                  >
                    <span className="flex h-12 w-12 items-center justify-center transition-transform duration-200 group-hover:scale-105">
                      <CategoryNavIcon
                        slug={c.slug}
                        label={c.label}
                        active={isSelected}
                        size={42}
                        iconUrl={c.iconUrl}
                      />
                    </span>
                    <span
                      className="max-w-[90px] truncate text-[10px] font-bold uppercase tracking-wider transition-colors duration-200"
                      style={{ color: isSelected ? "#FF973C" : "rgba(255, 255, 255, 0.75)" }}
                    >
                      {c.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
