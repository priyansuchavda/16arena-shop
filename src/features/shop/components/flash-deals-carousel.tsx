"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { CardModel } from "@/features/shop/types/shop.types";
import { prefetchLogoColors } from "@/features/shop/utils/logo-colors";
import { prefetchTransparentLogo } from "@/features/shop/hooks/useTransparentLogo";
import { productDealCaption } from "@/features/shop/utils/mappers";

function logoColorSource(product: CardModel): string | null {
  return product.logoUrl || product.imageUrl || null;
}

/** Warm both caches on tap so the detail voucher card paints instantly. */
function prefetchForNavigation(product: CardModel) {
  void prefetchLogoColors(logoColorSource(product));
  void prefetchTransparentLogo(product.logoUrl);
}

/** Warm logo-color cache so detail voucher paints brand gradient without blink. */
function prefetchProductLogoColors(product: CardModel) {
  void prefetchLogoColors(product.logoUrl);
  if (product.imageUrl && product.imageUrl !== product.logoUrl) {
    void prefetchLogoColors(product.imageUrl);
  }
}

// Three tiers: center biggest, ±1 a little smaller, everything else equal.
const CENTER = 220; // px — center (focused) square
const NEIGHBOR = 184; // px — immediate left/right square
const BASE = 156; // px — all other squares
const GAP = 18; // px — equal gap between every adjacent card
const SPACING = BASE + GAP; // base card center-to-center distance
const MIN_RING = 15; // repeat items until the loop has at least this many
const LABEL_H = 58; // px — label bar height (at center scale)
const DIP = 16; // px — how far the top edge dips in the middle
const AUTOPLAY_MS = 2800;
const TRANSITION = "transform 520ms cubic-bezier(0.22,1,0.36,1)";

// Mobile: native horizontal scroll (for reliable touch behavior), but the
// centered card is still visually raised like the desktop carousel.
const MOBILE_CARD = 200; // px
// scale() grows the card from its own center without pushing neighbors away,
// so it eats directly into the flex gap on both sides — kept modest to avoid
// the center card visually crowding its neighbors.
const MOBILE_CENTER_SCALE = 1.08;
const MOBILE_GAP = 16; // px
const MOBILE_AUTOPLAY_MS = 4000;

// Cards render at CENTER size and scale DOWN, so the focus card stays crisp.
const KN = NEIGHBOR / CENTER;
const KO = BASE / CENTER;
// Extra half-width (vs BASE) of the center / neighbor cards — drives the push.
const E0 = (CENTER - BASE) / 2;
const E1 = (NEIGHBOR - BASE) / 2;

/** Prefix a bare hex ("                                                                                                                  81A600") with "#"; pass rgb()/named/#-prefixed through. */
function normalizeColor(color: string): string {
  const c = color.trim();
  return /^[0-9a-fA-F]{3,8}$/.test(c) ? `#${c}` : c;
}

/** Shortest signed distance of index `raw` from center on a ring of size `n`. */
function wrapRel(raw: number, n: number): number {
  let r = ((raw % n) + n) % n;
  if (r > n / 2) r -= n;
  return r;
}

/** Scale by distance from center: 1 (center) → KN (±1) → KO (rest). */
function scaleFor(d: number): number {
  if (d <= 1) return 1 + (KN - 1) * d;
  if (d <= 2) return KN + (KO - KN) * (d - 1);
  return KO;
}

/** Outward push that keeps every edge-gap equal despite the varying sizes. */
function pushFor(d: number): number {
  if (d <= 1) return (E0 + E1) * d;
  if (d <= 2) return E0 + E1 + E1 * (d - 1);
  return E0 + 2 * E1;
}

function xFor(rel: number): number {
  return rel * SPACING + Math.sign(rel) * pushFor(Math.abs(rel));
}

function CardLabel({
  product,
}: {
  product: CardModel;
}) {
  const label = productDealCaption(product);
  const labelFill = product.featureColor
    ? normalizeColor(product.featureColor)
    : "#141414";

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0" style={{ height: LABEL_H }}>
      <svg
        viewBox={`0 0 100 ${LABEL_H}`}
        preserveAspectRatio="none"
        className="absolute inset-0 h-full w-full"
      >
        <path d={`M0 0 Q50 ${DIP * 2} 100 0 L100 ${LABEL_H} L0 ${LABEL_H} Z`} fill={labelFill} />
      </svg>
      <p className="font-sans absolute inset-x-0 bottom-0 line-clamp-1 px-3 pb-3 text-center text-[13px] font-medium text-white">
        {label}
      </p>
    </div>
  );
}

function CardMedia({ product }: { product: CardModel }) {
  const imageSrc = product.featureImageUrl || product.imageUrl;
  return imageSrc ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={imageSrc}
      alt={product.brand}
      draggable={false}
      className="absolute inset-0 h-full w-full object-cover"
    />
  ) : (
    <div
      className="absolute inset-0 flex items-center justify-center"
      style={{
        background: `linear-gradient(155deg, ${product.accent} 0%, ${product.accent2} 100%)`,
      }}
    >
      <span className="px-4 text-center text-lg font-extrabold text-white">{product.brand}</span>
    </div>
  );
}

function hrefFor(product: CardModel) {
  return product.categorySlug ? `/${product.categorySlug}/${product.slug}` : `/${product.slug}`;
}

/** Mobile: plain, native, always-works horizontal scroll with snap. */
// Copies of the item set rendered for the infinite illusion, and which copy
// (0-indexed) we park the viewport in at rest. More copies means a hard,
// fast flick has more room to travel before it could reach the real DOM
// edge and hit a wall.
const MOBILE_REPS = 9;
const MOBILE_CENTER_COPY = 4;

function MobileScroller({ items }: { items: CardModel[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [centerIndex, setCenterIndex] = useState(0);
  const interactingRef = useRef(false);

  // We need enough copies to scroll infinitely without hitting the actual DOM edges.
  const reps = items.length ? Math.max(MOBILE_REPS, Math.ceil(MIN_RING / items.length)) : 0;
  const slides = reps <= 1 ? items : Array.from({ length: reps }).flatMap(() => items);

  const cardSpan = MOBILE_CARD + MOBILE_GAP;
  const oneSetWidth = items.length * cardSpan;

  // Which slide sits nearest the viewport center right now — drives the
  // "raised center card" look, mirroring the desktop carousel's focus card.
  const updateCenterIndex = () => {
    const el = scrollRef.current;
    if (!el) return;
    const centerX = el.scrollLeft + el.clientWidth / 2 - 16;
    setCenterIndex(Math.round((centerX - MOBILE_CARD / 2) / cardSpan));
  };

  // Start scrolled into the middle copy.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el || reps < MOBILE_REPS) return;

    // px-4 adds 16px to the start.
    const centerCardX = 16 + oneSetWidth * MOBILE_CENTER_COPY + MOBILE_CARD / 2;

    // setTimeout ensures the browser has applied styles and layout before we set scrollLeft
    const id = setTimeout(() => {
      el.scrollLeft = centerCardX - el.clientWidth / 2;
    }, 0);
    return () => clearTimeout(id);
  }, [oneSetWidth, reps]);

  // Correcting scrollLeft while the browser's own momentum/snap animation is
  // still running fights that animation and shows up as jank — the faster the
  // flick, the more scroll events land mid-momentum. So instead of correcting
  // on every scroll event, wait for the scroll to actually settle (native
  // `scrollend`, or a short idle timer as a fallback) and only then re-center
  // if we've drifted into a buffer copy.
  const settleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const recenter = () => {
    const el = scrollRef.current;
    if (!el) return;
    const halfReps = Math.floor(MOBILE_REPS / 2);
    // Drifted too far left of the center copy — jump forward by one full set
    // per step until we're back within the safe middle band.
    if (el.scrollLeft < oneSetWidth * (MOBILE_CENTER_COPY - halfReps + 1)) {
      el.scrollLeft += oneSetWidth * halfReps;
    }
    // Drifted too far right — jump back by one full set.
    else if (el.scrollLeft > oneSetWidth * (MOBILE_CENTER_COPY + halfReps - 1)) {
      el.scrollLeft -= oneSetWidth * halfReps;
    }
  };

  // Scroll fires far more often than a render needs — batch center-index
  // recompute to once per frame.
  const centerRafRef = useRef<number | null>(null);
  const queueCenterUpdate = () => {
    if (centerRafRef.current != null) return;
    centerRafRef.current = requestAnimationFrame(() => {
      centerRafRef.current = null;
      updateCenterIndex();
    });
  };

  const scrolledSincePointerDownRef = useRef(false);

  const onScroll = () => {
    scrolledSincePointerDownRef.current = true;
    queueCenterUpdate();
    if (reps < MOBILE_REPS) return;
    // Fallback for browsers without `scrollend` (Safari < 17): treat a gap of
    // 120ms with no further scroll events as "settled".
    if (settleTimerRef.current) clearTimeout(settleTimerRef.current);
    settleTimerRef.current = setTimeout(recenter, 120);
  };

  // Autoplay is a self-rescheduling timer rather than a fixed-cadence
  // setInterval: any scroll activity — the user's own, or autoplay's last
  // smooth-scroll settling — pushes the next tick MOBILE_AUTOPLAY_MS further
  // out. That's what stops it from firing on top of a gesture that just
  // finished (a fixed interval keeps counting in the background regardless
  // of what the user does, so it can fire the instant a drag ends).
  const autoplayTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scheduleAutoplay = () => {
    if (autoplayTimerRef.current) clearTimeout(autoplayTimerRef.current);
    if (reps < MOBILE_REPS) return;
    autoplayTimerRef.current = setTimeout(() => {
      const el = scrollRef.current;
      if (!el || interactingRef.current) {
        scheduleAutoplay();
        return;
      }
      el.scrollBy({ left: cardSpan, behavior: "smooth" });
    }, MOBILE_AUTOPLAY_MS);
  };

  const onScrollEnd = () => {
    if (settleTimerRef.current) {
      clearTimeout(settleTimerRef.current);
      settleTimerRef.current = null;
    }
    recenter();
    updateCenterIndex();
    // Only now — once native momentum has actually finished — is it safe to
    // let autoplay drive the strip again, and its next tick starts fresh.
    interactingRef.current = false;
    scheduleAutoplay();
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    // Native `scrollend` fires once the browser's momentum/snap settles —
    // far more reliable than guessing from scroll-event gaps alone.
    el.addEventListener("scrollend", onScrollEnd);
    updateCenterIndex();
    scheduleAutoplay();
    return () => {
      el.removeEventListener("scrollend", onScrollEnd);
      if (settleTimerRef.current) clearTimeout(settleTimerRef.current);
      if (centerRafRef.current != null) cancelAnimationFrame(centerRafRef.current);
      if (autoplayTimerRef.current) clearTimeout(autoplayTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reps, cardSpan]);

  // A flick keeps scrolling under native momentum well after the finger
  // lifts, and firing autoplay mid-momentum is what caused it to fight the
  // user's own scroll. So pausing just marks interactingRef; if an actual
  // scroll follows, the resume + reschedule happens in onScrollEnd once the
  // browser confirms the strip has stopped moving. A plain tap (no scroll
  // in between) has no scrollend to rely on, so pointerup/pointercancel
  // reschedule immediately in that case only.
  const pauseAutoplay = () => {
    interactingRef.current = true;
    scrolledSincePointerDownRef.current = false;
    if (autoplayTimerRef.current) clearTimeout(autoplayTimerRef.current);
  };

  const releaseAutoplayIfTap = () => {
    if (scrolledSincePointerDownRef.current) return;
    interactingRef.current = false;
    scheduleAutoplay();
  };

  return (
    <div
      ref={scrollRef}
      onScroll={onScroll}
      onPointerDown={pauseAutoplay}
      onPointerUp={releaseAutoplayIfTap}
      onPointerCancel={releaseAutoplayIfTap}
      className="flex w-full items-center overflow-x-auto px-4 pb-2 [-webkit-overflow-scrolling:touch] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      style={{
        scrollSnapType: "x mandatory",
        gap: MOBILE_GAP,
        touchAction: "pan-x pan-y",
        // Extra vertical room so the scaled-up center card isn't clipped —
        // overflow-x-auto forces overflow-y to compute as auto too.
        paddingTop: Math.ceil((MOBILE_CARD * (MOBILE_CENTER_SCALE - 1)) / 2) + 4,
        paddingBottom: Math.ceil((MOBILE_CARD * (MOBILE_CENTER_SCALE - 1)) / 2) + 8,
      }}
    >
      {slides.map((product, i) => {
        const isCenter = i === centerIndex;
        return (
          <Link
            key={`${product.id}-${i}`}
            href={hrefFor(product)}
            onPointerDown={() => {
              prefetchForNavigation(product);
            }}
            className="group relative block shrink-0 overflow-hidden rounded-[18px] border border-white/12 bg-white/[0.05]"
            style={{
              width: MOBILE_CARD,
              height: MOBILE_CARD,
              scrollSnapAlign: "center",
              transform: isCenter ? `scale(${MOBILE_CENTER_SCALE})` : undefined,
              zIndex: isCenter ? 1 : 0,
              transition: "transform 220ms cubic-bezier(0.22,1,0.36,1)",
            }}
          >
            <CardMedia product={product} />
            <CardLabel product={product} />
          </Link>
        );
      })}
    </div>
  );
}

export function FlashDealsCarousel({ items }: { items: CardModel[] }) {
  // Prefetch once per unique card (not per carousel slide copy).
  useEffect(() => {
    for (const product of items) {
      prefetchProductLogoColors(product);
    }
  }, [items]);

  if (!items.length) return null;

  return (
    <>
      <div className="hidden md:block">
        <DesktopCarousel items={items} />
      </div>
      <div className="block md:hidden">
        <MobileScroller items={items} />
      </div>
    </>
  );
}

function DesktopCarousel({ items }: { items: CardModel[] }) {
  // Repeat items so the ring is long enough to fill a wide banner seamlessly.
  const reps = items.length ? Math.max(1, Math.ceil(MIN_RING / items.length)) : 0;
  const slides =
    reps <= 1 ? items : Array.from({ length: reps }).flatMap(() => items);
  const n = slides.length;

  const rootRef = useRef<HTMLDivElement>(null);
  const [viewport, setViewport] = useState(0);
  const [active, setActive] = useState(0);
  const [dragPx, setDragPx] = useState(0);
  const [dragging, setDragging] = useState(false);

  const downRef = useRef(false);
  const capturedRef = useRef(false);
  const movedRef = useRef(false);
  const startXRef = useRef(0);
  const dragPxRef = useRef(0);
  const hoverRef = useRef(false);

  // Measure the banner width so we render enough cards to reach both edges.
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const measure = () => setViewport(el.clientWidth);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Autoplay — paused while dragging or hovering.
  useEffect(() => {
    if (n <= 1) return;
    const id = setInterval(() => {
      if (downRef.current || hoverRef.current) return;
      setActive((a) => a + 1);
    }, AUTOPLAY_MS);
    return () => clearInterval(id);
  }, [n]);

  const pos = active - dragPx / SPACING;
  const rawHalf = viewport ? Math.ceil(viewport / 2 / SPACING) + 1 : 4;
  const half = Math.min(rawHalf, Math.floor((n - 1) / 2));

  const onPointerDown = (e: React.PointerEvent) => {
    if (n <= 1) return;
    downRef.current = true;
    capturedRef.current = false;
    movedRef.current = false;
    startXRef.current = e.clientX;
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!downRef.current) return;
    const dx = e.clientX - startXRef.current;
    if (!capturedRef.current && Math.abs(dx) > 6) {
      capturedRef.current = true;
      movedRef.current = true;
      setDragging(true);
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {}
      // Stop browser from starting a native link/image drag ghost or native scroll.
      e.preventDefault();
    }
    if (capturedRef.current) {
      e.preventDefault();
      dragPxRef.current = dx;
      setDragPx(dx);
    }
  };

  const onPointerUp = () => {
    if (!downRef.current) return;
    downRef.current = false;
    if (!capturedRef.current) return; // a tap — let the click through
    capturedRef.current = false;
    setDragging(false);
    const dx = dragPxRef.current;
    let step = Math.round(-dx / SPACING);
    if (step === 0 && Math.abs(dx) > SPACING * 0.18) step = dx < 0 ? 1 : -1;
    if (step !== 0) setActive((a) => a + step);
    dragPxRef.current = 0;
    setDragPx(0);
  };

  return (
    <div
      ref={rootRef}
      className="relative mx-auto w-full select-none overflow-hidden"
      style={{
        height: CENTER + 48,
        touchAction: "pan-y",
        cursor: dragging ? "grabbing" : "grab",
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onDragStartCapture={(e) => e.preventDefault()}
      onMouseEnter={() => (hoverRef.current = true)}
      onMouseLeave={() => (hoverRef.current = false)}
    >
      {slides.map((product, i) => {
        const rel = wrapRel(i - pos, n);
        if (Math.abs(rel) > half + 0.75) return null;

        const scale = scaleFor(Math.abs(rel));
        const x = xFor(rel);
        const z = 100 - Math.round(Math.abs(rel) * 10);
        const isCenter = Math.round(rel) === 0;

        return (
          <div
            key={`${product.id}-${i}`}
            className="absolute left-1/2 top-1/2"
            style={{
              width: CENTER,
              height: CENTER,
              transform: `translate(-50%, -50%) translateX(${x}px) scale(${scale})`,
              zIndex: z,
              transition: dragging ? "none" : TRANSITION,
            }}
          >
            <Link
              href={hrefFor(product)}
              draggable={false}
              onPointerDown={() => {
                prefetchForNavigation(product);
              }}
              onClickCapture={(e) => {
                if (movedRef.current) {
                  e.preventDefault();
                  e.stopPropagation();
                  movedRef.current = false;
                  return;
                }
                if (!isCenter) {
                  e.preventDefault();
                  e.stopPropagation();
                  setActive((cur) => cur + Math.round(rel));
                }
              }}
              onDragStart={(e) => e.preventDefault()}
              className="group relative block h-full w-full overflow-hidden rounded-[18px] border border-white/12 bg-white/[0.05]"
            >
              <CardMedia product={product} />
              <CardLabel product={product} />
            </Link>
          </div>
        );
      })}
    </div>
  );
}