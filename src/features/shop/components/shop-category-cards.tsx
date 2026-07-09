"use client";

import { useState, useEffect, useRef, useCallback } from "react";
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
  const [popoverPos, setPopoverPos] = useState<{ top: number; left: number; width: number } | null>(null);

  const parentRef = useRef<HTMLDivElement>(null);
  const viewAllRef = useRef<HTMLDivElement>(null);
  const [visibleCount, setVisibleCount] = useState(5);
  const [isMobile, setIsMobile] = useState(false);

  const POPOVER_WIDTH = 380;

  const positionPopover = useCallback(() => {
    const anchor = viewAllRef.current;
    if (!anchor) return null;

    const rect = anchor.getBoundingClientRect();
    const width = Math.min(POPOVER_WIDTH, window.innerWidth - 32);
    let left = rect.right - width;
    left = Math.max(16, Math.min(left, window.innerWidth - width - 16));

    return {
      top: rect.top,
      left,
      width,
    };
  }, []);

  const handleOpen = () => {
    const pos = positionPopover();
    if (pos) setPopoverPos(pos);
    setIsOpen(true);
  };

  const handleClose = () => {
    setIsOpen(false);
    setPopoverPos(null);
  };

  useEffect(() => {
    if (!isOpen) return;

    const onLayout = () => {
      const pos = positionPopover();
      if (pos) setPopoverPos(pos);
    };

    window.addEventListener("resize", onLayout);
    window.addEventListener("scroll", onLayout, true);
    return () => {
      window.removeEventListener("resize", onLayout);
      window.removeEventListener("scroll", onLayout, true);
    };
  }, [isOpen, positionPopover]);

  useEffect(() => {
    if (!parentRef.current) return;

    const observer = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const width = entry.contentRect.width;
        // Check if viewport is mobile size (1024px is standard lg breakpoint)
        const mobile = typeof window !== "undefined" && window.innerWidth < 1024;
        setIsMobile(mobile);

        // Parent total width is `width`.
        // View All button takes 81px + 2.56px border = 83.56px.
        // Gap between categories container and View All is 12px.
        // Available space for categories is width - 83.56 - 12 = width - 95.56.
        // Within this space, we fit n categories: 95.56n - 12 <= width - 95.56
        // 95.56n <= width - 83.56.
        // Let's use 96 to be safe: fitCount = Math.floor((width - 84) / 96);
        const fitCount = Math.floor((width - 84) / 96);
        setVisibleCount(Math.max(1, fitCount));
      }
    });

    observer.observe(parentRef.current);
    return () => observer.disconnect();
  }, [categories.length]);

  const renderCategoryButton = (category: ShopCategoryChip) => {
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
        <div className="relative flex flex-1 items-center justify-center overflow-hidden">
          <div
            className={[
              "pointer-events-none absolute bottom-0 h-[12px] w-[40px] translate-y-1/2 rounded-full opacity-80 mix-blend-screen transition-all duration-200",
              isSelected ? "bg-[#FF973C] blur-[15px]" : "bg-[#D9D9D9] blur-[12px]",
            ].join(" ")}
            aria-hidden
          />
          <div
            className={[
              "pointer-events-none absolute bottom-0 h-[3px] w-[40px] translate-y-1/2 rounded-full mix-blend-screen transition-all duration-200",
              isSelected ? "bg-[#FF973C] blur-[4px]" : "bg-[#D9D9D9] blur-[5px]",
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

        <div className={[
          "w-full py-1 font-semibold text-white bg-black/40 truncate px-0.5",
          category.label.length > 10 ? "text-[7.5px] tracking-tighter" : "text-[9px] tracking-wide"
        ].join(" ")}>
          {category.label}
        </div>
      </button>
    );
  };

  const renderViewAllButton = () => {
    return (
      <div ref={viewAllRef} className="relative shrink-0">
        <button
          type="button"
          onClick={handleOpen}
          aria-expanded={isOpen}
          className={[
            "group relative flex h-[80px] w-[81px] shrink-0 flex-col justify-between overflow-hidden rounded-[9px] text-center transition-all duration-200 active:scale-95 hover:brightness-110",
            isOpen ? "invisible" : "",
          ].join(" ")}
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
    );
  };

  return (
    <>
      {isMobile ? (
        <div className="shop-scroll flex min-w-0 w-full gap-3 overflow-x-auto py-1 select-none flex-nowrap">
          {categories.map((category) => renderCategoryButton(category))}
          {renderViewAllButton()}
        </div>
      ) : (
        <div ref={parentRef} className="flex min-w-0 w-full gap-3 justify-start items-center select-none py-1">
          {/* Categories container which hides overflow */}
          <div className={`flex overflow-hidden ${categories.length > visibleCount ? "flex-1 justify-between" : "gap-3"}`}>
            {categories.slice(0, visibleCount).map((category) => renderCategoryButton(category))}
          </div>

          {/* View All Button */}
          {renderViewAllButton()}
        </div>
      )}

      {/* Category popover — opens at View All button position */}
      {isOpen && popoverPos && (
        <>
          <div
            className="fixed inset-0 z-[99] bg-black/75 backdrop-blur-[4px] animate-in fade-in duration-200"
            onClick={handleClose}
          />
          <div
            className="fixed z-[100] flex max-h-[min(80vh,640px)] flex-col rounded-[28px] border border-white/10 bg-[#141414] p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200"
            style={{
              top: popoverPos.top,
              left: popoverPos.left,
              width: popoverPos.width,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="shop-popover-scroll min-h-0 flex-1 pr-1">
              <div className="grid grid-cols-3 gap-x-3 gap-y-8 pb-1">
                {modalCategories.map((c) => {
                  const isSelected = c.slug === selectedSlug;
                  return (
                    <button
                      key={c.slug}
                      type="button"
                      onClick={() => {
                        onCategoryTap(c.slug);
                        handleClose();
                      }}
                      className="group flex flex-col items-center gap-2 text-center focus:outline-none"
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
        </>
      )}
    </>
  );
}
