"use client";

import Link from "next/link";
import { CardModel } from "@/features/shop/types/shop.types";
import { productDealCaption } from "@/features/shop/utils/mappers";

export const FOR_YOU_CARD_WIDTH = 341;
export const FOR_YOU_CARD_HEIGHT = 206;
const FOOTER_HEIGHT = 36;

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

/** Prefix a bare hex ("81A600") with "#"; pass through rgb()/named/#-prefixed as-is. */
function normalizeColor(color: string): string {
  const c = color.trim();
  return /^[0-9a-fA-F]{3,8}$/.test(c) ? `#${c}` : c;
}

export function ShopForYouCard({ product }: { product: CardModel }) {
  const caption = product.brand;
  const imageSrc = product.featureImageUrl || product.imageUrl;
  const footerText = productDealCaption(product);
  const footerFill = product.featureColor
    ? normalizeColor(product.featureColor)
    : footerColor(product);
  const footerHeight = FOOTER_HEIGHT;
  const href = product.categorySlug ? `/${product.categorySlug}/${product.slug}` : `/${product.slug}`;

  return (
    <Link
      href={href}
      className="shop-card-lift group relative flex h-[206px] w-[341px] shrink-0 flex-col overflow-hidden rounded-[10px] border border-white/10 bg-white/[0.05]"
    >
      <div className="relative min-h-0 flex-1 overflow-hidden">
        {imageSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageSrc}
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

      <div
        className="relative shrink-0 border-t border-white/14"
        style={{ height: footerHeight, backgroundColor: footerFill }}
      >
        <p className="font-heading absolute inset-x-2.5 top-1/2 line-clamp-2 -translate-y-1/2 text-center text-[13px] font-extrabold leading-[1.2] text-white">
          {footerText}
        </p>
      </div>
    </Link>
  );
}
