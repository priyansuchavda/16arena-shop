import Link from "next/link";
import { CoinIcon, StarIcon } from "@/shared/components/icons";
import { rgba, TONE_STYLES } from "../services/product.service";
import { type CardModel } from "../types/shop.types";
import { formatPercent } from "../utils/checkout.utils";

export function ProductCard({ product }: { product: CardModel }) {
  const tone = product.badge ? TONE_STYLES[product.badge.tone] : null;
  const lowStock = product.badge?.tone === "low";

  return (
    <Link
      href={`/shop/${product.slug}`}
      className="group relative flex flex-col overflow-hidden rounded-[14px] border border-[var(--line)] bg-[var(--carbon)] transition duration-200 hover:-translate-y-1 hover:border-[var(--flame)]/45 hover:shadow-[0_18px_38px_-18px_rgba(0,0,0,0.85)]"
    >
      <span
        className="absolute inset-x-0 top-0 z-10 h-[2px] opacity-50 transition-opacity duration-200 group-hover:opacity-100"
        style={{ background: `linear-gradient(90deg, ${product.accent}, transparent 80%)` }}
      />

      <div
        className="relative flex h-[148px] items-center justify-center overflow-hidden"
        style={{ background: `radial-gradient(125% 135% at 50% 145%, ${rgba(product.accent, 0.45)} 0%, transparent 64%)` }}
      >
        {product.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.imageUrl}
            alt={product.brand}
            className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-[1.04]"
          />
        ) : (
          <div
            className="flex h-[72px] w-[116px] items-center justify-center rounded-[12px] border border-white/[0.14] shadow-[0_12px_26px_-10px_rgba(0,0,0,0.75),inset_0_1px_0_rgba(255,255,255,0.22)] transition-transform duration-200 group-hover:scale-[1.04]"
            style={{ background: `linear-gradient(150deg, ${product.accent}, ${product.accent2})` }}
          >
            <span className="px-2 text-center text-sm font-extrabold leading-[1.1] text-white [text-shadow:0_1px_4px_rgba(0,0,0,0.45)]">
              {product.brand}
            </span>
          </div>
        )}

        {product.badge && tone && (
          <span
            className="font-data absolute left-3 top-3 rounded-[5px] px-2 py-[3px] text-[10px] font-bold uppercase tracking-[0.06em]"
            style={{ background: tone.bg, color: tone.fg }}
          >
            {product.badge.label}
          </span>
        )}
      </div>

      <div className="flex flex-col gap-[3px] px-[15px] pt-[13px]">
        <span className="truncate text-[15px] font-bold text-[var(--ink)]">{product.brand}</span>
        <span className="truncate text-xs text-[var(--muted)]">{product.sub}</span>
        <div className="mt-[10px] flex items-center gap-[8px]">
          <span className="text-[16px] font-bold tabular-nums text-white">{product.priceStr}</span>
          {product.cashbackPct != null && (
            <span className="ml-auto inline-flex items-center gap-1 rounded-[5px] bg-[var(--coin)]/[0.12] px-[6px] py-[3px] text-[11px] font-bold tabular-nums text-[var(--coin)]">
              +{product.cashbackPct}%
              <CoinIcon size={12} />
            </span>
          )}
        </div>
      </div>

      <div className="mt-[13px] flex items-center justify-between border-t border-[var(--line)] bg-white/[0.025] px-[15px] py-[11px]">
        {lowStock ? (
          <span className="flex items-center gap-2">
            <span className="flex gap-[3px]">
              {[0, 1, 2, 3, 4].map((i) => (
                <span
                  key={i}
                  className="h-[10px] w-[3px] rounded-sm"
                  style={{ background: i < 2 ? "#ff8589" : "rgba(255,255,255,0.12)" }}
                />
              ))}
            </span>
            <span className="font-data text-[11px] font-bold uppercase tracking-[0.06em] text-[#ff8589]">
              2 left
            </span>
          </span>
        ) : product.saveStr ? (
          <span className="font-data text-[11px] font-bold uppercase tracking-[0.04em] text-[var(--win)]">
            {product.saveStr}
          </span>
        ) : product.savePct != null ? (
          <span className="font-data text-[11px] font-bold uppercase tracking-[0.04em] text-[var(--win)]">
            Save {formatPercent(product.savePct)}%
          </span>
        ) : (
          <span />
        )}

        {product.rating != null ? (
          <span className="font-data inline-flex items-center gap-1 text-xs font-bold text-[var(--muted)]">
            <StarIcon /> {product.rating}
          </span>
        ) : product.wishlist != null ? (
          <span className="font-data inline-flex items-center gap-[5px] text-[11px] font-bold text-[var(--muted)]">
            <span className="text-[var(--flame)]">▲</span>
            {product.wishlist.toLocaleString("en-IN")}
            <span className="text-[var(--faint)]">/24h</span>
          </span>
        ) : null}
      </div>
    </Link>
  );
}
