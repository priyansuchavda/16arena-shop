"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { SwagCard } from "./swag-card";
import { FOR_YOU_CARD_WIDTH, ShopForYouCard } from "./shop-for-you-card";
import { SECTION_CARD_WIDTH, ShopCategorySectionCard } from "./shop-category-section-card";
import { ChevronLeftIcon, ChevronRightIcon } from "@/shared/components/icons";
import { CardModel } from "@/features/shop/types/shop.types";

export type ScrollRowCard = "swag" | "forYou" | "section";

const FOR_YOU_CARD_GAP = 18;
const SECTION_CARD_GAP = 14;

type AlignedRowConfig = {
  cardWidth: number;
  cardGap: number;
};

function getAlignedRowConfig(card: ScrollRowCard): AlignedRowConfig | null {
  if (card === "forYou") return { cardWidth: FOR_YOU_CARD_WIDTH, cardGap: FOR_YOU_CARD_GAP };
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
  const alignedRow = getAlignedRowConfig(card);

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
      const step = alignedRow.cardWidth + alignedRow.cardGap;
      const max = el.scrollWidth - el.clientWidth;
      const target =
        dir === 1 ? Math.min(el.scrollLeft + step, max) : Math.max(0, el.scrollLeft - step);
      el.scrollTo({ left: target, behavior: "smooth" });
      return;
    }

    el.scrollBy({ left: dir * 320, behavior: "smooth" });
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
    card === "section" ? ShopCategorySectionCard : card === "forYou" ? ShopForYouCard : SwagCard;

  const navBtn =
    "flex h-8 w-10 items-center justify-center rounded-full bg-[var(--surface)] transition-colors duration-200";

  const navBtnState = (active: boolean) =>
    active ? "text-white hover:bg-white/14" : "text-[var(--muted)]";

  const inner = (
    <>
      <div className="mb-4 flex items-center justify-between gap-4">
        <h2 className="font-heading text-[20px] font-extrabold tracking-[-0.01em] text-white">{title}</h2>
        <div className="flex shrink-0 gap-2">
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
        className={`shop-scroll flex overflow-x-auto px-0 pb-2 pt-2 ${
          alignedRow
            ? "snap-x snap-mandatory scroll-smooth"
            : "-mx-1 gap-3 px-1"
        }`}
        style={alignedRow ? { gap: alignedRow.cardGap } : undefined}
      >
        {items.map((p, i) =>
          alignedRow ? (
            <div
              key={p.id}
              className={`shrink-0 ${i === items.length - 1 ? "snap-end" : "snap-start"}`}
            >
              <Card product={p} />
            </div>
          ) : (
            <Card key={p.id} product={p} />
          ),
        )}
      </div>
    </>
  );

  return (
    <section id={id} className="mt-9 scroll-mt-24">
      {boxed ? (
        <div className="rounded-[22px] bg-[var(--surface)]/60 px-5 py-5">{inner}</div>
      ) : (
        inner
      )}
    </section>
  );
}
