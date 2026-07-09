"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { SwagCard } from "./swag-card";
import { FOR_YOU_CARD_WIDTH, ShopForYouCard } from "./shop-for-you-card";
import { SECTION_CARD_WIDTH, ShopCategorySectionCard } from "./shop-category-section-card";
import { TRAVEL_HOTEL_CARD_WIDTH, TravelHotelForYouCard } from "./travel-hotel-for-you-card";
import { ChevronLeftIcon, ChevronRightIcon } from "@/shared/components/icons";
import { CardModel } from "@/features/shop/types/shop.types";

export type ScrollRowCard = "swag" | "forYou" | "section" | "travelHotel";

const FOR_YOU_CARD_GAP = 18;
const SECTION_CARD_GAP = 14;

type AlignedRowConfig = {
  cardWidth: number;
  cardGap: number;
};

function getAlignedRowConfig(card: ScrollRowCard): AlignedRowConfig | null {
  if (card === "forYou") return { cardWidth: FOR_YOU_CARD_WIDTH, cardGap: FOR_YOU_CARD_GAP };
  if (card === "travelHotel") return { cardWidth: TRAVEL_HOTEL_CARD_WIDTH, cardGap: FOR_YOU_CARD_GAP };
  if (card === "section") return { cardWidth: SECTION_CARD_WIDTH, cardGap: SECTION_CARD_GAP };
  return null;
}

export function ScrollRow({
  title,
  items,
  id,
  boxed = false,
  card = "swag",
}: {
  title: string;
  items: CardModel[];
  id?: string;
  boxed?: boolean;
  card?: ScrollRowCard;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [dragging, setDragging] = useState(false);
  const alignedRow = getAlignedRowConfig(card);

  // Pointer drag-to-scroll (featured-style, no autoplay).
  const downRef = useRef(false);
  const capturedRef = useRef(false);
  const movedRef = useRef(false);
  const startXRef = useRef(0);
  const startScrollRef = useRef(0);

  const updateArrowState = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const maxScroll = el.scrollWidth - el.clientWidth;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(maxScroll > 4 && el.scrollLeft < maxScroll - 4);
  }, []);

  const scroll = (dir: -1 | 1) => {
    const el = ref.current;
    if (!el) return;

    if (alignedRow) {
      const firstChild = el.firstElementChild as HTMLElement | null;
      const cardWidth = firstChild ? firstChild.offsetWidth : alignedRow.cardWidth;
      const step = cardWidth + alignedRow.cardGap;
      const max = el.scrollWidth - el.clientWidth;
      const target =
        dir === 1 ? Math.min(el.scrollLeft + step, max) : Math.max(0, el.scrollLeft - step);
      el.scrollTo({ left: target, behavior: "smooth" });
      return;
    }

    el.scrollBy({ left: dir * 320, behavior: "smooth" });
  };

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    // Only primary button / touch.
    if (e.pointerType === "mouse" && e.button !== 0) return;
    const el = ref.current;
    if (!el) return;
    downRef.current = true;
    capturedRef.current = false;
    movedRef.current = false;
    startXRef.current = e.clientX;
    startScrollRef.current = el.scrollLeft;
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!downRef.current) return;
    const el = ref.current;
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
      // Stop browser from starting a native link/image drag ghost.
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

  // Kill native HTML5 drag of <a>/<img> so the row can scroll instead.
  const onDragStartCapture = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  // Suppress click on card links after a drag so we don't navigate mid-swipe.
  const onClickCapture = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!movedRef.current) return;
    e.preventDefault();
    e.stopPropagation();
    movedRef.current = false;
  };

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    updateArrowState();
    el.addEventListener("scroll", updateArrowState, { passive: true });
    const observer = new ResizeObserver(updateArrowState);
    observer.observe(el);

    return () => {
      el.removeEventListener("scroll", updateArrowState);
      observer.disconnect();
    };
  }, [items, updateArrowState]);

  if (!items.length) return null;

  const Card =
    card === "section"
      ? ShopCategorySectionCard
      : card === "forYou"
        ? ShopForYouCard
        : card === "travelHotel"
          ? TravelHotelForYouCard
          : SwagCard;

  const navBtn =
    "flex h-8 w-10 items-center justify-center rounded-full bg-[var(--surface)] transition-colors duration-200";

  const navBtnState = (active: boolean) =>
    active ? "text-white hover:bg-white/14" : "text-[var(--muted)]";

  const inner = (
    <>
      <div className="mb-4 flex items-center justify-between gap-4">
        <h2 className="font-heading text-[20px] font-extrabold tracking-[-0.01em] text-white">{title}</h2>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            aria-label={`Scroll ${title} left`}
            onClick={() => scroll(-1)}
            className={`${navBtn} ${navBtnState(canScrollLeft)}`}
          >
            <ChevronLeftIcon size={15} />
          </button>
          <button
            type="button"
            aria-label={`Scroll ${title} right`}
            onClick={() => scroll(1)}
            className={`${navBtn} ${navBtnState(canScrollRight)}`}
          >
            <ChevronRightIcon size={15} />
          </button>
        </div>
      </div>

      <div
        ref={ref}
        className={`shop-scroll flex overflow-x-auto px-0 pb-2 pt-2 select-none [-webkit-user-drag:none] ${
          alignedRow
            ? "snap-x snap-mandatory"
            : "-mx-1 gap-3 px-1"
        } ${dragging ? "cursor-grabbing scroll-auto" : "cursor-grab scroll-smooth"}`}
        style={{
          ...(alignedRow ? { gap: alignedRow.cardGap } : {}),
          // Own horizontal gestures; page can still scroll vertically outside.
          touchAction: "pan-x",
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onDragStartCapture={onDragStartCapture}
        onClickCapture={onClickCapture}
      >
        {items.map((p, i) =>
          alignedRow ? (
            <div
              key={`${p.id}-${i}`}
              className={`shrink-0 ${i === items.length - 1 ? "snap-end" : "snap-start"}`}
              style={{ width: alignedRow.cardWidth }}
            >
              <Card product={p} />
            </div>
          ) : (
            <Card key={`${p.id}-${i}`} product={p} />
          ),
        )}
      </div>
    </>
  );

  return (
    <section id={id} className="mt-6 lg:mt-8 scroll-mt-24">
      {boxed ? (
        <div className="rounded-[22px] bg-[var(--surface)]/60 px-5 py-5">{inner}</div>
      ) : (
        inner
      )}
    </section>
  );
}
