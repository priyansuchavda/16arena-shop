"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { AlertCircle, Loader2, X } from "lucide-react";
import coinImg from "@/assets/png/coin.png";
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
      <div className="relative z-10 w-full max-w-lg overflow-hidden rounded-t-3xl border border-white/10 bg-[#121212] shadow-2xl sm:rounded-3xl">
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">
              Payment Summary
            </p>
            <h2 className="text-lg font-black text-white">{product.name}</h2>
            <p className="text-xs text-white/50">{sku.label}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-white/50 hover:bg-white/10 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="max-h-[70vh] overflow-y-auto px-5 py-4">
          {previewLoading && (
            <div className="mb-4 flex items-center gap-2 text-sm text-white/60">
              <Loader2 className="h-4 w-4 animate-spin text-[var(--flame)]" />
              Updating totals…
            </div>
          )}

          {previewError && (
            <div className="mb-4 flex items-start gap-2 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-300">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{previewError}</span>
            </div>
          )}

          <div className="space-y-2 rounded-2xl border border-white/10 bg-black/30 p-4 text-sm">
            <Row label="Subtotal" value={`₹${(preview?.subtotal ?? fallbackSubtotal).toLocaleString("en-IN")}`} />
            {(preview?.totalDiscount ?? 0) > 0 && (
              <Row
                label="Discount"
                value={`-₹${preview!.totalDiscount.toLocaleString("en-IN")}`}
                accent="text-emerald-400"
              />
            )}
            {(preview?.coinsDiscount ?? 0) > 0 && (
              <Row
                label="Coins discount"
                value={`-₹${preview!.coinsDiscount.toLocaleString("en-IN")}`}
                accent="text-[#FFA000]"
              />
            )}
            {displayCoinsSpent > 0 && (
              <div className="flex items-center justify-between text-[#FFA000]">
                <span>Coins spent</span>
                <span className="inline-flex items-center gap-1 font-bold">
                  <Image src={coinImg} alt="" width={14} height={14} />
                  {displayCoinsSpent.toLocaleString()}
                </span>
              </div>
            )}
            <div className="border-t border-white/10 pt-3">
              <Row
                label="Total payable"
                value={`₹${totalPayable.toLocaleString("en-IN")}`}
                bold
              />
            </div>
          </div>

          {error && (
            <p className="mt-3 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-300">
              {error}
            </p>
          )}
          {disabledReason && (
            <p className="mt-3 text-sm text-amber-300">{disabledReason}</p>
          )}
        </div>

        <div className="border-t border-white/10 p-5">
          <button
            type="button"
            onClick={onPay}
            disabled={loading || previewLoading || !!disabledReason || !!previewError || !preview}
            className="flex h-12 w-full items-center justify-center rounded-xl bg-gradient-to-r from-[var(--flame)] to-[var(--flame-deep)] text-sm font-extrabold uppercase tracking-wider text-black transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing…
              </>
            ) : (
              payLabel
            )}
          </button>
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
