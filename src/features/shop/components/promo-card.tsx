import Link from "next/link";
import { HudPanel } from "./hud";
import { CardModel } from "@/features/shop/types/shop.types";

/** Large promotional "drop" panel used in the For you row. */
export function PromoCard({ product }: { product: CardModel }) {
  return (
    <Link href={`/shop/${product.slug}`} className="group block">
      <HudPanel
        cut={15}
        border="rgba(255,255,255,0.2)"
        fill={`linear-gradient(140deg, ${product.accent} 0%, ${product.accent2} 100%)`}
        className="transition-transform duration-200 group-hover:-translate-y-1 group-hover:[filter:drop-shadow(0_18px_30px_rgba(0,0,0,0.55))]"
        innerClassName="relative h-[190px] overflow-hidden"
      >
        <div className="absolute -bottom-10 -right-[34px] h-[158px] w-[158px] rounded-full bg-white/[0.12]" />
        <div className="absolute -top-[30px] -right-[58px] h-[120px] w-[120px] rounded-full bg-white/[0.08]" />

        <div className="relative flex h-full flex-col justify-between p-5">
          <div className="flex items-start justify-between gap-2">
            <span className="text-[22px] font-extrabold text-white [text-shadow:0_1px_8px_rgba(0,0,0,0.3)]">
              {product.brand}
            </span>
            <span className="font-data shrink-0 rounded-[6px] bg-black/30 px-2 py-[5px] text-[10px] font-bold uppercase tracking-[0.08em] text-white">
              Drop · 50%
            </span>
          </div>

          <div>
            <div className="mb-[11px] max-w-[180px] text-sm font-semibold text-white/95">
              {product.tagline ?? product.brand}
            </div>
            <span className="inline-flex items-center gap-[6px] rounded-[8px] bg-black/35 px-[13px] py-[7px] text-xs font-bold text-white transition-transform group-hover:translate-x-[2px]">
              Shop drop ›
            </span>
          </div>
        </div>
      </HudPanel>
    </Link>
  );
}
