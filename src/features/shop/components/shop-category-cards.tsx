"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { CategoryNavIcon } from "./category-nav-icon";
import { ShopCategoryCard } from "./shop-category-card";
import { ChevronLeftIcon, ChevronRightIcon } from "@/shared/components/icons";
import type { CategoryChip } from "@/features/shop/utils/shop-catalog";

export type ShopCategoryChip = CategoryChip;

type ShopCategoryCardsProps = {
  categories: ShopCategoryChip[];
  /** Full category list shown in the View All modal. Defaults to `categories`. */
  allCategories?: ShopCategoryChip[];
  selectedSlug: string;
  onCategoryTap: (slug: string) => void;
};

const DESKTOP_STEP = 96; // 81 card + ~15 gap

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

  // The mobile strip and desktop row are both mounted (CSS-gated with lg:),
  // so each needs its own View All anchor; the popover uses the visible one.
  const viewAllRef = useRef<HTMLDivElement>(null);
  const viewAllRefMobile = useRef<HTMLDivElement>(null);
  const desktopScrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [dragging, setDragging] = useState(false);

  const downRef = useRef(false);
  const capturedRef = useRef(false);
  const movedRef = useRef(false);
  const startXRef = useRef(0);
  const startScrollRef = useRef(0);

  const POPOVER_WIDTH = 380;

  const updateArrowState = useCallback(() => {
    const el = desktopScrollRef.current;
    if (!el) return;
    const maxScroll = el.scrollWidth - el.clientWidth;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(maxScroll > 4 && el.scrollLeft < maxScroll - 4);
  }, []);

  const scrollDesktop = (dir: -1 | 1) => {
    const el = desktopScrollRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * DESKTOP_STEP * 3, behavior: "smooth" });
  };

  useEffect(() => {
    const el = desktopScrollRef.current;
    if (!el) return;
    updateArrowState();
    el.addEventListener("scroll", updateArrowState, { passive: true });
    const observer = new ResizeObserver(updateArrowState);
    observer.observe(el);
    return () => {
      el.removeEventListener("scroll", updateArrowState);
      observer.disconnect();
    };
  }, [categories.length, updateArrowState]);

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    const el = desktopScrollRef.current;
    if (!el) return;
    downRef.current = true;
    capturedRef.current = false;
    movedRef.current = false;
    startXRef.current = e.clientX;
    startScrollRef.current = el.scrollLeft;
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!downRef.current) return;
    const el = desktopScrollRef.current;
    if (!el) return;
    const dx = e.clientX - startXRef.current;
    if (!capturedRef.current && Math.abs(dx) > 6) {
      capturedRef.current = true;
      movedRef.current = true;
      setDragging(true);
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
      e.preventDefault();
    }
    if (capturedRef.current) {
      e.preventDefault();
      el.scrollLeft = startScrollRef.current - dx;
    }
  };

  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!downRef.current) return;
    downRef.current = false;
    if (!capturedRef.current) return;
    capturedRef.current = false;
    setDragging(false);
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
  };

  const onClickCapture = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!movedRef.current) return;
    e.preventDefault();
    e.stopPropagation();
    movedRef.current = false;
  };

  const positionPopover = useCallback(() => {
    // Anchor to whichever View All button is actually visible at this breakpoint.
    const anchor = [viewAllRef.current, viewAllRefMobile.current].find(
      (el) => el && el.getBoundingClientRect().width > 0,
    );
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

  // `compact` renders the phone-sized chip (64×63, 32px icon); the desktop
  // row keeps the original 81×80 cards with 42px icons.
  const renderCategoryButton = (category: ShopCategoryChip, compact = false) => {
    const isSelected = category.slug === selectedSlug;
    const iconSize = compact ? 32 : 42;

    const icon = (
      <span
        className="flex items-center justify-center"
        style={{ width: iconSize, height: iconSize }}
      >
        <CategoryNavIcon
          slug={category.slug}
          label={category.label}
          active={isSelected}
          size={iconSize}
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
        width={compact ? 64 : 81}
        height={compact ? 63 : 80}
        onClick={() => onCategoryTap(category.slug)}
      />
    );
  };

  const renderViewAllButton = (compact = false) => {
    return (
      <div ref={compact ? viewAllRefMobile : viewAllRef} className="relative shrink-0">
        <ShopCategoryCard
          label="View All"
          variant="viewAll"
          selected={false}
          className={isOpen ? "invisible" : ""}
          onClick={handleOpen}
          aria-expanded={isOpen}
          aria-label="View all categories"
          width={compact ? 64 : 81}
          height={compact ? 63 : 80}
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

  const navBtn =
    "flex h-8 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--surface)] transition-colors duration-200";
  const navBtnState = (active: boolean) =>
    active ? "text-white hover:bg-white/14" : "pointer-events-none text-[var(--muted)] opacity-40";

  return (
    <>
      {/* Mobile: CSS-gated (lg:hidden) native scroll strip. Because it's pure
          CSS + native overflow scrolling, swiping never depends on JS having
          hydrated — same mechanism as the product rails. */}
      <div
        className="shop-scroll flex min-w-0 w-full gap-2.5 overflow-x-auto py-1 select-none flex-nowrap lg:hidden"
        style={{ touchAction: "pan-x pan-y" }}
      >
        {categories.map((category) => renderCategoryButton(category, true))}
        {renderViewAllButton(true)}
      </div>

      {/* Desktop: horizontal scroll with drag + arrow controls (scrollbars are hidden). */}
      <div className="hidden min-w-0 w-full items-center gap-3 py-1 lg:flex">
        <button
          type="button"
          aria-label="Scroll categories left"
          onClick={() => scrollDesktop(-1)}
          className={`${navBtn} ${navBtnState(canScrollLeft)}`}
        >
          <ChevronLeftIcon size={15} />
        </button>

        <div
          ref={desktopScrollRef}
          className={`shop-scroll flex min-w-0 flex-1 gap-3 overflow-x-auto select-none flex-nowrap [-webkit-user-drag:none] ${
            dragging ? "cursor-grabbing scroll-auto" : "cursor-grab scroll-smooth"
          }`}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onDragStartCapture={(e) => e.preventDefault()}
          onClickCapture={onClickCapture}
        >
          {categories.map((category) => renderCategoryButton(category))}
          {renderViewAllButton()}
        </div>

        <button
          type="button"
          aria-label="Scroll categories right"
          onClick={() => scrollDesktop(1)}
          className={`${navBtn} ${navBtnState(canScrollRight)}`}
        >
          <ChevronRightIcon size={15} />
        </button>
      </div>

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
