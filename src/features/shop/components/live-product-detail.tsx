"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import Image from "next/image";
import { AlertCircle, ChevronDown, ChevronUp, Copy, Check, Info, Loader2, Sparkles, Tag as TagIcon, ArrowRight } from "lucide-react";
import coinImg from "@/assets/png/coin.png";
import { HudPanel } from "./hud";
import { ScrollRow } from "./scroll-row";
import { CoinIcon, ZapIcon } from "@/shared/components/icons";
import { gradientFor, apiToCard } from "@/features/shop/utils/mappers";
import { useAuthStore, useUserSummary } from "@/features/auth";
import { shopApi } from "../api";
import { PaymentSummarySheet } from "./payment-summary-sheet";
import {
  ShopProductDetail,
  ShopSku,
  CheckoutPreview,
  ShopAmountRestrictions,
  CardModel,
} from "../types/shop.types";
import {
  splitFixedSkus,
  resolveFlexibleSku,
  isFlexibleSkuSelection,
  resolveSkuAmountRestrictions,
  computeOptimalCoinsToRedeem,
  shouldShowCoinEditor,
  computeFlexibleSubtotal,
} from "../services/product.service";
import { shouldAllowHybridInrPayment, buyDisabledReason } from "../utils/checkout.utils";
import { resolveSkuRetailPrice } from "../utils/normalize-product";

function rgba(hex: string, opacity: number) {
  const cleanHex = hex.replace("#", "");
  const r = parseInt(cleanHex.substring(0, 2), 16);
  const g = parseInt(cleanHex.substring(2, 4), 16);
  const b = parseInt(cleanHex.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

interface LiveProductDetailProps {
  product: ShopProductDetail;
  related?: CardModel[];
}

export function LiveProductDetail({ product, related = [] }: LiveProductDetailProps) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const openAuthModal = useAuthStore((state) => state.openAuthModal);
  const { data: userSummary } = useUserSummary();
  const [paymentSheetOpen, setPaymentSheetOpen] = useState(false);

  // Extract color tokens
  const g = gradientFor(product.brandName ?? product.name);
  const fixedSkus = useMemo(() => splitFixedSkus(product), [product]);
  const flexibleSku = useMemo(() => resolveFlexibleSku(product), [product]);

  // Active SKU states
  const [selectedSku, setSelectedSku] = useState<ShopSku | null>(() => {
    if (fixedSkus.length > 0) {
      const popular = fixedSkus.find((s) => s.isPopular);
      return popular || fixedSkus[0];
    }
    return flexibleSku || null;
  });

  const isFlexibleSelection = selectedSku?.isDynamicDenomination ?? false;

  // Flexible Amount fields
  const amountRestrictions = useMemo(() => {
    if (!selectedSku) return null;
    return resolveSkuAmountRestrictions(product, selectedSku);
  }, [product, selectedSku]);

  const [customAmountText, setCustomAmountText] = useState(() => {
    return amountRestrictions ? String(amountRestrictions.minVoucherAmount) : "";
  });
  const [customAmount, setCustomAmount] = useState<number>(() => {
    return amountRestrictions ? amountRestrictions.minVoucherAmount : 0;
  });
  const [amountError, setAmountError] = useState<string | null>(null);

  // Quantity
  const [qty, setQty] = useState(1);

  // Coupon
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);

  // Coins settings
  const [applyCoins, setApplyCoins] = useState(true);
  const [customCoins, setCustomCoins] = useState<number | null>(null);

  // Accordions states
  const [showHowToRedeem, setShowHowToRedeem] = useState(true);
  const [showTerms, setShowTerms] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isReadMore, setIsReadMore] = useState(false);

  // Checkout Preview cache
  const [checkoutPreview, setCheckoutPreview] = useState<CheckoutPreview | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const coinsBalance = checkoutPreview?.coinsBalance ?? userSummary?.arenaCoins ?? 0;

  const previewDebounceRef = useRef<NodeJS.Timeout | null>(null);

  // Handle custom amount input validation
  const handleCustomAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, "");
    setCustomAmountText(val);

    if (!val) {
      setAmountError("Please enter an amount");
      setCustomAmount(0);
      return;
    }

    const num = parseInt(val, 10);
    setCustomAmount(num);

    if (amountRestrictions) {
      if (num < amountRestrictions.minVoucherAmount) {
        setAmountError(`Minimum amount is ₹${amountRestrictions.minVoucherAmount}`);
      } else if (num > amountRestrictions.maxVoucherAmount) {
        setAmountError(`Maximum amount is ₹${amountRestrictions.maxVoucherAmount}`);
      } else {
        setAmountError(null);
      }
    }
  };

  // Computes optimal coins
  const subtotal = useMemo(() => {
    if (!selectedSku) return 0;
    if (isFlexibleSelection) {
      return computeFlexibleSubtotal(product, selectedSku, customAmount) * qty;
    }
    return (resolveSkuRetailPrice(selectedSku)) * qty;
  }, [product, selectedSku, isFlexibleSelection, customAmount, qty]);

  const optimalCoins = useMemo(() => {
    if (!selectedSku) return 0;
    return computeOptimalCoinsToRedeem({
      rules: product.coinRules,
      coinsBalance,
      subtotal,
      paymentRules: selectedSku.paymentRules,
      sku: selectedSku,
    });
  }, [product, selectedSku, coinsBalance, subtotal]);

  const coinsToRedeem = useMemo(() => {
    if (!applyCoins) return 0;
    if (customCoins !== null) {
      return Math.min(customCoins, optimalCoins);
    }
    return optimalCoins;
  }, [applyCoins, customCoins, optimalCoins]);

  const allowHybridInrPayment = useMemo(() => {
    const rules = checkoutPreview?.paymentRules ?? selectedSku?.paymentRules;
    const maxCoins =
      rules?.maxCoinsAllowedEstimate ??
      checkoutPreview?.paymentRules?.maxCoinsAllowedEstimate ??
      optimalCoins;
    return shouldAllowHybridInrPayment({
      coinsToRedeem,
      maxCoinsAllowed: maxCoins,
      totalPayable: checkoutPreview?.totalPayable,
      paymentRules: rules,
    });
  }, [selectedSku, checkoutPreview, coinsToRedeem, optimalCoins]);

  // Load Checkout Preview (auth required — matches mobile API)
  const loadPreview = async () => {
    if (!selectedSku || !isAuthenticated) {
      setPreviewLoading(false);
      return;
    }
    if (isFlexibleSelection && (!customAmount || amountError)) {
      setPreviewLoading(false);
      return;
    }

    setPreviewLoading(true);
    setPreviewError(null);

    try {
      const preview = await shopApi.checkoutPreview({
        skuId: selectedSku.id,
        quantity: qty,
        coinsToRedeem,
        couponCode: appliedCoupon,
        customVoucherAmount: isFlexibleSelection ? customAmount : null,
        allowHybridInrPayment,
      });

      if (preview) {
        setCheckoutPreview(preview);
      } else {
        setPreviewError("Failed to resolve checkout price preview.");
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : (err as { response?: { data?: { message?: string } } })?.response?.data
              ?.message ?? "Error validating order calculations.";
      setPreviewError(message);
    } finally {
      setPreviewLoading(false);
    }
  };

  // Debounced preview trigger
  useEffect(() => {
    if (!isAuthenticated) {
      setCheckoutPreview(null);
      setPreviewLoading(false);
      setPreviewError(null);
      return;
    }

    if (previewDebounceRef.current) clearTimeout(previewDebounceRef.current);

    previewDebounceRef.current = setTimeout(() => {
      void loadPreview();
    }, 400);

    return () => {
      if (previewDebounceRef.current) clearTimeout(previewDebounceRef.current);
    };
  }, [
    isAuthenticated,
    selectedSku,
    customAmount,
    qty,
    appliedCoupon,
    coinsToRedeem,
    allowHybridInrPayment,
    amountError,
    isFlexibleSelection,
  ]);

  // Set default flexible amount when selecting flexible SKU
  useEffect(() => {
    if (isFlexibleSelection && amountRestrictions) {
      setCustomAmountText(String(amountRestrictions.minVoucherAmount));
      setCustomAmount(amountRestrictions.minVoucherAmount);
      setAmountError(null);
    }
  }, [selectedSku, isFlexibleSelection, amountRestrictions]);

  const buyWarning = useMemo(
    () =>
      buyDisabledReason({
        sku: selectedSku,
        coinsBalance,
        paymentRules: checkoutPreview?.paymentRules ?? selectedSku?.paymentRules,
        preview: checkoutPreview,
        amountError: isFlexibleSelection ? amountError : null,
      }),
    [selectedSku, coinsBalance, checkoutPreview, amountError, isFlexibleSelection]
  );

  const triggerBuy = () => {
    if (!selectedSku || buyWarning) return;
    if (isFlexibleSelection && amountError) return;

    if (!isAuthenticated) {
      openAuthModal();
      return;
    }

    setPaymentSheetOpen(true);
  };

  const handleApplyCoupon = () => {
    if (!couponCode.trim()) return;
    setAppliedCoupon(couponCode.trim());
  };

  const handleRemoveCoupon = () => {
    setCouponCode("");
    setAppliedCoupon(null);
  };

  // Pricing display resolvers
  const displayPrice =
    checkoutPreview?.totalPayable ??
    (isFlexibleSelection ? customAmount : resolveSkuRetailPrice(selectedSku)) * qty;
  const displayOriginal = isFlexibleSelection
    ? customAmount * qty
    : (selectedSku?.originalPrice ?? resolveSkuRetailPrice(selectedSku)) * qty;
  const savingsPct = isFlexibleSelection
    ? 0
    : selectedSku?.savingsPercent ||
      Math.round(
        (1 - resolveSkuRetailPrice(selectedSku) / (selectedSku?.originalPrice || 1)) * 100
      );

  return (
    <div className="relative flex-1 pb-20">
      {/* Dynamic graphic background */}
      {product.heroImageUrl && (
        <div className="absolute right-0 top-[-80px] pointer-events-none hidden lg:block w-[55%] h-[680px] overflow-hidden opacity-10 select-none">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={product.heroImageUrl}
            alt=""
            className="w-full h-full object-cover rounded-3xl"
            style={{
              maskImage: "radial-gradient(ellipse at 80% 50%, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 80%)",
              WebkitMaskImage: "radial-gradient(ellipse at 80% 50%, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 80%)",
            }}
          />
        </div>
      )}

      <div className="grid grid-cols-1 items-start gap-10 lg:grid-cols-12 relative z-10 pt-6">
        {/* LEFT COLUMN: VOUCHER DESIGN & INFOS */}
        <div className="lg:col-span-7 flex flex-col gap-6">

          {/* Brand Premium Card Design */}
          <div className="relative w-full max-w-[560px] aspect-[1.85/1] rounded-[24px] overflow-hidden border border-white/10 p-6 flex flex-col justify-between shadow-2xl transition hover:scale-[1.01]"
            style={{
              background: `linear-gradient(135deg, ${g.accent} 0%, ${g.accent2} 100%)`,
              boxShadow: `0 20px 50px -15px ${rgba(g.accent, 0.4)}, inset 0 1px 0 rgba(255,255,255,0.15)`
            }}>
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-bold tracking-[0.15em] uppercase text-white/60">Digital Gift Voucher</span>
              <Sparkles className="w-5 h-5 text-white/50" />
            </div>

            <div className="flex flex-col gap-1 items-start">
              <span className="text-[10px] font-medium uppercase tracking-[0.08em] text-white/70">Voucher Worth</span>
              <span className="text-[34px] font-black leading-none text-white tabular-nums">
                ₹{(isFlexibleSelection ? customAmount : selectedSku?.faceValue ?? selectedSku?.unitAmount ?? 0).toLocaleString("en-IN")}
              </span>
            </div>

            <div className="flex items-center gap-3">
              {product.logoUrl && (
                <div className="relative w-8 h-8 rounded-full overflow-hidden border border-white/15 bg-black/10">
                  <Image src={product.logoUrl} alt="" fill className="object-cover" />
                </div>
              )}
              <span className="text-xs font-bold uppercase tracking-[0.05em] text-white/90">
                {product.brandName ?? product.name}
              </span>
            </div>
          </div>

          {/* Title and Descriptions */}
          <div className="max-w-[560px]">
            <h1 className="text-[32px] font-extrabold tracking-tight text-white">{product.name}</h1>
            {(product.description || product.about) && (
              <>
                <p
                  className={`mt-3 text-sm text-[var(--muted)] leading-relaxed whitespace-pre-wrap ${!isReadMore ? "line-clamp-2" : ""}`}
                >
                  {product.description || product.about}
                </p>
                <button
                  onClick={() => setIsReadMore(!isReadMore)}
                  className="mt-2 text-[13px] font-bold text-white hover:text-[var(--flame)] transition-colors"
                >
                  {isReadMore ? "View less" : "View more"}
                </button>
              </>
            )}
          </div>

          {/* Core Voucher Badges */}
          <div className="mt-4 grid grid-cols-3 gap-4 max-w-[560px]">
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/[0.02] border border-white/5">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/5 text-white">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12.55a11 11 0 0 1 14.08 0"></path><path d="M1.42 9a16 16 0 0 1 21.16 0"></path><path d="M8.53 16.11a6 6 0 0 1 6.95 0"></path><line x1="12" y1="20" x2="12.01" y2="20"></line>
                </svg>
              </div>
              <div className="flex flex-col">
                <span className="text-[9px] font-bold uppercase tracking-[0.05em] text-[var(--muted)]">Redemption</span>
                <span className="text-xs font-bold text-white mt-0.5">
                  {product.giftCardInfo?.redemptionType === "ONLINE" ? "Online Only" : "Web & App"}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/[0.02] border border-white/5">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/5 text-white">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              </div>
              <div className="flex flex-col">
                <span className="text-[9px] font-bold uppercase tracking-[0.05em] text-[var(--muted)]">Expiry</span>
                <span className="text-xs font-bold text-white mt-0.5">
                  {product.giftCardInfo?.expiryLabel || "No Expiry"}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/[0.02] border border-white/5">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/5 text-white">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 12 20 22 4 22 4 12"></polyline><rect x="2" y="7" width="20" height="5"></rect><line x1="12" y1="22" x2="12" y2="7"></line><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"></path><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"></path>
                </svg>
              </div>
              <div className="flex flex-col">
                <span className="text-[9px] font-bold uppercase tracking-[0.05em] text-[var(--muted)]">Voucher Type</span>
                <span className="text-xs font-bold text-white mt-0.5">
                  {product.giftCardInfo?.cardType || "Digital Code"}
                </span>
              </div>
            </div>
          </div>

          <hr className="my-2 border-white/5 max-w-[560px]" />

          {/* How to use Accordion */}
          {product.giftCardInfo?.howToUseInstructions && (
            <div className="max-w-[560px] rounded-2xl border border-white/5 bg-[#121212]/30 overflow-hidden">
              <button
                onClick={() => setShowHowToRedeem(!showHowToRedeem)}
                className="w-full flex items-center justify-between p-4 font-bold text-sm text-white hover:bg-white/[0.02] transition"
              >
                <span className="flex items-center gap-2">💡 How to Redeem</span>
                {showHowToRedeem ? <ChevronUp className="w-4 h-4 text-white/50" /> : <ChevronDown className="w-4 h-4 text-white/50" />}
              </button>
              {showHowToRedeem && (
                <div className="p-4 pt-0 text-xs text-[var(--muted)] leading-relaxed border-t border-white/5 bg-black/10">
                  <div className="whitespace-pre-line">
                    {product.giftCardInfo.howToUseInstructions}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Terms & Conditions Accordion */}
          {product.giftCardInfo?.termsAndConditions && (
            <div className="max-w-[560px] rounded-2xl border border-white/5 bg-[#121212]/30 overflow-hidden">
              <button
                onClick={() => setShowTerms(!showTerms)}
                className="w-full flex items-center justify-between p-4 font-bold text-sm text-white hover:bg-white/[0.02] transition"
              >
                <span className="flex items-center gap-2">📜 Terms & Conditions</span>
                {showTerms ? <ChevronUp className="w-4 h-4 text-white/50" /> : <ChevronDown className="w-4 h-4 text-white/50" />}
              </button>
              {showTerms && (
                <div className="p-4 pt-0 text-xs text-[var(--muted)] leading-relaxed border-t border-white/5 bg-black/10">
                  <div className="whitespace-pre-line">
                    {product.giftCardInfo.termsAndConditions}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: DENOMINATIONS & COIN MATH */}
        <div className="lg:col-span-5 lg:sticky lg:top-[90px] w-full">
          <HudPanel cut={14} border="var(--line)" fill="var(--carbon)" className="w-full">
            <div className="p-6 flex flex-col gap-5">

              {/* Denomination Choices */}
              <div>
                <label className="text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--muted)] block mb-3">
                  Select Denomination
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {fixedSkus.map((sku) => {
                    const active = selectedSku?.id === sku.id;
                    return (
                      <button
                        key={sku.id}
                        type="button"
                        onClick={() => {
                          setSelectedSku(sku);
                          setCustomCoins(null);
                        }}
                        className={`flex flex-col items-center p-3 rounded-xl border transition text-center ${active
                          ? "border-[var(--flame)] bg-[var(--flame)]/[0.08] text-white shadow-[0_0_15px_rgba(254,131,33,0.1)]"
                          : "border-white/5 bg-black/30 text-[var(--muted)] hover:border-white/20"
                          }`}
                      >
                        <span className="text-sm font-extrabold text-white">
                          ₹{resolveSkuRetailPrice(sku).toLocaleString("en-IN")}
                        </span>
                        {sku.savingsPercent ? (
                          <span className="text-[9px] text-[var(--win)] font-semibold mt-0.5">Save {sku.savingsPercent}%</span>
                        ) : (
                          <span className="text-[9px] text-white/30 mt-0.5">Voucher</span>
                        )}
                      </button>
                    );
                  })}

                  {flexibleSku && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedSku(flexibleSku);
                        setCustomCoins(null);
                      }}
                      className={`flex flex-col items-center justify-center p-3 rounded-xl border transition text-center ${isFlexibleSelection
                        ? "border-[var(--flame)] bg-[var(--flame)]/[0.08] text-white shadow-[0_0_15px_rgba(254,131,33,0.1)]"
                        : "border-white/5 bg-black/30 text-[var(--muted)] hover:border-white/20"
                        }`}
                    >
                      <span className="text-sm font-extrabold text-white">Custom</span>
                      <span className="text-[9px] text-[var(--flame)] font-semibold mt-0.5">Any Amount</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Dynamic Input (for custom voucher values) */}
              {isFlexibleSelection && amountRestrictions && (
                <div className="animate-in slide-in-from-top-2 duration-150 p-4 rounded-xl border border-white/5 bg-black/30">
                  <label className="text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--muted)] flex justify-between mb-2">
                    <span>Enter Custom Amount</span>
                    <span className="text-[var(--flame)]">Min: ₹{amountRestrictions.minVoucherAmount} - Max: ₹{amountRestrictions.maxVoucherAmount}</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-white text-base">₹</span>
                    <input
                      type="text"
                      value={customAmountText}
                      onChange={handleCustomAmountChange}
                      maxLength={String(amountRestrictions.maxVoucherAmount).length}
                      className="w-full h-11 bg-black/40 border border-white/10 rounded-xl pl-8 pr-4 text-sm text-white font-bold outline-none focus:border-[var(--flame)]/60 transition"
                      placeholder={`${amountRestrictions.minVoucherAmount}`}
                    />
                  </div>
                  {amountError && (
                    <div className="flex items-center gap-1 mt-2 text-xs font-semibold text-red-400">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>{amountError}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Coupon Validate */}
              <div>
                <label className="text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--muted)] block mb-2">
                  Coupon Code
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    disabled={appliedCoupon !== null}
                    placeholder="VOUCHER50"
                    className="flex-1 h-11 bg-black/40 border border-white/10 rounded-xl px-4 text-xs font-semibold text-white placeholder:text-white/20 outline-none focus:border-[var(--flame)] focus:ring-0 focus-visible:outline-none"
                    style={{ outline: "none", boxShadow: "none" }}
                  />
                  {appliedCoupon ? (
                    <button
                      type="button"
                      onClick={handleRemoveCoupon}
                      className="h-11 px-4 bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-bold rounded-xl active:scale-95 transition"
                    >
                      Remove
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleApplyCoupon}
                      className="h-11 px-4 bg-white/5 border border-white/10 text-white text-xs font-bold rounded-xl hover:bg-white/10 active:scale-95 transition"
                    >
                      Apply
                    </button>
                  )}
                </div>
                {appliedCoupon && (
                  <p className="text-[10px] font-bold text-[var(--win)] mt-1.5 flex items-center gap-1">
                    ✓ Code &apos;{appliedCoupon}&apos; validation scheduled
                  </p>
                )}
              </div>

              {/* Arena Coins coverage selector */}
              {optimalCoins > 0 && (
                <div className="p-4 rounded-xl border border-white/5 bg-black/25">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--muted)]">Redeem Arena Coins</span>
                    <button
                      type="button"
                      onClick={() => setApplyCoins(!applyCoins)}
                      className={`text-xs font-bold ${applyCoins ? "text-[var(--flame)]" : "text-white/40"} transition`}
                    >
                      {applyCoins ? "Redeeming" : "Off"}
                    </button>
                  </div>

                  <div className="flex items-center justify-between mb-3 text-xs">
                    <span className="text-white/50">Your Balance:</span>
                    <span className="text-[var(--coin)] font-bold flex items-center gap-1">
                      <Image src={coinImg} alt="" width={13} height={13} />
                      {coinsBalance.toLocaleString()}
                    </span>
                  </div>

                  {applyCoins && (
                    <div className="flex flex-col gap-2">
                      <div className="flex justify-between text-[10px] text-white/50 font-bold uppercase">
                        <span>Coins to Spend</span>
                        <span className="text-[var(--coin)]">{coinsToRedeem.toLocaleString()}</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max={optimalCoins}
                        value={coinsToRedeem}
                        onChange={(e) => setCustomCoins(parseInt(e.target.value, 10))}
                        className="w-full accent-[var(--flame)] cursor-pointer h-1 rounded-lg bg-white/10 outline-none"
                      />
                      <div className="flex justify-between text-[9px] text-white/30">
                        <span>0</span>
                        <span>Max Allowed: {optimalCoins.toLocaleString()}</span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* You Pay Price Card */}
              <div className="p-4 bg-black/30 border border-white/5 rounded-2xl relative overflow-hidden">
                {previewLoading && (
                  <div className="absolute inset-0 bg-black/60 backdrop-blur-[1px] flex items-center justify-center z-10 rounded-2xl">
                    <Loader2 className="w-6 h-6 text-[var(--flame)] animate-spin" />
                  </div>
                )}

                <span className="text-[9px] font-bold uppercase tracking-[0.08em] text-[var(--muted)]">Total Payable</span>

                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-3xl font-black text-white tabular-nums leading-none">
                    ₹{displayPrice.toLocaleString()}
                  </span>
                  {coinsToRedeem > 0 && (
                    <>
                      <span className="text-xl text-white/30 font-light leading-none">+</span>
                      <div className="flex items-center gap-1 bg-white/5 px-2 py-1 rounded-lg border border-white/5 leading-none">
                        <Image src={coinImg} alt="Coins" width={14} height={14} />
                        <span className="text-xs font-bold text-[var(--coin)] tabular-nums">
                          {coinsToRedeem.toLocaleString()}
                        </span>
                      </div>
                    </>
                  )}
                </div>

                {!isAuthenticated && (
                  <p className="mt-2 text-[10px] font-semibold text-[var(--flame)]">
                    Sign in to see live pricing and checkout
                  </p>
                )}
                {previewError && (
                  <p className="mt-2 text-[10px] font-semibold text-red-400">{previewError}</p>
                )}

                <div className="mt-3.5 flex items-center justify-between border-t border-white/5 pt-3 text-[10px] font-bold uppercase">
                  <span className="text-[var(--muted)] tracking-wider">Estimated Savings:</span>
                  <span className="font-extrabold tracking-wider text-[var(--win)]">
                    {savingsPct > 0 ? `SAVE ${savingsPct}%` : `BEST VALUE`}
                  </span>
                </div>
              </div>

              {/* Buy Action Box */}
              <div className="flex items-center gap-2 mt-1">
                <div className="flex items-center border border-white/10 bg-black/20 rounded-xl overflow-hidden h-12 shrink-0">
                  <button
                    type="button"
                    onClick={() => setQty((q) => Math.max(1, q - 1))}
                    className="w-10 h-full hover:bg-white/5 text-white/60 font-bold active:scale-90 transition"
                  >
                    −
                  </button>
                  <span className="w-8 text-center text-xs font-bold text-white font-mono tabular-nums">
                    {qty}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQty((q) => q + 1)}
                    className="w-10 h-full hover:bg-white/5 text-white/60 font-bold active:scale-90 transition"
                  >
                    +
                  </button>
                </div>

                <button
                  type="button"
                  onClick={triggerBuy}
                  disabled={!selectedSku || !!buyWarning}
                  className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[var(--flame)] via-[var(--flame-deep)] to-[var(--flame)] text-sm font-extrabold uppercase tracking-wider text-black shadow-[0_12px_24px_-10px_rgba(255,68,0,0.4)] transition hover:brightness-105 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <span>{isAuthenticated ? "Buy Now" : "Sign in to Buy"}</span>
                  <ArrowRight className="h-4 w-4 text-black" />
                </button>
              </div>

              {/* Warnings and Info flags */}
              {buyWarning && (
                <div className="mt-1 rounded-lg border border-amber-500/25 bg-amber-500/10 p-2 text-center text-xs font-semibold text-amber-300">
                  {buyWarning}
                </div>
              )}

              <div className="flex items-center gap-2 text-[9px] uppercase tracking-[0.06em] text-[var(--muted)] font-medium mt-1">
                <ZapIcon size={12} className="text-[var(--flame)]" />
                Instant Delivery · Secure Razorpay Checkout Gateway
              </div>

            </div>
          </HudPanel>
        </div>
      </div>

      {related.length > 0 && (
        <div className="mt-4 relative z-10">
          <ScrollRow title="You may also like" items={related} card="section" />
        </div>
      )}

      {selectedSku && (
        <PaymentSummarySheet
          open={paymentSheetOpen}
          onClose={() => setPaymentSheetOpen(false)}
          product={product}
          sku={selectedSku}
          quantity={qty}
          coinsBalance={coinsBalance}
          initialCoinsToRedeem={coinsToRedeem}
          couponCode={appliedCoupon}
          customVoucherAmount={isFlexibleSelection ? customAmount : null}
          initialPreview={checkoutPreview}
        />
      )}
    </div>
  );
}
