"use client";

import { useState } from "react";
import Link from "next/link";
import { ArenaCoin } from "./arena-coin";
import { ProductCard } from "./product-card";
import { HudPanel, CornerTicks } from "./hud";
import { CoinIcon, StarIcon, ZapIcon } from "./icons";
import {
  CARD_DENOM_INDEX,
  denominations,
  inr,
  productToCard,
  rgba,
  type Product,
} from "@/lib/products";

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

export function ProductDetail({
  product,
  related,
}: {
  product: Product;
  related: Product[];
}) {
  const denoms = denominations();
  const [denomIdx, setDenomIdx] = useState(CARD_DENOM_INDEX);
  const [qty, setQty] = useState(1);

  const d = denoms[denomIdx];
  const payCash = d.cash * qty;
  const payCoins = d.coins * qty;
  const reward = d.reward * qty;

  return (
    <main className="mx-auto w-full max-w-[1240px] flex-1 px-6 pb-20 pt-6">
      {/* Breadcrumb */}
      <div className="font-data mb-6 flex items-center gap-2 text-[12px] uppercase tracking-[0.06em] text-[var(--muted)]">
        <Link href="/" className="text-[var(--muted)] transition-colors hover:text-[var(--flame)]">
          ‹ Shop
        </Link>
        <span className="text-[var(--faint)]">/</span>
        <span>{product.sub}</span>
        <span className="text-[var(--faint)]">/</span>
        <span className="text-[var(--ink)]">{product.brand}</span>
      </div>

      <div className="grid grid-cols-1 items-start gap-10 lg:grid-cols-2">
        {/* Gallery */}
        <div>
          <HudPanel
            cut={18}
            border="var(--line-2)"
            fill="var(--carbon)"
            className="relative"
            innerClassName="relative flex h-[380px] items-center justify-center overflow-hidden"
          >
            <div
              className="absolute inset-0"
              style={{
                background: `radial-gradient(120% 110% at 50% 120%, ${rgba(product.accent, 0.5)} 0%, transparent 62%)`,
              }}
            />
            <CornerTicks color={rgba(product.accent, 0.7)} size={13} />
            <span className="font-data absolute left-5 top-5 rounded-[6px] border border-[var(--flame)]/30 bg-[var(--flame)]/[0.14] px-[11px] py-[5px] text-[11px] font-bold uppercase tracking-[0.06em] text-[var(--flame)]">
              −50% Off
            </span>
            <div
              className="relative flex h-[168px] w-[268px] flex-col items-center justify-center gap-2 rounded-[16px] border border-white/[0.15] shadow-[0_26px_56px_-18px_rgba(0,0,0,0.85),inset_0_1px_0_rgba(255,255,255,0.24)]"
              style={{ background: `linear-gradient(150deg, ${product.accent}, ${product.accent2})` }}
            >
              <span className="text-[26px] font-extrabold text-white [text-shadow:0_2px_8px_rgba(0,0,0,0.4)]">
                {product.brand}
              </span>
              <span className="font-data text-[11px] font-medium uppercase tracking-[0.18em] text-white/75">
                Gift Card
              </span>
            </div>
          </HudPanel>

          <div className="mt-[14px] grid grid-cols-4 gap-3">
            <div
              className="h-16 rounded-[10px] border border-[var(--flame)]/50"
              style={{ background: `linear-gradient(150deg, ${product.accent}, ${product.accent2})` }}
            />
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-16 rounded-[10px] border border-[var(--line)] bg-[var(--carbon-2)]" />
            ))}
          </div>
        </div>

        {/* Buy panel */}
        <div>
          <div className="eyebrow">{product.sub}</div>
          <h1 className="mt-2 text-[34px] font-extrabold tracking-[-0.02em] text-white">
            {product.brand}
          </h1>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <span className="font-data inline-flex items-center gap-[5px] text-[13px] font-bold text-[var(--ink)]">
              <StarIcon size={15} /> {product.rating}
            </span>
            <span className="text-[var(--faint)]">·</span>
            <span className="font-data text-[13px] text-[var(--muted)]">2,340 ratings</span>
            <span className="font-data rounded-[6px] bg-[var(--win)]/[0.12] px-[9px] py-1 text-[11px] font-bold uppercase tracking-[0.04em] text-[var(--win)]">
              In stock
            </span>
          </div>
          <p className="mt-4 max-w-[440px] text-sm leading-[1.6] text-[var(--muted)]">
            Instant digital voucher delivered to your 16Arena wallet. Redeem in-app
            — pay part cash, part Arena Coins, and earn coins back on every order.
          </p>

          <div className="eyebrow mt-7">Choose denomination</div>
          <div className="mt-3 grid grid-cols-4 gap-[11px]">
            {denoms.map((it, i) => {
              const active = i === denomIdx;
              return (
                <button
                  key={it.face}
                  onClick={() => setDenomIdx(i)}
                  className={`flex flex-col items-center gap-[3px] rounded-[11px] border px-2 py-[13px] transition ${
                    active
                      ? "border-[var(--flame)] bg-[var(--flame)]/[0.14] text-white"
                      : "border-[var(--line)] bg-[var(--carbon)] text-[var(--muted)] hover:border-[var(--line-2)]"
                  }`}
                >
                  <span className="text-base font-bold tabular-nums">{it.faceStr}</span>
                  <span className="font-data text-[10px] uppercase tracking-[0.08em] opacity-65">
                    voucher
                  </span>
                </button>
              );
            })}
          </div>

          {/* You pay */}
          <HudPanel cut={13} border="var(--line)" fill="var(--carbon)" className="mt-6">
            <div className="p-[18px]">
              <div className="flex items-center gap-[10px]">
                <span className="text-[13px] text-[var(--muted)]">
                  Card value{" "}
                  <b className="font-bold tabular-nums text-[var(--ink)]">{d.faceStr}</b>
                </span>
                <span className="font-data rounded-[5px] bg-[var(--win)]/[0.12] px-2 py-[3px] text-[11px] font-bold uppercase tracking-[0.04em] text-[var(--win)]">
                  −50%
                </span>
              </div>
              <div className="eyebrow mt-[13px]">You pay</div>
              <div className="mt-[7px] flex items-center gap-[11px]">
                <span className="text-[32px] font-extrabold tabular-nums text-white">{inr(payCash)}</span>
                <span className="text-xl text-[var(--faint)]">+</span>
                <ArenaCoin value={payCoins} size={26} />
              </div>
              <div className="mt-[9px] text-[13px] font-bold text-[var(--win)]">
                You save {inr(payCash)}
              </div>
            </div>
          </HudPanel>

          <div className="mt-[13px] flex items-center gap-[9px] rounded-[12px] border border-[var(--coin)]/[0.22] bg-[var(--coin)]/[0.06] px-[14px] py-[11px]">
            <CoinIcon size={18} />
            <span className="text-[13px] text-[var(--ink)]">
              Earn{" "}
              <b className="font-bold tabular-nums text-[var(--coin)]">{reward.toLocaleString("en-IN")}</b>{" "}
              Arena Coins on this purchase
            </span>
          </div>

          <div className="mt-6 flex items-center gap-[13px]">
            <div className="flex h-12 items-center overflow-hidden rounded-[11px] border border-[var(--line)] bg-[var(--carbon)]">
              <button
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                aria-label="Decrease quantity"
                className="h-12 w-11 text-xl text-[var(--muted)] transition hover:bg-white/[0.06] hover:text-white"
              >
                −
              </button>
              <span className="min-w-[38px] text-center text-base font-bold tabular-nums text-white">
                {qty}
              </span>
              <button
                onClick={() => setQty((q) => q + 1)}
                aria-label="Increase quantity"
                className="h-12 w-11 text-xl text-[var(--muted)] transition hover:bg-white/[0.06] hover:text-white"
              >
                +
              </button>
            </div>
            <button className="h-12 rounded-[12px] border border-[var(--line-2)] bg-[var(--carbon-2)] px-5 text-[15px] font-semibold text-[var(--ink)] transition hover:border-[var(--flame)]/60 hover:text-white">
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

      {/* Related */}
      <div className="mt-14">
        <div className="eyebrow flex items-center gap-2">
          <span className="text-[var(--flame)]">▌</span>
          More drops
        </div>
        <h2 className="mb-5 mt-2 text-[24px] font-extrabold tracking-[-0.01em] text-white">
          You might also like
        </h2>
        <div className="grid grid-cols-1 gap-[18px] sm:grid-cols-2 lg:grid-cols-4">
          {related.map((p) => (
            <ProductCard key={p.id} product={productToCard(p)} />
          ))}
        </div>
      </div>
    </main>
  );
}
