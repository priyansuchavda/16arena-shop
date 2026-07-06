"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { categoryImageFor } from "@/features/shop/utils/category-icons";
import { CategoryNavIcon } from "./category-nav-icon";
import { ChevronLeftIcon, ChevronRightIcon } from "@/shared/components/icons";

export type ShopCategoryChip = {
  label: string;
  slug: string;
};

type ShopCategoryCardsProps = {
  categories: ShopCategoryChip[];
  selectedSlug: string;
  onCategoryTap: (slug: string) => void;
};

const CHIP_WIDTH = 73;
const CHIP_GAP = 12;

export function ShopCategoryCards({
  categories,
  selectedSlug,
  onCategoryTap,
}: ShopCategoryCardsProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateArrowState = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const maxScroll = el.scrollWidth - el.clientWidth;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(maxScroll > 4 && el.scrollLeft < maxScroll - 4);
  }, []);

  const scroll = (dir: -1 | 1) => {
    const el = scrollRef.current;
    if (!el) return;
    const step = CHIP_WIDTH + CHIP_GAP;
    const max = el.scrollWidth - el.clientWidth;
    const target =
      dir === 1 ? Math.min(el.scrollLeft + step * 3, max) : Math.max(0, el.scrollLeft - step * 3);
    el.scrollTo({ left: target, behavior: "smooth" });
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    updateArrowState();
    el.addEventListener("scroll", updateArrowState, { passive: true });
    const observer = new ResizeObserver(updateArrowState);
    observer.observe(el);

    return () => {
      el.removeEventListener("scroll", updateArrowState);
      observer.disconnect();
    };
  }, [categories, updateArrowState]);

  const navBtn =
    "flex h-8 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--surface)] transition-colors duration-200";
  const navBtnState = (active: boolean) =>
    active ? "text-white hover:bg-white/14" : "text-[var(--muted)]";

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        aria-label="Scroll categories left"
        onClick={() => scroll(-1)}
        className={`${navBtn} ${navBtnState(canScrollLeft)}`}
      >
        <ChevronLeftIcon size={15} />
      </button>

      <div
        ref={scrollRef}
        className="shop-scroll flex min-w-0 flex-1 gap-3 overflow-x-auto py-1 select-none"
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
                    <CategoryNavIcon slug={category.slug} label={category.label} active={isSelected} size={42} />
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
      </div>

      <button
        type="button"
        aria-label="Scroll categories right"
        onClick={() => scroll(1)}
        className={`${navBtn} ${navBtnState(canScrollRight)}`}
      >
        <ChevronRightIcon size={15} />
      </button>
    </div>
  );
}
