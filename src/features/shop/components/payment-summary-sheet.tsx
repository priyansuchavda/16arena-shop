"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { AlertCircle, Loader2, X } from "lucide-react";
import coinImg from "@/assets/png/coin.png";
import { SlantedButton } from "@/shared/components/ui/slanted-button";
import { shopApi, buildCheckoutRequest } from "../api";
import { useCheckout } from "../hooks/useCheckout";
import type { CheckoutPreview, ShopProductDetail, ShopSku } from "../types/shop.types";
import {
  activePaymentRules,
  buyDisabledReason,
  needsHybridForPartialCoins,
  payButtonLabel,
  previewCheckoutWithHybridRetry,
  resolveAllowHybridInrPayment,
  resolveRuleCoinCap,
} from "../utils/checkout.utils";
import { resolveSkuRetailPrice } from "../utils/normalize-product";
import { gradientFor } from "../utils/mappers";
import { useTransparentLogo, useLogoColors } from "./live-product-detail";
import {
  computeFlexibleSubtotal,
  isFlexibleSkuSelection,
} from "../services/product.service";

type PaymentSummarySheetProps = {
  open: boolean;
  onClose: () => void;
  product: ShopProductDetail;
  sku: ShopSku;
  quantity: number;
  coinsBalance: number;
  initialCoinsToRedeem: number;
  couponCode?: string | null;
  customVoucherAmount?: number | null;
  initialPreview?: CheckoutPreview | null;
  cartItemIds?: string[] | null;
  isCartCheckout?: boolean;
};

export function PaymentSummarySheet({
  open,
  onClose,
  product,
  sku,
  quantity,
  coinsBalance: initialCoinsBalance,
  initialCoinsToRedeem,
  couponCode,
  customVoucherAmount,
  initialPreview,
  cartItemIds = null,
  isCartCheckout = false,
}: PaymentSummarySheetProps) {
  const { handleCheckout, loading, error } = useCheckout();
  const [preview, setPreview] = useState<CheckoutPreview | null>(initialPreview ?? null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const previewFetchedRef = useRef(false);

  const isFlexible = isFlexibleSkuSelection(sku);
  const paymentRules = activePaymentRules(preview, sku);
  const coinsBalance = preview?.coinsBalance ?? initialCoinsBalance;

  // Coins are chosen on the product page — fixed for this sheet session.
  const coinsToRedeem = initialCoinsToRedeem;

  const fallbackSubtotal = useMemo(() => {
    if (isFlexible && customVoucherAmount) {
      return computeFlexibleSubtotal(product, sku, customVoucherAmount) * quantity;
    }
    return resolveSkuRetailPrice(sku) * quantity;
  }, [product, sku, quantity, isFlexible, customVoucherAmount]);

  const ruleCoinCap = useMemo(() => {
    return resolveRuleCoinCap({
      preview,
      paymentRules: sku.paymentRules,
      sku,
      coinRules: product.coinRules,
      coinsBalance,
      subtotal: preview?.subtotal ?? fallbackSubtotal,
    });
  }, [preview, sku, product.coinRules, coinsBalance, fallbackSubtotal]);

  const allowHybridInrPayment = useMemo(
    () =>
      resolveAllowHybridInrPayment({
        coinsToRedeem,
        maxCoinsAllowed: ruleCoinCap,
        paymentRules,
      }),
    [coinsToRedeem, ruleCoinCap, paymentRules]
  );

  const hybridBlocked =
    needsHybridForPartialCoins({
      coinsToRedeem,
      maxCoinsAllowed: ruleCoinCap,
      totalPayable: preview?.totalPayable,
    }) &&
    (preview?.totalPayable ?? 0) > 0 &&
    paymentRules?.allowInrPayment === false;

  useEffect(() => {
    if (!open) {
      previewFetchedRef.current = false;
      return;
    }
    setPreview(initialPreview ?? null);
    setPreviewError(null);
    // Product buy flow already synced cart + preview on Buy Now.
    if (initialPreview) {
      previewFetchedRef.current = true;
    }
  }, [open, initialPreview]);

  useEffect(() => {
    if (!open || initialPreview || previewFetchedRef.current) return;

    previewFetchedRef.current = true;
    let cancelled = false;

    const hybridForFetch = resolveAllowHybridInrPayment({
      coinsToRedeem,
      maxCoinsAllowed: resolveRuleCoinCap({
        paymentRules: sku.paymentRules,
        sku,
        coinRules: product.coinRules,
        coinsBalance: initialCoinsBalance,
        subtotal: fallbackSubtotal,
      }),
      paymentRules: sku.paymentRules,
    });

    const loadPreview = async () => {
      setPreviewLoading(true);
      setPreviewError(null);
      try {
        if (!isCartCheckout) {
          await shopApi.addToCart(
            sku.id,
            quantity,
            isFlexible ? customVoucherAmount : null
          );
        }

        const request = buildCheckoutRequest({
          cartItemIds: null,
          coinsToRedeem,
          couponCode,
          allowHybridInrPayment: hybridForFetch,
          quantity,
          isSquad: quantity >= 5,
        });

        const nextPreview = await previewCheckoutWithHybridRetry(
          request,
          (req) => shopApi.checkoutPreview(req)
        );
        if (!cancelled) setPreview(nextPreview);
      } catch (err: unknown) {
        if (!cancelled) {
          const message =
            err instanceof Error
              ? err.message
              : (err as { response?: { data?: { message?: string } } })?.response?.data
                  ?.message ?? "Failed to load checkout preview.";
          setPreviewError(message);
        }
      } finally {
        if (!cancelled) setPreviewLoading(false);
      }
    };

    void loadPreview();

    return () => {
      cancelled = true;
    };
  }, [
    open,
    initialPreview,
    isCartCheckout,
    sku,
    product.coinRules,
    quantity,
    isFlexible,
    customVoucherAmount,
    coinsToRedeem,
    couponCode,
    initialCoinsBalance,
    fallbackSubtotal,
  ]);

  const totalPayable = preview?.totalPayable ?? fallbackSubtotal;
  const payLabel = payButtonLabel(totalPayable);
  const displayCoinsSpent = preview?.coinsSpent ?? coinsToRedeem;

  const fallbackG = useMemo(() => gradientFor(product.brandName ?? product.name), [product]);
  const g = useLogoColors(product.logoUrl ?? null, fallbackG);
  const totalFaceValue = (isFlexible ? (customVoucherAmount ?? 0) : sku.faceValue ?? sku.unitAmount ?? 0) * quantity;
  const subtotalVal = totalFaceValue;
  const baseDiscountedPrice = totalPayable + (preview?.coinsDiscount ?? 0);
  const instantDiscountVal = Math.max(0, totalFaceValue - baseDiscountedPrice);
  const instantDiscountPercent = totalFaceValue > 0 ? Math.round((instantDiscountVal / totalFaceValue) * 100) : 0;
  const coinDiscountPercent = baseDiscountedPrice > 0 ? Math.round(((preview?.coinsDiscount ?? 0) / baseDiscountedPrice) * 100) : 0;
  const transparentLogoUrl = useTransparentLogo(product.logoUrl ?? null);

  const disabledReason =
    buyDisabledReason({
      sku,
      coinsBalance,
      paymentRules,
      preview,
    }) ??
    (hybridBlocked ? "Partial coin payment is not available for this item." : null);

  const onPay = () => {
    if (disabledReason || previewLoading || previewError || !preview) return;
    handleCheckout({
      skuId: sku.id,
      quantity,
      coinsToRedeem,
      couponCode,
      customVoucherAmount: isFlexible ? customVoucherAmount : null,
      allowHybridInrPayment,
      productName: product.name,
      cartItemIds: isCartCheckout ? null : cartItemIds,
      isCartCheckout,
      previewHint: preview,
    });
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/70 p-0 sm:items-center sm:p-4">
      <button
        type="button"
        className="absolute inset-0"
        aria-label="Close payment summary"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-lg overflow-hidden rounded-t-3xl border border-white/10 bg-[#161616] shadow-2xl sm:rounded-3xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 z-20 rounded-lg p-2 text-white/50 hover:bg-white/10 hover:text-white"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="max-h-[70vh] overflow-y-auto px-5 pt-14 pb-4 flex flex-col gap-5">
          {previewLoading && (
            <div className="flex items-center gap-2 text-sm text-white/60">
              <Loader2 className="h-4 w-4 animate-spin text-[var(--flame)]" />
              Updating totals…
            </div>
          )}

          {previewError && (
            <div className="flex items-start gap-2 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-300">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{previewError}</span>
            </div>
          )}

          {/* Premium Card Graphic */}
          <div
            className="relative flex h-[160px] w-full flex-col justify-between rounded-[14px] border border-white/10 p-5 overflow-hidden select-none"
            style={{
              background: `linear-gradient(to top right, ${g.accent} 0%, ${g.accent} 50%, ${g.accent2} 100%)`,
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.15)",
            }}
          >
            {/* Specular Sheen Reflections Overlay */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden select-none z-0 opacity-40">
              <div 
                className="absolute rounded-full"
                style={{
                  left: '20%',
                  top: '38%',
                  width: '140%',
                  height: '34%',
                  transform: 'rotate(45deg)',
                  filter: 'blur(21px)',
                  background: 'linear-gradient(to right, rgba(255,255,255,0) 0%, rgba(255,255,255,0.36) 50%, rgba(255,255,255,0) 100%)',
                }}
              />
            </div>

            <div className="flex justify-between items-start z-10">
              <span className="text-[20px] font-black text-white leading-none tracking-tight">
                {product.brandName || product.name}
              </span>
            </div>

            <div className="flex justify-between items-end z-10 mt-auto relative">
              <div className="flex items-center gap-3">
                {transparentLogoUrl ? (
                  <Image
                    src={transparentLogoUrl}
                    alt=""
                    width={240}
                    height={80}
                    className="h-20 w-auto object-contain translate-y-3.5"
                  />
                ) : (
                  <span className="text-xs font-bold uppercase tracking-[0.05em] text-white/90">
                    {product.brandName ?? product.name}
                  </span>
                )}
              </div>
              <div className="flex flex-col items-end shrink-0 pb-1">
                <span className="text-[10px] font-heading font-medium uppercase tracking-[0.1em] text-white/60">
                  Voucher worth
                </span>
                <span className="text-2xl font-bold text-white tracking-tight mt-0.5 leading-none">
                  ₹{(isFlexible ? (customVoucherAmount ?? 0) : sku.faceValue ?? sku.unitAmount ?? 0).toLocaleString("en-IN")}
                </span>
              </div>
            </div>
          </div>

          {/* Title and Green discount text */}
          <div className="flex flex-col gap-1">
            <h3 className="text-lg font-extrabold text-white font-sans">
              ₹{(isFlexible ? (customVoucherAmount ?? 0) : sku.faceValue ?? sku.unitAmount ?? 0).toLocaleString("en-IN")} {product.brandName ?? product.name} card
            </h3>
            {instantDiscountPercent > 0 ? (
              <span className="text-xs font-bold text-[#25C26E] font-sans">
                Getting for ₹{baseDiscountedPrice.toLocaleString("en-IN")} <span className="line-through text-white/40 ml-1">₹{subtotalVal.toLocaleString("en-IN")}</span> ({instantDiscountPercent}%off)
              </span>
            ) : (
              <span className="text-xs font-bold text-white/40 font-sans">
                Getting for ₹{subtotalVal.toLocaleString("en-IN")}
              </span>
            )}
          </div>

          {/* Summary section */}
          <div className="flex flex-col gap-3 font-sans mt-1">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider">Summary</h4>
            <div className="border-t border-white/10 my-0.5" />
            <div className="flex flex-col gap-3">
              {/* Row 1: Brand card worth */}
              <div className="flex justify-between items-start text-sm">
                <div className="flex flex-col">
                  <span className="text-white font-medium">Brand card worth</span>
                  <span className="text-xs text-white/40 font-medium mt-0.5">
                    ₹{(isFlexible ? (customVoucherAmount ?? 0) : sku.faceValue ?? sku.unitAmount ?? 0).toLocaleString("en-IN")} card x{quantity}
                  </span>
                </div>
                <span className="text-white font-bold">
                  ₹{subtotalVal.toLocaleString("en-IN")}
                </span>
              </div>

              {/* Row 2: Instant Discount (Regular discount + Coupon) */}
              {instantDiscountVal > 0 && (
                <div className="flex justify-between items-center text-sm">
                  <span className="text-[#25C26E] font-medium">Instant Discount</span>
                  <span className="text-white font-medium">
                    -₹{instantDiscountVal.toLocaleString("en-IN")} ({instantDiscountPercent}%)
                  </span>
                </div>
              )}

              {/* Row 3: Instant Discount with Coins */}
              {displayCoinsSpent > 0 && (preview?.coinsDiscount ?? 0) > 0 && (
                <div className="flex justify-between items-center text-sm">
                  <div className="flex items-center gap-1 text-[#25C26E] font-medium">
                    <span>Instant Discount with</span>
                    <Image src={coinImg} alt="" width={14} height={14} className="object-contain shrink-0" />
                    <span>{displayCoinsSpent.toLocaleString("en-IN")}</span>
                  </div>
                  <span className="text-white font-medium">
                    -₹{preview?.coinsDiscount?.toLocaleString("en-IN") ?? "0"} ({coinDiscountPercent}%)
                  </span>
                </div>
              )}
            </div>

            {/* Divider */}
            <div className="border-t border-white/10 my-1" />

            {/* Row 4: You pay only */}
            <div className="flex justify-between items-center text-base font-bold">
              <span className="text-white">You pay only</span>
              <span className="text-white text-lg">
                ₹{totalPayable.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          {error && (
            <p className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-300">
              {error}
            </p>
          )}
          {disabledReason && (
            <p className="text-sm text-amber-300">{disabledReason}</p>
          )}
        </div>

        <div className="p-5">
          <SlantedButton
            type="button"
            onClick={onPay}
            disabled={previewLoading || !!disabledReason || !!previewError || !preview}
            isLoading={loading}
            className="w-full h-12 uppercase text-xs"
          >
            {payLabel}
          </SlantedButton>
        </div>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  accent,
  bold,
}: {
  label: string;
  value: string;
  accent?: string;
  bold?: boolean;
}) {
  return (
    <div className={`flex justify-between ${accent ?? "text-white/70"}`}>
      <span>{label}</span>
      <span className={bold ? "font-black text-white" : "font-semibold"}>{value}</span>
    </div>
  );
}
