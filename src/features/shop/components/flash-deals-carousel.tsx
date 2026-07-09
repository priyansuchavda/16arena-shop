"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { CardModel } from "@/features/shop/types/shop.types";
import { productDealCaption } from "@/features/shop/utils/mappers";

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

// Cards render at CENTER size and scale DOWN, so the focus card stays crisp.
const KN = NEIGHBOR / CENTER;
const KO = BASE / CENTER;
// Extra half-width (vs BASE) of the center / neighbor cards — drives the push.
const E0 = (CENTER - BASE) / 2;
const E1 = (NEIGHBOR - BASE) / 2;

/** Prefix a bare hex ("81A600") with "#"; pass rgb()/named/#-prefixed through. */
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

export function FlashDealsCarousel({ items }: { items: CardModel[] }) {
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

  if (!n) return null;

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
    }
    if (capturedRef.current) {
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

        const imageSrc = product.featureImageUrl || product.imageUrl;
        const label = productDealCaption(product);
        const labelFill = product.featureColor
          ? normalizeColor(product.featureColor)
          : "#141414";

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
              href={`/shop/${product.slug}`}
              draggable={false}
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
              className="group relative block h-full w-full overflow-hidden rounded-[18px] border border-white/12 bg-white/[0.05]"
            >
              {imageSrc ? (
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
                  <span className="px-4 text-center text-lg font-extrabold text-white">
                    {product.brand}
                  </span>
                </div>
              )}

              {/* Solid label with a smooth concave top edge (SVG = crisp at any scale) */}
              <div
                className="pointer-events-none absolute inset-x-0 bottom-0"
                style={{ height: LABEL_H }}
              >
                <svg
                  viewBox={`0 0 100 ${LABEL_H}`}
                  preserveAspectRatio="none"
                  className="absolute inset-0 h-full w-full"
                >
                  <path
                    d={`M0 0 Q50 ${DIP * 2} 100 0 L100 ${LABEL_H} L0 ${LABEL_H} Z`}
                    fill={labelFill}
                  />
                </svg>
                <p className="font-sans absolute inset-x-0 bottom-0 line-clamp-1 px-3 pb-3 text-center text-[13px] font-medium text-white">
                  {label}
                </p>
              </div>
            </Link>
          </div>
        );
      })}
    </div>
  );
}
