import Link from "next/link";
import { rgba } from "../services/product.service";
import { type CardModel } from "../types/shop.types";

export function SwagCard({ product }: { product: CardModel }) {
  const discount =
    product.savePct != null
      ? `${product.savePct}% off`
      : product.badge?.label?.toLowerCase().includes("off")
        ? product.badge.label
        : product.badge?.label;

  return (
    <Link href={`/shop/${product.slug}`} className="shop-card-lift group block w-[132px] shrink-0 sm:w-[148px]">
      <div
        className="shop-card relative flex aspect-square items-center justify-center overflow-hidden"
        style={{
          background: product.imageUrl
            ? `linear-gradient(160deg, ${rgba(product.accent, 0.35)} 0%, var(--surface) 100%)`
            : `linear-gradient(155deg, ${product.accent} 0%, ${product.accent2} 100%)`,
        }}
      >
        {discount && <span className="shop-badge absolute left-2.5 top-2.5 z-10">{discount}</span>}

        {product.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.imageUrl}
            alt={product.brand}
            className="h-[72%] w-[72%] object-contain drop-shadow-lg transition-opacity duration-200 group-hover:opacity-90"
          />
        ) : (
          <span className="px-3 text-center text-lg font-extrabold leading-tight text-white [text-shadow:0_2px_8px_rgba(0,0,0,0.35)]">
            {product.brand}
          </span>
        )}
      </div>
      <p className="mt-2.5 truncate text-center text-sm font-semibold text-white">{product.name || product.brand}</p>
    </Link>
  );
}
