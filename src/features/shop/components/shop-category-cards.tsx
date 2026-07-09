"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import { categoryImageFor } from "@/features/shop/utils/category-icons";
import { CategoryNavIcon } from "./category-nav-icon";
import { ShopCategoryCard } from "./shop-category-card";

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
  const [popoverPos, setPopoverPos] = useState<{
    top: number;
    left: number;
    width: number;
    maxHeight: number;
  } | null>(null);

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

    const maxHeight = Math.min(window.innerHeight * 0.8, 640);
    const padding = 16;
    let top = rect.top;
    const maxTop = window.innerHeight - maxHeight - padding;
    top = Math.min(top, maxTop);
    top = Math.max(padding, top);

    return {
      top,
      left,
      width,
      maxHeight,
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

    const icon = image ? (
      <Image src={image} alt="" width={42} height={42} className="object-contain" />
    ) : (
      <span className="flex h-[42px] w-[42px] items-center justify-center">
        <CategoryNavIcon
          slug={category.slug}
          label={category.label}
          active={isSelected}
          size={42}
          iconUrl={category.iconUrl}
        />
      </span>
    );

    return (
      <ShopCategoryCard
        key={category.slug}
        label={category.label}
        icon={icon}
        selected={isSelected}
        onClick={() => onCategoryTap(category.slug)}
      />
    );
  };

  const renderViewAllButton = () => {
    return (
      <div ref={viewAllRef} className="relative shrink-0">
        <ShopCategoryCard
          label="View All"
          variant="viewAll"
          selected={false}
          className={isOpen ? "invisible" : ""}
          onClick={handleOpen}
          aria-expanded={isOpen}
          aria-label="View all categories"
          icon={
            <span className="flex h-[23px] w-[26.5px] items-center justify-center text-[#D9D9D9]">
              <svg
                width="24"
                height="21"
                viewBox="0 0 46 40"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="h-full w-full"
                aria-hidden
              >
                <circle cx="2.88026" cy="2.88026" r="2.88026" transform="matrix(1 0 0 -1 0 5.75977)" fill="currentColor" />
                <circle cx="2.88026" cy="2.88026" r="2.88026" transform="matrix(1 0 0 -1 19.793 5.75977)" fill="currentColor" />
                <circle cx="2.88026" cy="2.88026" r="2.88026" transform="matrix(1 0 0 -1 39.5859 5.75977)" fill="currentColor" />
                <circle cx="2.88026" cy="2.88026" r="2.88026" transform="matrix(1 0 0 -1 0 22.7461)" fill="currentColor" />
                <circle cx="2.88026" cy="2.88026" r="2.88026" transform="matrix(1 0 0 -1 19.793 22.7461)" fill="currentColor" />
                <circle cx="2.88026" cy="2.88026" r="2.88026" transform="matrix(1 0 0 -1 39.5859 22.7461)" fill="currentColor" />
                <circle cx="2.88026" cy="2.88026" r="2.88026" transform="matrix(1 0 0 -1 0 39.7324)" fill="currentColor" />
                <circle cx="2.88026" cy="2.88026" r="2.88026" transform="matrix(1 0 0 -1 19.793 39.7324)" fill="currentColor" />
                <circle cx="2.88026" cy="2.88026" r="2.88026" transform="matrix(1 0 0 -1 39.5859 39.7324)" fill="currentColor" />
              </svg>
            </span>
          }
        />
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
            className="fixed z-[100] flex flex-col overflow-hidden rounded-[28px] border border-white/10 bg-[#141414] p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200"
            style={{
              top: popoverPos.top,
              left: popoverPos.left,
              width: popoverPos.width,
              height: popoverPos.maxHeight,
              maxHeight: popoverPos.maxHeight,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="shop-popover-scroll min-h-0 flex-1 overflow-y-auto pr-2">
              <div className="grid grid-cols-3 gap-x-3 gap-y-8 pb-2">
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
                        style={{ color: "#FFFFFF" }}
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
