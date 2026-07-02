import Link from "next/link";
import { ProductCard } from "./product-card";
import { HudPanel, CornerTicks } from "./hud";
import { CoinIcon, ZapIcon } from "./icons";
import { gradientFor, type ApiProduct } from "@/lib/api";
import { rgba, type CardModel } from "@/lib/products";

const REDEEM_STEPS = [
  "Complete checkout — the voucher lands in your 16Arena wallet instantly.",
  "Open Wallet → Vouchers and copy your unique code.",
  "Apply the code at the brand and enjoy your bonus value.",
];

const TERMS = [
  "Vouchers are non-refundable once delivered to your wallet.",
  "Arena Coins applied at checkout are deducted immediately.",
  "Validity and usage follow the issuing brand's policy.",
  "Coin rewards credit within 24 hours of a successful order.",
];

export function LiveProductDetail({
  product,
  related,
}: {
  product: ApiProduct;
  related: CardModel[];
}) {
  const g = gradientFor(product.brandName ?? product.name);
  const save = Math.round(product.savingsPercent ?? product.maxSavingsPercent ?? 0);
  const maxSave = Math.round(product.maxSavingsPercent ?? 0);
  const hasOriginal =
    product.startingOriginalPrice != null &&
    product.startingPrice != null &&
    product.startingOriginalPrice > product.startingPrice;

  return (
    <main className="mx-auto w-full max-w-[1240px] flex-1 px-6 pb-20 pt-6">
      <div className="font-data mb-6 flex items-center gap-2 text-[12px] uppercase tracking-[0.06em] text-[var(--muted)]">
        <Link href="/" className="transition-colors hover:text-[var(--flame)]">
          ‹ Shop
        </Link>
        <span className="text-[var(--faint)]">/</span>
        <span>{product.categoryName}</span>
        <span className="text-[var(--faint)]">/</span>
        <span className="text-[var(--ink)]">{product.brandName ?? product.name}</span>
      </div>

      <div className="grid grid-cols-1 items-start gap-10 lg:grid-cols-2">
        {/* Gallery */}
        <HudPanel
          cut={18}
          border="var(--line-2)"
          fill="var(--carbon)"
          className="relative"
          innerClassName="relative flex h-[380px] items-center justify-center overflow-hidden"
        >
          <div
            className="absolute inset-0"
            style={{ background: `radial-gradient(120% 110% at 50% 120%, ${rgba(g.accent, 0.5)} 0%, transparent 62%)` }}
          />
          <CornerTicks color={rgba(g.accent, 0.7)} size={13} />
          {save > 0 && (
            <span className="font-data absolute left-5 top-5 rounded-[6px] border border-[var(--flame)]/30 bg-[var(--flame)]/[0.14] px-[11px] py-[5px] text-[11px] font-bold uppercase tracking-[0.06em] text-[var(--flame)]">
              −{save}% Off
            </span>
          )}
          {product.heroImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={product.heroImageUrl}
              alt={product.name}
              className="relative h-[230px] w-[300px] rounded-[16px] border border-white/[0.15] object-cover shadow-[0_26px_56px_-18px_rgba(0,0,0,0.85)]"
            />
          ) : (
            <div
              className="relative flex h-[168px] w-[268px] flex-col items-center justify-center gap-2 rounded-[16px] border border-white/[0.15] shadow-[0_26px_56px_-18px_rgba(0,0,0,0.85),inset_0_1px_0_rgba(255,255,255,0.24)]"
              style={{ background: `linear-gradient(150deg, ${g.accent}, ${g.accent2})` }}
            >
              <span className="text-[24px] font-extrabold text-white [text-shadow:0_2px_8px_rgba(0,0,0,0.4)]">
                {product.brandName ?? product.name}
              </span>
              <span className="font-data text-[11px] font-medium uppercase tracking-[0.18em] text-white/75">
                {product.categoryName}
              </span>
            </div>
          )}
        </HudPanel>

        {/* Summary */}
        <div>
          <div className="eyebrow">{product.categoryName}</div>
          <h1 className="mt-2 text-[34px] font-extrabold tracking-[-0.02em] text-white">
            {product.name}
          </h1>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <span className="font-data inline-flex items-center gap-[5px] text-[13px] font-bold text-[var(--ink)]">
              <span className="text-[var(--flame)]">▲</span>
              {(product.wishlistCount24h ?? 0).toLocaleString("en-IN")}
              <span className="font-normal text-[var(--muted)]">wishlisted / 24h</span>
            </span>
            <span className="font-data rounded-[6px] bg-[var(--win)]/[0.12] px-[9px] py-1 text-[11px] font-bold uppercase tracking-[0.04em] text-[var(--win)]">
              In stock
            </span>
          </div>

          <p className="mt-4 max-w-[440px] text-sm leading-[1.6] text-[var(--muted)]">
            Instant digital delivery to your 16Arena wallet. Pay part cash, part
            Arena Coins, and earn coins back on every order.
          </p>

          <HudPanel cut={13} border="var(--line)" fill="var(--carbon)" className="mt-6">
            <div className="p-[18px]">
              <div className="eyebrow">Starting from</div>
              <div className="mt-[7px] flex items-end gap-[11px]">
                <span className="text-[34px] font-extrabold leading-none tabular-nums text-white">
                  {product.startingPrice != null ? `₹${product.startingPrice}` : "—"}
                </span>
                {hasOriginal && (
                  <span className="mb-1 text-base tabular-nums text-[var(--faint)] line-through">
                    ₹{product.startingOriginalPrice}
                  </span>
                )}
                {save > 0 && (
                  <span className="font-data mb-1 rounded-[5px] bg-[var(--win)]/[0.12] px-2 py-[3px] text-[11px] font-bold text-[var(--win)]">
                    −{save}%
                  </span>
                )}
              </div>
              {maxSave > save && (
                <div className="font-data mt-2 text-[12px] text-[var(--muted)]">
                  Up to <span className="text-[var(--win)]">{maxSave}%</span> off on higher tiers
                </div>
              )}
              {product.cashbackPercent != null && (
                <div className="mt-4 flex items-center gap-[9px] border-t border-[var(--line)] pt-4 text-[13px] text-[var(--ink)]">
                  <CoinIcon size={18} />
                  Earn{" "}
                  <b className="font-bold tabular-nums text-[var(--coin)]">
                    {product.cashbackPercent}%
                  </b>{" "}
                  back in Arena Coins
                </div>
              )}
            </div>
          </HudPanel>

          <div className="mt-6 flex items-center gap-[13px]">
            <button className="h-12 flex-1 rounded-[12px] border border-[var(--line-2)] bg-[var(--carbon-2)] text-[15px] font-semibold text-[var(--ink)] transition hover:border-[var(--flame)]/60 hover:text-white">
              Add to cart
            </button>
            <button className="h-12 flex-1 rounded-[12px] bg-gradient-to-br from-[var(--coin)] via-[var(--flame)] to-[var(--flame-deep)] text-[15px] font-bold text-[#1c1304] shadow-[0_14px_30px_-12px_rgba(255,90,0,0.8)] transition hover:brightness-105 active:translate-y-px">
              Buy now
            </button>
          </div>

          <div className="font-data mt-4 flex items-center gap-2 text-[11px] uppercase tracking-[0.06em] text-[var(--muted)]">
            <ZapIcon size={14} className="text-[var(--flame)]" />
            Instant delivery · No expiry on Arena Coins
          </div>
        </div>
      </div>

      {/* Info panels */}
      <div className="mt-14 grid grid-cols-1 gap-[18px] lg:grid-cols-2">
        <div className="rounded-[14px] border border-[var(--line)] bg-[var(--carbon)] p-5">
          <div className="eyebrow mb-4">How to redeem</div>
          <div className="flex flex-col gap-3">
            {REDEEM_STEPS.map((step, i) => (
              <div key={i} className="flex items-start gap-[11px]">
                <span className="font-data flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-[6px] bg-[var(--flame)]/[0.14] text-xs font-bold text-[var(--flame)]">
                  {i + 1}
                </span>
                <span className="text-[13px] leading-[1.5] text-[var(--muted)]">{step}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-[14px] border border-[var(--line)] bg-[var(--carbon)] p-5">
          <div className="eyebrow mb-4">Terms &amp; conditions</div>
          <div className="flex flex-col gap-[10px]">
            {TERMS.map((t) => (
              <span key={t} className="flex gap-2 text-[13px] leading-[1.5] text-[var(--muted)]">
                <span className="text-[var(--flame)]">▸</span>
                {t}
              </span>
            ))}
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <div className="mt-14">
          <div className="eyebrow flex items-center gap-2">
            <span className="text-[var(--flame)]">▌</span>
            More from {product.categoryName}
          </div>
          <h2 className="mb-5 mt-2 text-[24px] font-extrabold tracking-[-0.01em] text-white">
            You might also like
          </h2>
          <div className="grid grid-cols-1 gap-[18px] sm:grid-cols-2 lg:grid-cols-4">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      )}
    </main>
  );
}
