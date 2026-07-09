"use client";

import React, { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Loader2,
  Minus,
  Plus,
  ShoppingBag,
  Trash2,
  AlertCircle,
} from "lucide-react";
import { buttonVariants } from "@/shared/components/ui/button";
import { shopApi, buildCheckoutRequest } from "@/features/shop/api";
import { useCheckout } from "@/features/shop/hooks/useCheckout";
import { useAuthStore, useUserSummary } from "@/features/auth";
import { shouldShowCoinEditor } from "@/features/shop/services/product.service";
import type { CartData, CartItem, CheckoutPreview } from "@/features/shop/types/shop.types";
import {
  parseCustomVoucherAmount,
  payButtonLabel,
  previewCheckoutWithHybridRetry,
  previewCoinCap,
  resolveAllowHybridInrPayment,
  resolveRuleCoinCap,
} from "@/features/shop/utils/checkout.utils";

function formatInr(amount: number) {
  return `₹${amount.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
}

export function CartShell() {
  const router = useRouter();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const { data: userSummary } = useUserSummary();
  const {
    handleCheckout,
    cancelPendingOrder,
    loading: checkoutLoading,
    error: checkoutError,
    pendingOrderId,
  } = useCheckout();
  const [cancellingOrder, setCancellingOrder] = useState(false);

  const [cart, setCart] = useState<CartData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<CheckoutPreview | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [applyCoins, setApplyCoins] = useState(true);
  const [customCoins, setCustomCoins] = useState<number | null>(null);
  const [updatingItemId, setUpdatingItemId] = useState<string | null>(null);

  const coinsBalance = userSummary?.arenaCoins ?? preview?.coinsBalance ?? 0;
  const primaryItem = cart?.items[0] ?? null;

  const loadCart = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await shopApi.getCart();
      setCart(data);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to load cart."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    loadCart();
  }, [isAuthenticated]);

  const localSubtotal = useMemo(() => {
    if (!primaryItem) return 0;
    const customAmount = parseCustomVoucherAmount(primaryItem.deliveryInfo);
    if (customAmount) return customAmount * primaryItem.quantity;
    return primaryItem.unitPrice * primaryItem.quantity;
  }, [primaryItem]);

  // Prefer preview.subtotal for coin caps — matches mobile _localSubtotal.
  const subtotal = preview?.subtotal ?? localSubtotal;

  const voucherFaceValue = useMemo(() => {
    if (!primaryItem) return null;
    const customAmount = parseCustomVoucherAmount(primaryItem.deliveryInfo);
    return customAmount != null && customAmount > 0 ? customAmount : null;
  }, [primaryItem]);

  const ruleCoinCap = useMemo(() => {
    return resolveRuleCoinCap({
      preview,
      paymentRules: preview?.paymentRules,
      sku: null,
      coinsBalance,
      voucherFaceValue,
    });
  }, [preview, coinsBalance, voucherFaceValue]);

  const optimalCoins = useMemo(() => {
    return previewCoinCap(coinsBalance, ruleCoinCap);
  }, [coinsBalance, ruleCoinCap]);

  const coinsToRedeem = useMemo(() => {
    if (!applyCoins) return 0;
    if (customCoins != null) return Math.min(customCoins, optimalCoins);
    return optimalCoins;
  }, [applyCoins, customCoins, optimalCoins]);

  const allowHybridInrPayment = useMemo(() => {
    return resolveAllowHybridInrPayment({
      coinsToRedeem,
      maxCoinsAllowed: ruleCoinCap,
      paymentRules: preview?.paymentRules,
    });
  }, [coinsToRedeem, ruleCoinCap, preview?.paymentRules]);

  useEffect(() => {
    if (!cart?.items.length || !isAuthenticated) {
      setPreview(null);
      return;
    }

    let cancelled = false;
    const timer = setTimeout(async () => {
      setPreviewLoading(true);
      setPreviewError(null);
      try {
        const request = buildCheckoutRequest({
          cartItemIds: null,
          coinsToRedeem,
          allowHybridInrPayment,
          quantity: primaryItem?.quantity ?? 1,
        });
        const nextPreview = await previewCheckoutWithHybridRetry(
          request,
          (req) => shopApi.checkoutPreview(req)
        );
        if (!cancelled) setPreview(nextPreview);
      } catch (err) {
        if (!cancelled) {
          setPreviewError(getErrorMessage(err, "Failed to load checkout preview."));
        }
      } finally {
        if (!cancelled) setPreviewLoading(false);
      }
    }, 400);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [cart?.items.length, coinsToRedeem, allowHybridInrPayment, isAuthenticated, primaryItem?.quantity]);

  const updateQuantity = async (item: CartItem, nextQty: number) => {
    if (nextQty < 1) return;
    setUpdatingItemId(item.id);
    try {
      await shopApi.updateCartItem(item.id, nextQty);
      await loadCart();
    } catch (err) {
      setError(getErrorMessage(err, "Failed to update quantity."));
    } finally {
      setUpdatingItemId(null);
    }
  };

  const removeItem = async (itemId: string) => {
    setUpdatingItemId(itemId);
    try {
      await shopApi.removeCartItem(itemId);
      await loadCart();
    } catch (err) {
      setError(getErrorMessage(err, "Failed to remove item."));
    } finally {
      setUpdatingItemId(null);
    }
  };

  const triggerCheckout = () => {
    if (checkoutLoading) return;
    if (!primaryItem || !cart) return;
    if (!isAuthenticated) {
      router.push("/login?returnUrl=/cart");
      return;
    }

    handleCheckout({
      isCartCheckout: true,
      cartItemIds: null,
      skuId: primaryItem.skuId,
      quantity: primaryItem.quantity,
      coinsToRedeem,
      allowHybridInrPayment,
      productName: primaryItem.productName,
      customVoucherAmount: parseCustomVoucherAmount(primaryItem.deliveryInfo),
      previewHint: preview,
    });
  };

  const handleCancelPendingOrder = async () => {
    if (!pendingOrderId || cancellingOrder) return;
    setCancellingOrder(true);
    try {
      await cancelPendingOrder(pendingOrderId);
      await loadCart();
    } catch (err) {
      setError(getErrorMessage(err, "Failed to cancel order."));
    } finally {
      setCancellingOrder(false);
    }
  };

  const awaitingRetry = Boolean(pendingOrderId);

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--void)] p-6 text-center">
        <ShoppingBag className="mb-4 h-12 w-12 text-[var(--flame)]" />
        <h1 className="font-heading text-2xl font-bold text-white">Sign in to view your cart</h1>
        <p className="mt-2 max-w-md text-sm text-[var(--faint)]">
          Your cart is saved to your account after login.
        </p>
        <Link
          href="/login?returnUrl=/cart"
          className={buttonVariants({
            className:
              "mt-8 bg-[var(--flame)] hover:bg-[var(--flame)]/90 text-white font-medium px-6 py-6 h-auto rounded-xl",
          })}
        >
          Sign In
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--void)] text-white">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--flame)]" />
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--void)] p-6 text-center">
        <div className="relative mb-6 flex h-20 w-20 items-center justify-center rounded-full border border-white/10 bg-white/5">
          <ShoppingBag className="h-10 w-10 text-[var(--flame)]" />
        </div>
        <h1 className="font-heading text-2xl font-bold tracking-tight text-white sm:text-3xl">
          Your Cart is Empty
        </h1>
        <p className="mt-2 max-w-md text-sm text-[var(--faint)]">
          Add a digital card from the shop to start checkout.
        </p>
        <Link
          href="/"
          className={buttonVariants({
            className:
              "mt-8 bg-[var(--flame)] hover:bg-[var(--flame)]/90 text-white font-medium px-6 py-6 h-auto rounded-xl flex items-center justify-center",
          })}
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Return to Shop
        </Link>
      </div>
    );
  }

  const totalPayable = preview?.totalPayable ?? subtotal;
  const showCoinEditor = preview?.paymentRules
    ? shouldShowCoinEditor({ paymentRules: preview.paymentRules })
    : true;

  return (
    <div className="min-h-screen bg-[var(--void)] px-4 py-8 text-white md:px-8">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="font-heading text-2xl font-black">Your Cart</h1>
            <p className="mt-1 text-sm text-[var(--muted)]">
              {cart.itemCount} item{cart.itemCount === 1 ? "" : "s"} ready for checkout
            </p>
          </div>
          <Link href="/" className="text-sm text-[var(--flame)] hover:underline">
            Continue shopping
          </Link>
        </div>

        {(error || checkoutError) && (
          <div className="mb-4 flex items-start gap-2 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{checkoutError ?? error}</span>
          </div>
        )}

        <div className="grid gap-5">
          {cart.items.map((item) => (
            <div
              key={item.id}
              className="rounded-2xl border border-white/10 bg-[#121212]/50 p-5 shadow-xl"
            >
              <div className="flex gap-4">
                {(item.productImageUrl || item.heroImageUrl) && (
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-white/10">
                    <Image
                      src={(item.productImageUrl || item.heroImageUrl)!}
                      alt={item.productName}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <h2 className="truncate text-lg font-bold">{item.productName}</h2>
                  <p className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
                    {item.skuLabel}
                  </p>
                  <p className="mt-2 text-sm font-bold text-white">
                    {formatInr(item.unitPrice)}
                    {parseCustomVoucherAmount(item.deliveryInfo)
                      ? ` · Face value ${formatInr(parseCustomVoucherAmount(item.deliveryInfo)!)}`
                      : ""}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => removeItem(item.id)}
                  disabled={updatingItemId === item.id}
                  className="rounded-lg border border-white/10 p-2 text-white/50 hover:bg-white/5 hover:text-white"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              {item.inStock === false && (
                <p className="mt-2 text-xs font-semibold text-amber-300">Out of stock</p>
              )}

              <div className="mt-4 flex items-center justify-between">
                <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/20 px-3 py-2">
                  <button
                    type="button"
                    onClick={() => updateQuantity(item, item.quantity - 1)}
                    disabled={item.quantity <= 1 || updatingItemId === item.id}
                    className="text-white/70 hover:text-white disabled:opacity-30"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="min-w-6 text-center text-sm font-bold">{item.quantity}</span>
                  <button
                    type="button"
                    onClick={() => updateQuantity(item, item.quantity + 1)}
                    disabled={updatingItemId === item.id}
                    className="text-white/70 hover:text-white"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
                <span className="text-sm font-bold">
                  Line total{" "}
                  {formatInr(item.lineTotal ?? item.unitPrice * item.quantity)}
                </span>
              </div>
            </div>
          ))}

          <div className="rounded-2xl border border-white/10 bg-[#121212]/50 p-5">
            <h3 className="mb-4 text-xs font-bold uppercase tracking-widest text-white/40">
              Payment Summary
            </h3>

            {previewLoading ? (
              <div className="flex items-center gap-2 text-sm text-[var(--muted)]">
                <Loader2 className="h-4 w-4 animate-spin" />
                Calculating totals…
              </div>
            ) : previewError ? (
              <p className="text-sm text-red-300">{previewError}</p>
            ) : preview ? (
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-white/60">Subtotal</span>
                  <span>{formatInr(preview.subtotal)}</span>
                </div>
                {preview.totalDiscount > 0 && (
                  <div className="flex justify-between text-emerald-400">
                    <span>Discount</span>
                    <span>-{formatInr(preview.totalDiscount)}</span>
                  </div>
                )}
                {preview.coinsDiscount > 0 && (
                  <div className="flex justify-between text-[#FFA000]">
                    <span>Coins discount</span>
                    <span>-{formatInr(preview.coinsDiscount)}</span>
                  </div>
                )}
                <div className="my-2 border-t border-white/10" />
                <div className="flex justify-between text-base font-black">
                  <span>Total payable</span>
                  <span>{formatInr(preview.totalPayable)}</span>
                </div>
              </div>
            ) : null}

            {showCoinEditor && (
              <div className="mt-5 rounded-xl border border-white/10 bg-black/20 p-4">
                <label className="flex items-center gap-2 text-sm font-semibold">
                  <input
                    type="checkbox"
                    checked={applyCoins}
                    onChange={(e) => setApplyCoins(e.target.checked)}
                    className="accent-[var(--flame)]"
                  />
                  Use Arena Coins ({coinsBalance.toLocaleString()} available)
                </label>
                {applyCoins && (
                  <input
                    type="number"
                    min={0}
                    max={optimalCoins}
                    value={customCoins ?? coinsToRedeem}
                    onChange={(e) => setCustomCoins(Number(e.target.value) || 0)}
                    className="mt-3 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none focus:border-[var(--flame)]"
                  />
                )}
              </div>
            )}

            {awaitingRetry && (preview?.coinsSpent ?? coinsToRedeem) > 0 && (
              <p className="mt-4 rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 text-sm text-amber-200">
                Arena Coins stay on this order until you complete payment or cancel.
              </p>
            )}

            <button
              type="button"
              onClick={triggerCheckout}
              disabled={
                checkoutLoading ||
                cancellingOrder ||
                (!awaitingRetry && (previewLoading || !!previewError))
              }
              className="mt-5 flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-[#ff973c] to-[#ff6a00] px-5 py-4 text-sm font-black text-black transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {checkoutLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing…
                </>
              ) : awaitingRetry ? (
                "Retry payment"
              ) : (
                payButtonLabel(totalPayable)
              )}
            </button>

            {awaitingRetry && (
              <button
                type="button"
                onClick={() => void handleCancelPendingOrder()}
                disabled={checkoutLoading || cancellingOrder}
                className="mt-3 w-full rounded-xl border border-white/15 py-3 text-xs font-bold uppercase tracking-wide text-white/70 transition hover:bg-white/5 disabled:opacity-50"
              >
                {cancellingOrder ? "Cancelling…" : "Cancel order"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function getErrorMessage(err: unknown, fallback: string): string {
  if (err && typeof err === "object") {
    const axiosErr = err as {
      response?: { data?: { message?: string } };
      message?: string;
    };
    return axiosErr.response?.data?.message ?? axiosErr.message ?? fallback;
  }
  if (err instanceof Error) return err.message;
  return fallback;
}
