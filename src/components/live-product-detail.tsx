"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import coinImg from "@/assets/png/coin.png";
import { HudPanel, CornerTicks } from "./hud";
import { CoinIcon, ZapIcon } from "./icons";
import { gradientFor, type ApiProduct } from "@/lib/api";
import { rgba } from "@/lib/products";

// Helper to generate dynamic denominations based on the starting price
function generateLiveDenominations(startingPrice: number, startingOriginalPrice: number) {
  const basePrice = startingPrice;
  const baseOriginal = startingOriginalPrice;
  const ratio = baseOriginal > basePrice ? basePrice / baseOriginal : 0.95; // e.g. 5% discount

  // Standard multiplier packages
  const factors = [1, 2.5, 5, 10];
  return factors.map((f) => {
    const face = Math.round(baseOriginal * f);
    const cash = Math.round(face * ratio);
    const coins = Math.round(cash * 0.5 * 10); // 50% coins (10 coins per rupee)
    const reward = Math.round(cash * 0.02 * 10); // 2% reward
    return {
      face,
      faceStr: `₹${face}`,
      cash,
      cashStr: `₹${cash}`,
      coins,
      reward,
    };
  });
}

const FAQS = [
  {
    q: "How does the top-up work?",
    a: "Select your desired denomination, enter your account details (such as game UID for gaming items), and complete the payment. The vouchers or points are credited to your account instantly.",
  },
  {
    q: "How long does delivery take?",
    a: "Delivery is instant! Once the transaction completes successfully, you will receive confirmation and the vouchers will be delivered directly to your wallet.",
  },
  {
    q: "What should I do if I entered the wrong details?",
    a: "Please double check your details before buying. Digital vouchers and top-ups are non-refundable once processed due to the instant nature of fulfillment.",
  },
];

export function LiveProductDetail({
  product,
}: {
  product: ApiProduct;
  related: any[]; // Kept in signature for prop compatibility
}) {
  const g = gradientFor(product.brandName ?? product.name);
  const save = Math.round(product.savingsPercent ?? product.maxSavingsPercent ?? 0);

  const startingPrice = product.startingPrice ?? 420;
  const startingOriginalPrice = product.startingOriginalPrice ?? 420;

  const denoms = generateLiveDenominations(startingPrice, startingOriginalPrice);
  const [denomIdx, setDenomIdx] = useState(1); // Default to second tier
  const [qty, setQty] = useState(1);
  const [isReadMore, setIsReadMore] = useState(false);

  const d = denoms[denomIdx] || denoms[0];
  const payCash = d.cash * qty;
  const payCoins = d.coins * qty;
  const reward = d.reward * qty;

  const isGaming = /gaming|battle royale|fps|moba/i.test(product.categoryName);

  return (
    <main className="relative mx-auto w-full max-w-[1240px] flex-1 px-6 pb-20 pt-6">
      {/* Premium themed background graphics blending into black */}
      {product.heroImageUrl && (
        <div className="absolute right-0 top-[-110px] pointer-events-none hidden lg:block w-[55%] h-[720px] overflow-hidden opacity-30 select-none">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={product.heroImageUrl}
            alt=""
            className="w-full h-full object-cover"
            style={{
              maskImage: "radial-gradient(ellipse at 80% 50%, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 75%)",
              WebkitMaskImage: "radial-gradient(ellipse at 80% 50%, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 75%)",
            }}
          />
        </div>
      )}

      {/* Breadcrumb */}
      <div className="font-data mb-8 flex items-center gap-2 text-[12px] uppercase tracking-[0.06em] text-[var(--muted)] relative z-10">
        <Link href="/" className="transition-colors hover:text-[var(--flame)]">
          ‹ Shop
        </Link>
        <span className="text-[var(--faint)]">/</span>
        <span>{product.categoryName}</span>
        <span className="text-[var(--faint)]">/</span>
        <span className="text-[var(--ink)]">{product.brandName ?? product.name}</span>
      </div>

      <div className="grid grid-cols-1 items-start gap-12 lg:grid-cols-12 relative z-10">
        {/* Left Column: Product Info & Descriptions */}
        <div className="lg:col-span-7">
          {/* Product Banner/Card Graphic */}
          <div className="mb-6 relative inline-block">
            <div
              className="relative flex h-[220px] w-[440px] max-w-full flex-col items-center justify-center rounded-[16px] border border-white/[0.15] p-6 shadow-[0_26px_56px_-18px_rgba(0,0,0,0.85),inset_0_1px_0_rgba(255,255,255,0.24)]"
              style={{
                background: `linear-gradient(150deg, ${g.accent}, ${g.accent2})`,
              }}
            >
              {/* Translucent center box */}
              <div className="flex flex-col items-center justify-center rounded-[12px] bg-white/[0.08] backdrop-blur-md px-6 py-4 border border-white/10 text-center">
                <span className="text-[10px] font-medium uppercase tracking-[0.1em] text-white/70">
                  Voucher worth
                </span>
                <span className="text-[30px] font-extrabold leading-none text-white mt-1 tabular-nums">
                  {d.faceStr}
                </span>
              </div>

              {/* Logo / Brand Name at bottom-left */}
              <div className="absolute bottom-4 left-5 flex items-center gap-2">
                <span className="text-[12px] font-extrabold uppercase tracking-[0.06em] text-white">
                  {product.brandName ?? product.name}
                </span>
              </div>
            </div>
          </div>

          {/* Title & Description */}
          <h1 className="text-[34px] font-extrabold tracking-[-0.02em] text-white">
            {product.name}
          </h1>

          <div className="mt-4 max-w-[560px]">
            <p className="text-sm leading-[1.6] text-[var(--muted)]">
              Instant digital delivery to your 16Arena wallet. Pay part cash, part Arena Coins, and
              earn coins back on every order. Swag offers instant top-ups and standard packages so you
              can grab skins, points, and items with maximum savings. All transactions are secure and
              processed in real-time.
            </p>
          </div>

          {/* Info row: Redeem / Expiry / Usage — separated by vertical dividers */}
          <div className="mt-8 flex items-center max-w-[480px] rounded-[16px] border border-white/[0.08] bg-white/[0.03] px-2 py-4">
            {[
              {
                icon: (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="5" y="2" width="14" height="20" rx="2" /><line x1="12" y1="18" x2="12" y2="18.01" />
                  </svg>
                ),
                label: "REDEEM",
                value: "Online",
              },
              {
                icon: (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                ),
                label: "EXPIRY",
                value: "12 months",
              },
              {
                icon: (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="9" /><polyline points="12 6 12 12 16 14" />
                  </svg>
                ),
                label: "USAGE",
                value: "Single Item",
              },
            ].map(({ icon, label, value }, i, arr) => (
              <div key={label} className="flex flex-1 items-center">
                <div className="flex flex-1 flex-col items-center gap-1.5 text-center">
                  <span className="text-white/50">{icon}</span>
                  <span className="font-data text-[9px] font-bold uppercase tracking-[0.12em] text-white/35">{label}</span>
                  <span className="text-[12px] font-semibold text-white">{value}</span>
                </div>
                {i < arr.length - 1 && (
                  <div className="h-10 w-px shrink-0 bg-white/10" />
                )}
              </div>
            ))}
          </div>

          <hr className="my-8 border-white/10 max-w-[560px]" />

          {/* How to Redeem — flat, no dropdown */}
          <div className="max-w-[560px] rounded-[14px] border border-white/10 bg-black/20 p-5 mb-4">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-[16px]">❓</span>
              <h2 className="font-heading text-[14px] font-bold text-white">How to redeem</h2>
            </div>
            <hr className="border-white/8 mb-4" />
            <div className="flex flex-col gap-3 text-sm text-[var(--muted)]">
              {[
                "Complete checkout — the voucher code is generated instantly.",
                "Open your 16Arena Wallet and copy the unique code.",
                "Redeem the code at the merchant website to claim your credits.",
              ].map((step, i) => (
                <div key={i} className="flex items-start gap-3">
                  <span className="flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full bg-white/10 text-[11px] font-bold text-white">
                    {i + 1}
                  </span>
                  <span className="leading-[1.5]">{step}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Terms & Conditions — flat, no dropdown */}
          <div className="max-w-[560px] rounded-[14px] border border-white/10 bg-black/20 p-5">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-[16px]">📄</span>
              <h2 className="font-heading text-[14px] font-bold text-white">Terms & Conditions</h2>
            </div>
            <hr className="border-white/8 mb-4" />
            <div className="flex flex-col gap-4 text-sm text-[var(--muted)]">
              {[
                "Vouchers are non-refundable once delivered to your wallet.",
                "Arena Coins applied at checkout are deducted immediately.",
                "Validity and usage follow the issuing brand's policy.",
                "Coin rewards credit within 24 hours of a successful order.",
              ].map((term, i) => (
                <div key={i} className="flex items-start gap-3">
                  <span className="flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full bg-white/10 text-[11px] font-bold text-white">
                    {i + 1}
                  </span>
                  <span className="leading-[1.5]">{term}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Buy & Denomination Panel */}
        <div className="lg:col-span-5 lg:sticky lg:top-[90px]">
          <HudPanel cut={14} border="var(--line)" fill="var(--carbon)" className="w-full">
            <div className="p-6">
              {/* Conditional UID input for Gaming */}
              {isGaming && (
                <div className="mb-4">
                  <label className="text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--muted)] block mb-2">
                    Add User ID (UID)
                  </label>
                  <input
                    type="text"
                    placeholder="Enter your Player ID / UID"
                    className="w-full h-11 bg-black/40 border border-white/10 rounded-[10px] px-4 text-sm text-white placeholder:text-white/30 outline-none focus:border-[var(--flame)]/60 transition-colors"
                  />
                </div>
              )}

              {/* Coupon Code Input */}
              <div className="mb-6">
                <label className="text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--muted)] block mb-2">
                  Coupon Code
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Have a voucher code?"
                    className="flex-1 h-11 bg-black/40 border border-white/10 rounded-[10px] px-4 text-sm text-white placeholder:text-white/30 outline-none focus:border-[var(--flame)]/60 transition-colors"
                  />
                  <button className="h-11 px-4 bg-white/5 border border-white/10 rounded-[10px] text-sm text-white hover:bg-white/10 transition">
                    Apply
                  </button>
                </div>
              </div>

              {/* Denomination Grid */}
              <div className="mb-6">
                <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--muted)] mb-3">
                  Select Amount
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {denoms.map((denom, i) => {
                    const active = i === denomIdx;
                    return (
                      <button
                        key={i}
                        onClick={() => setDenomIdx(i)}
                        className={`flex flex-col items-center gap-[4px] rounded-[11px] border px-3 py-3 transition text-center ${
                          active
                            ? "border-[var(--flame)] bg-[var(--flame)]/[0.08] text-white"
                            : "border-white/10 bg-black/20 text-[var(--muted)] hover:border-white/20"
                        }`}
                      >
                        <span className="text-base font-bold tabular-nums text-white">
                          {denom.faceStr}
                        </span>
                        <span className="text-[10px] text-[var(--muted)]">Pay {denom.cashStr}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* You Pay details box */}
              <div className="p-4 bg-black/20 border border-white/5 rounded-xl mb-6">
                <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--muted)]">
                  You Pay
                </div>
                <div className="mt-2.5 flex items-center gap-2">
                  <span className="text-[28px] font-extrabold text-white tabular-nums leading-none">
                    ₹{payCash.toLocaleString("en-IN")}
                  </span>
                  <span className="text-xl text-white/40 leading-none">+</span>
                  <div className="flex items-center gap-1.5 bg-white/5 px-3 py-1.5 rounded-lg border border-white/5">
                    <Image src={coinImg} alt="Coins" width={15} height={15} />
                    <span className="text-[14px] font-bold text-[#FBCD00] tabular-nums leading-none">
                      {payCoins.toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between text-[12px] border-t border-white/5 pt-3">
                  <span className="text-[var(--muted)]">Total Savings:</span>
                  <span className="font-bold text-[var(--win)]">
                    Save {Math.round((1 - d.cash / d.face) * 100)}%
                  </span>
                </div>
              </div>

              {/* Quantity Stepper & Buy button */}
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-11 items-center overflow-hidden rounded-[10px] border border-white/10 bg-black/20 shrink-0">
                  <button
                    onClick={() => setQty((q) => Math.max(1, q - 1))}
                    className="w-10 h-11 text-lg text-[var(--muted)] hover:bg-white/5 transition"
                  >
                    −
                  </button>
                  <span className="w-8 text-center text-sm font-bold text-white tabular-nums">
                    {qty}
                  </span>
                  <button
                    onClick={() => setQty((q) => q + 1)}
                    className="w-10 h-11 text-lg text-[var(--muted)] hover:bg-white/5 transition"
                  >
                    +
                  </button>
                </div>
                <button className="h-11 flex-1 bg-gradient-to-r from-[#FF973C] to-[#FF6A00] rounded-[10px] text-sm font-bold text-black hover:brightness-110 active:translate-y-px transition duration-150 shadow-[0_12px_24px_-10px_rgba(255,106,0,0.4)]">
                  Buy Now
                </button>
              </div>

              {/* Telemetry info under button */}
              <div className="font-data flex items-center gap-2 text-[10px] uppercase tracking-[0.06em] text-[var(--muted)]">
                <ZapIcon size={14} className="text-[var(--flame)]" />
                Instant delivery · No expiry on Arena Coins
              </div>
            </div>
          </HudPanel>
        </div>
      </div>
    </main>
  );
}
