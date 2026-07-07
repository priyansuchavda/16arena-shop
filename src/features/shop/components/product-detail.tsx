"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import coinImg from "@/assets/png/coin.png";
import { HudPanel } from "./hud";
import { ScrollRow } from "./scroll-row";
import { ZapIcon } from "@/shared/components/icons";
import { CARD_DENOM_INDEX, denominations } from "../services/product.service";
import { type Product, type CardModel } from "@/features/shop/types/shop.types";

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

export function ProductDetail({
  product,
  related,
}: {
  product: Product;
  related: CardModel[];
}) {
  const denoms = denominations();
  const [denomIdx, setDenomIdx] = useState(CARD_DENOM_INDEX);
  const [qty, setQty] = useState(1);
  const [isReadMore, setIsReadMore] = useState(false);

  const d = denoms[denomIdx] || denoms[0];
  const payCash = d.cash * qty;
  const payCoins = d.coins * qty;

  const isGaming = /gaming|battle royale|fps|moba/i.test(product.sub);

  return (
    <div className="relative flex-1 pb-20">


      <div className="grid grid-cols-1 items-start gap-12 lg:grid-cols-12 relative z-10">
        {/* Left Column: Product Info & Descriptions */}
        <div className="lg:col-span-7">
          {/* Product Banner/Card Graphic */}
          <div className="mb-6 relative block w-full max-w-[560px]">
            <div
              className="relative flex h-[260px] w-full flex-col items-center justify-center rounded-[16px] border border-white/[0.15] p-6 shadow-[0_26px_56px_-18px_rgba(0,0,0,0.85),inset_0_1px_0_rgba(255,255,255,0.24)]"
              style={{
                background: `linear-gradient(150deg, ${product.accent}, ${product.accent2})`,
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
                  {product.brand}
                </span>
              </div>
            </div>
          </div>

          {/* Title & Description */}
          <h1 className="text-[34px] font-extrabold tracking-[-0.02em] text-white">
            {product.brand}
          </h1>

          {(product.description || product.about) && (
            <div className="mt-4 max-w-[560px]">
              <div className={`text-sm leading-[1.6] text-[var(--muted)] whitespace-pre-wrap ${!isReadMore ? 'line-clamp-2' : ''}`}>
                {product.description}
                {product.description && product.about && "\n\n"}
                {product.about}
              </div>
              <button
                onClick={() => setIsReadMore(!isReadMore)}
                className="mt-2 text-[13px] font-bold text-white hover:text-[var(--flame)] transition-colors"
              >
                {isReadMore ? "View less" : "View more"}
              </button>
            </div>
          )}

          {/* Info row: Redeem / Expiry / Usage — arranged in a 2-column grid */}
          <div className="mt-10 grid grid-cols-2 gap-y-6 gap-x-4 max-w-[480px]">
            <div className="flex items-center gap-3">
              <div className="flex h-[32px] w-[32px] shrink-0 items-center justify-center rounded-full bg-white/5 text-white">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12.55a11 11 0 0 1 14.08 0"></path><path d="M1.42 9a16 16 0 0 1 21.16 0"></path><path d="M8.53 16.11a6 6 0 0 1 6.95 0"></path><line x1="12" y1="20" x2="12.01" y2="20"></line>
                </svg>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--muted)] mb-[2px]">Redeem</span>
                <span className="text-[13px] font-bold text-white leading-none">
                  {product.giftCardInfo?.redemptionType === 'ONLINE' ? 'Online' : (product.giftCardInfo?.redemptionLabel || 'Online')}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex h-[32px] w-[32px] shrink-0 items-center justify-center rounded-full bg-white/5 text-white">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--muted)] mb-[2px]">Expiry</span>
                <span className="text-[13px] font-bold text-white leading-none">
                  {product.giftCardInfo?.expiryLabel || 'No Expiry'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex h-[32px] w-[32px] shrink-0 items-center justify-center rounded-full bg-white/5 text-white">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 12 20 22 4 22 4 12"></polyline><rect x="2" y="7" width="20" height="5"></rect><line x1="12" y1="22" x2="12" y2="7"></line><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"></path><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"></path>
                </svg>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--muted)] mb-[2px]">Usage</span>
                <span className="text-[13px] font-bold text-white leading-none">Single Item</span>
              </div>
            </div>
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
                  <label htmlFor="player-uid" className="text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--muted)] block mb-2">
                    Add User ID (UID)
                  </label>
                  <input
                    id="player-uid"
                    type="text"
                    placeholder="Enter your Player ID / UID"
                    className="w-full h-11 bg-black/40 border border-white/10 rounded-[10px] px-4 text-sm text-white placeholder:text-white/30 outline-none focus:border-[var(--flame)]/60 transition-colors"
                  />
                </div>
              )}

              {/* Coupon Code Input */}
              <div className="mb-6">
                <label htmlFor="coupon-code" className="text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--muted)] block mb-2">
                  Coupon Code
                </label>
                <div className="flex gap-2">
                  <input
                    id="coupon-code"
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
                    <span className="text-[14px] font-bold text-[var(--coin)] tabular-nums leading-none">
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
                <button className="h-11 flex-1 bg-gradient-to-r from-[var(--flame)] to-[var(--flame-deep)] rounded-[10px] text-sm font-bold text-black hover:brightness-110 active:translate-y-px transition duration-150 shadow-[0_12px_24px_-10px_rgba(255,68,0,0.4)]">
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

      {related.length > 0 && (
        <div className="mt-4">
          <ScrollRow title="You may also like" items={related} card="section" />
        </div>
      )}
    </div>
  );
}
