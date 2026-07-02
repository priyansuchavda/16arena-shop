"use client";

import Link from "next/link";
import type { CardModel } from "@/lib/products";

export const FOR_YOU_CARD_WIDTH = 209;
const CARD_W = FOR_YOU_CARD_WIDTH;
const CARD_H = 203;
const HEIGHT_FROM_BOTTOM = 58.42 / 202.67;
const DIP_FACTOR = 0.048;
const OVERSCAN_FACTOR = 0.14;

function curveMetrics(width: number, height: number) {
  const curveY = height * (1 - HEIGHT_FROM_BOTTOM);
  const dip = width * DIP_FACTOR;
  const overscan = width * OVERSCAN_FACTOR;
  return { curveY, dip, overscan };
}

function curveLine(width: number, height: number) {
  const { curveY, dip, overscan } = curveMetrics(width, height);
  return `M ${-overscan} ${curveY} C ${width * 0.32} ${curveY + dip} ${width * 0.68} ${curveY + dip} ${width + overscan} ${curveY}`;
}

function imageClipPath(width: number, height: number) {
  const { curveY, dip } = curveMetrics(width, height);
  return `path('M 0 0 H ${width} V ${curveY} C ${width * 0.68} ${curveY + dip} ${width * 0.32} ${curveY + dip} 0 ${curveY} Z')`;
}

function footerClipPath(width: number, height: number) {
  const { curveY, dip } = curveMetrics(width, height);
  return `path('M 0 ${curveY} C ${width * 0.32} ${curveY + dip} ${width * 0.68} ${curveY + dip} ${width} ${curveY} V ${height} H 0 Z')`;
}

function lerpToBlack(hex: string, t: number): string {
  let h = hex.replace("#", "");
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  const n = parseInt(h, 16);
  const r = Math.round(((n >> 16) & 255) * (1 - t));
  const g = Math.round(((n >> 8) & 255) * (1 - t));
  const b = Math.round((n & 255) * (1 - t));
  return `rgb(${r},${g},${b})`;
}

function footerColor(product: CardModel): string {
  const base = product.accent || product.accent2;
  if (!base) return "#141414";
  return lerpToBlack(base, 0.62);
}

export function ShopForYouCard({ product }: { product: CardModel }) {
  const caption = product.brand;
  const footerFill = footerColor(product);
  const imageClip = imageClipPath(CARD_W, CARD_H);
  const footerClip = footerClipPath(CARD_W, CARD_H);
  const strokePath = curveLine(CARD_W, CARD_H);

  return (
    <Link
      href={`/products/${product.slug}`}
      className="shop-card-lift group relative block h-[203px] w-[209px] shrink-0 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.05]"
    >
      {/* Image layer — clipped along bottom curve */}
      <div
        className="absolute inset-0 overflow-hidden"
        style={{ clipPath: imageClip, WebkitClipPath: imageClip }}
      >
        {product.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.imageUrl}
            alt={caption}
            className="h-full w-full object-cover transition-opacity duration-300 group-hover:opacity-95"
          />
        ) : (
          <div
            className="flex h-full w-full items-center justify-center"
            style={{
              background: `linear-gradient(155deg, ${product.accent} 0%, ${product.accent2} 100%)`,
            }}
          >
            <span className="px-4 text-center text-lg font-extrabold text-white [text-shadow:0_2px_8px_rgba(0,0,0,0.35)]">
              {caption}
            </span>
          </div>
        )}
      </div>

      {/* Footer color block — clipped along top curve */}
      <div
        className="absolute inset-0"
        style={{
          backgroundColor: footerFill,
          clipPath: footerClip,
          WebkitClipPath: footerClip,
        }}
      />

      {/* Dividing curve stroke */}
      <svg
        className="pointer-events-none absolute inset-0 h-full w-full"
        viewBox={`0 0 ${CARD_W} ${CARD_H}`}
        preserveAspectRatio="none"
        aria-hidden
      >
        <path
          d={strokePath}
          fill="none"
          stroke="white"
          strokeOpacity={0.14}
          strokeWidth={1}
          strokeLinecap="round"
        />
      </svg>

      {/* Caption overlay */}
      <p className="font-heading absolute bottom-3 left-2.5 right-2.5 line-clamp-2 text-center text-[13px] font-extrabold leading-[1.2] text-white">
        {product.name || product.brand}
      </p>
    </Link>
  );
}
