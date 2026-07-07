"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams } from "next/navigation";
import {
  CheckCircle2,
  Copy,
  Check,
  Loader2,
  Receipt,
  FileText,
  ChevronRight,
  AlertCircle,
} from "lucide-react";
import { shopApi } from "@/features/shop";
import { buildInvoicePageUrl } from "@/features/invoices/utils/invoice-url";
import { ShopOrder } from "@/features/shop/types/shop.types";
import {
  isOrderStatusPending,
  isOrderStatusTerminal,
  orderStatusMessage,
  ORDER_POLL_INTERVAL_MS,
  ORDER_POLL_MAX_WAIT_MS,
} from "@/features/shop/utils/checkout.utils";

export default function OrderSuccessPage() {
  const params = useParams();
  const orderId = params.id as string;

  const [order, setOrder] = useState<ShopOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    const startedAt = Date.now();

    const fetchOrder = async () => {
      try {
        const orderData = await shopApi.getOrder(orderId);
        if (cancelled) return;

        if (orderData) {
          setOrder(orderData);
          setLoading(false);
          setError(null);

          if (
            !isOrderStatusTerminal(orderData.status) &&
            Date.now() - startedAt < ORDER_POLL_MAX_WAIT_MS
          ) {
            timeoutId = setTimeout(fetchOrder, ORDER_POLL_INTERVAL_MS);
          }
        } else if (Date.now() - startedAt < ORDER_POLL_MAX_WAIT_MS) {
          timeoutId = setTimeout(fetchOrder, ORDER_POLL_INTERVAL_MS);
        } else {
          setError("Failed to locate order details.");
          setLoading(false);
        }
      } catch {
        if (cancelled) return;
        if (Date.now() - startedAt < ORDER_POLL_MAX_WAIT_MS) {
          timeoutId = setTimeout(fetchOrder, ORDER_POLL_INTERVAL_MS);
        } else {
          setError("Error loading order.");
          setLoading(false);
        }
      }
    };

    fetchOrder();

    return () => {
      cancelled = true;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [orderId]);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--void)] p-6 text-white">
        <Loader2 className="mb-4 h-8 w-8 animate-spin text-[var(--flame)]" />
        <p className="text-sm text-[var(--muted)]">Confirming your order…</p>
      </div>
    );
  }

  if (error && !order) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--void)] p-6 text-center text-white">
        <AlertCircle className="mb-4 h-12 w-12 text-red-500" />
        <h2 className="mb-2 font-heading text-lg font-bold text-white">Order Not Found</h2>
        <p className="mb-6 max-w-sm text-xs text-[var(--muted)]">{error}</p>
        <Link
          href="/shop"
          className="rounded-xl bg-gradient-to-r from-[#ff973c] to-[#ff6a00] px-5 py-2.5 text-xs font-bold text-black"
        >
          Return to Store
        </Link>
      </div>
    );
  }

  const status = order?.status.toLowerCase() || "";
  const isFulfilled = status === "fulfilled";
  const isPending = isOrderStatusPending(status);

  return (
    <div className="relative mx-auto min-h-screen max-w-[580px] bg-[var(--void)] px-4 pb-20 pt-12 text-white md:px-8">
      <div
        className="pointer-events-none absolute left-1/2 -top-24 h-96 w-96 -translate-x-1/2 rounded-full opacity-15 blur-[120px]"
        style={{
          background: isFulfilled
            ? "radial-gradient(circle, #2ec46e, transparent 75%)"
            : "radial-gradient(circle, #fe8321, transparent 75%)",
        }}
      />

      <div className="relative z-10 mb-8 flex flex-col items-center text-center">
        <div
          className={`mb-5 flex h-16 w-16 items-center justify-center rounded-full border ${
            isFulfilled
              ? "border-[var(--win)]/30 bg-[rgba(37,194,110,0.1)] text-[var(--win)] shadow-[0_0_20px_rgba(46,196,110,0.2)]"
              : isPending
                ? "animate-pulse border-[var(--flame)]/30 bg-[var(--flame)]/10 text-[var(--flame)]"
                : "border-red-500/30 bg-red-500/10 text-red-400"
          }`}
        >
          {isFulfilled ? (
            <CheckCircle2 className="h-9 w-9" />
          ) : isPending ? (
            <Loader2 className="h-8 w-8 animate-spin" />
          ) : (
            <AlertCircle className="h-9 w-9" />
          )}
        </div>

        <h1 className="font-heading text-2xl font-black text-white">
          {isFulfilled
            ? "Fulfillment Complete!"
            : isPending
              ? "Fulfillment in Progress"
              : "Fulfillment Failed"}
        </h1>

        <p className="mt-2 max-w-sm text-sm font-semibold leading-relaxed text-[var(--muted)]">
          {orderStatusMessage(status)}
        </p>
      </div>

      {order && (
        <div className="relative z-10 flex flex-col gap-5">
          {order.items.map((item) => (
            <div
              key={item.id}
              className="flex flex-col gap-4 rounded-2xl border border-white/5 bg-[#121212]/40 p-5 shadow-xl"
            >
              <div className="flex items-center gap-4">
                {item.productImageUrl && (
                  <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-black/20">
                    <Image src={item.productImageUrl} alt="" fill className="object-cover" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-base font-black leading-snug text-white">
                    {item.productName}
                  </h3>
                  <p className="mt-0.5 text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">
                    {item.skuLabel}
                  </p>
                </div>
              </div>

              {isFulfilled && item.vouchers && item.vouchers.length > 0 ? (
                <div className="mt-1 flex flex-col gap-3">
                  {item.vouchers.map((voucher, idx) => (
                    <div
                      key={idx}
                      className="flex flex-col gap-2.5 rounded-xl border border-white/5 bg-black/35 p-4"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex flex-col">
                          <span className="text-[9px] font-bold uppercase tracking-wider text-white/30">
                            Voucher Code
                          </span>
                          <span className="mt-0.5 font-mono text-sm font-bold tracking-wide text-white">
                            {voucher.cardNumber}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleCopy(voucher.cardNumber, `${item.id}-code-${idx}`)}
                          className="rounded-lg border border-white/5 bg-white/5 p-2 transition hover:bg-white/10 active:scale-95"
                        >
                          {copiedId === `${item.id}-code-${idx}` ? (
                            <Check className="h-4 w-4 text-[var(--win)]" />
                          ) : (
                            <Copy className="h-4 w-4 text-white/50" />
                          )}
                        </button>
                      </div>

                      {voucher.cardPin && (
                        <div className="flex items-center justify-between gap-3 border-t border-white/5 pt-3">
                          <div className="flex flex-col">
                            <span className="text-[9px] font-bold uppercase tracking-wider text-white/30">
                              PIN Code
                            </span>
                            <span className="mt-0.5 font-mono text-sm font-bold tracking-wide text-[#FFA000]">
                              {voucher.cardPin}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleCopy(voucher.cardPin!, `${item.id}-pin-${idx}`)}
                            className="rounded-lg border border-white/5 bg-white/5 p-2 transition hover:bg-white/10 active:scale-95"
                          >
                            {copiedId === `${item.id}-pin-${idx}` ? (
                              <Check className="h-4 w-4 text-[var(--win)]" />
                            ) : (
                              <Copy className="h-4 w-4 text-white/50" />
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : isPending ? (
                <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-white/10 bg-black/10 py-8 text-center">
                  <Loader2 className="h-6 w-6 animate-spin text-[var(--flame)]" />
                  <span className="text-xs font-semibold text-[var(--muted)]">
                    Generating your unique codes…
                  </span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-center">
                  <AlertCircle className="h-8 w-8 text-red-400" />
                  <p className="text-xs font-semibold text-red-300">
                    {item.fulfillmentMessage || "Fulfillment encountered an issue."}
                  </p>
                </div>
              )}
            </div>
          ))}

          <div className="rounded-2xl border border-white/5 bg-[#121212]/30 p-5 shadow-lg">
            <h4 className="mb-3.5 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-white/30">
              <Receipt className="h-3.5 w-3.5" /> Order payment details
            </h4>

            <div className="flex flex-col gap-2.5 text-xs">
              <div className="flex justify-between">
                <span className="text-white/50">Subtotal:</span>
                <span className="font-semibold text-white">
                  ₹{order.subtotal.toLocaleString()}
                </span>
              </div>

              {order.discountAmount > 0 && (
                <div className="flex justify-between text-[var(--win)]">
                  <span>Discount:</span>
                  <span className="font-semibold">-₹{order.discountAmount.toLocaleString()}</span>
                </div>
              )}

              {order.coinsSpent > 0 && (
                <div className="flex justify-between text-[#FFA000]">
                  <span>Coins redeemed:</span>
                  <span className="font-bold">-{order.coinsSpent.toLocaleString()} coins</span>
                </div>
              )}

              <div className="my-1.5 border-t border-white/5" />

              <div className="flex items-center justify-between text-sm">
                <span className="text-white/50">Total cash paid:</span>
                <span className="font-black text-white">₹{order.totalPaid.toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2.5">
            <Link
              href={buildInvoicePageUrl(order.id, { chrome: true })}
              className="flex w-full items-center justify-between rounded-xl border border-white/5 bg-white/[0.02] p-4 text-xs text-white/60 transition hover:bg-white/[0.04] hover:text-white"
            >
              <span className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-[var(--flame)]" />
                View Invoice
              </span>
              <ChevronRight className="h-4 w-4 text-white/40" />
            </Link>
            <Link
              href={`/orders/${order.id}`}
              className="flex w-full items-center justify-between rounded-xl border border-white/5 bg-white/[0.02] p-4 text-xs text-white/60 transition hover:bg-white/[0.04] hover:text-white"
            >
              <span className="flex items-center gap-2">
                <Receipt className="h-4 w-4 text-[var(--flame)]" />
                View full order details
              </span>
              <ChevronRight className="h-4 w-4 text-white/40" />
            </Link>
            <Link
              href="/orders"
              className="flex w-full items-center justify-between rounded-xl border border-white/5 bg-white/[0.02] p-4 text-xs text-white/60 transition hover:bg-white/[0.04] hover:text-white"
            >
              <span className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-[var(--flame)]" />
                Order history
              </span>
              <ChevronRight className="h-4 w-4 text-white/40" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
