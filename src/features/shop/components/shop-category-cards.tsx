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
  /** Full category list shown in the View All modal. Defaults to `categories`. */
  allCategories?: ShopCategoryChip[];
  selectedSlug: string;
  onCategoryTap: (slug: string) => void;
};

export function ShopCategoryCards({
  categories,
  allCategories,
  selectedSlug,
  onCategoryTap,
}: ShopCategoryCardsProps) {
  const modalCategories = allCategories ?? categories;
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
                "group relative flex h-[80px] w-[81px] shrink-0 flex-col justify-between overflow-hidden rounded-[9px] text-center transition-all duration-200 active:scale-95",
                isSelected
                  ? "shadow-[0_4px_12px_rgba(255,151,60,0.15)]"
                  : "hover:brightness-110",
              ].join(" ")}
              style={
                isSelected
                  ? {
                      border: "1.28px solid #FF973C",
                      background:
                        "radial-gradient(105% 105% at 50% 68%, rgba(255, 106, 0, 0.6) 0%, #6B3018 52%, #3A1A0A 100%)",
                    }
                  : {
                      border: "1.28px solid transparent",
                      backgroundImage: "linear-gradient(rgba(255,255,255,0.03), rgba(255,255,255,0.03)), linear-gradient(to top right, rgba(255, 255, 255, 0.19), rgba(255, 255, 255, 0.04))",
                      backgroundOrigin: "border-box",
                      backgroundClip: "padding-box, border-box",
                    }
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

              <div className="w-full py-1 text-[9px] font-semibold tracking-wide text-white bg-black/40">
                {category.label}
              </div>
            </button>
          );
        })}

        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="group relative flex h-[80px] w-[81px] shrink-0 flex-col justify-between overflow-hidden rounded-[9px] text-center transition-all duration-200 active:scale-95 hover:brightness-110"
          style={{
            border: "1.28px solid transparent",
            backgroundImage: "linear-gradient(rgba(255,255,255,0.03), rgba(255,255,255,0.03)), linear-gradient(to top right, rgba(255, 255, 255, 0.19), rgba(255, 255, 255, 0.04))",
            backgroundOrigin: "border-box",
            backgroundClip: "padding-box, border-box",
          }}
        >
          <div className="relative flex flex-1 items-center justify-center pt-1.5">
            <span className="relative z-10 flex h-[23px] w-[26.5px] items-center justify-center transition-transform group-hover:scale-105 text-[#D9D9D9]">
              <svg width="24" height="21" viewBox="0 0 46 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                <circle cx="2.88026" cy="2.88026" r="2.88026" transform="matrix(1 0 0 -1 0 5.75977)" fill="currentColor"/>
                <circle cx="2.88026" cy="2.88026" r="2.88026" transform="matrix(1 0 0 -1 19.793 5.75977)" fill="currentColor"/>
                <circle cx="2.88026" cy="2.88026" r="2.88026" transform="matrix(1 0 0 -1 39.5859 5.75977)" fill="currentColor"/>
                <circle cx="2.88026" cy="2.88026" r="2.88026" transform="matrix(1 0 0 -1 0 22.7461)" fill="currentColor"/>
                <circle cx="2.88026" cy="2.88026" r="2.88026" transform="matrix(1 0 0 -1 19.793 22.7461)" fill="currentColor"/>
                <circle cx="2.88026" cy="2.88026" r="2.88026" transform="matrix(1 0 0 -1 39.5859 22.7461)" fill="currentColor"/>
                <circle cx="2.88026" cy="2.88026" r="2.88026" transform="matrix(1 0 0 -1 0 39.7324)" fill="currentColor"/>
                <circle cx="2.88026" cy="2.88026" r="2.88026" transform="matrix(1 0 0 -1 19.793 39.7324)" fill="currentColor"/>
                <circle cx="2.88026" cy="2.88026" r="2.88026" transform="matrix(1 0 0 -1 39.5859 39.7324)" fill="currentColor"/>
              </svg>
            </span>
          </div>
          <div className="w-full py-1 text-[11px] font-bold tracking-wide text-white bg-transparent">
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
            className="w-full max-w-[380px] max-h-[min(80vh,640px)] flex flex-col bg-[#141414] border border-white/10 rounded-[28px] p-6 mb-6 shadow-2xl animate-in slide-in-from-bottom-8 duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="shop-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain pr-1">
              <div className="grid grid-cols-3 gap-x-3 gap-y-8 pb-1">
                {modalCategories.map((c) => {
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
        </div>
      )}
    </>
  );
}
