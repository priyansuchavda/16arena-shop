"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams } from "next/navigation";
import {
  CheckCircle2,
  Loader2,
  Receipt,
  FileText,
  ChevronRight,
  AlertCircle,
  Copy,
  Check,
  ShieldCheck,
  ShoppingBag,
  ArrowRight,
} from "lucide-react";
import { shopApi } from "@/features/shop";
import { ShopAccountShell } from "@/features/shop/components/shop-account-shell";
import { buildInvoicePageUrl } from "@/features/invoices/utils/invoice-url";
import { ShopOrder } from "@/features/shop/types/shop.types";
import {
  buildOrderItemCredentials,
} from "@/features/shop/utils/order-credentials";
import {
  isOrderStatusPending,
  isOrderStatusTerminal,
  orderStatusMessage,
  ORDER_POLL_INTERVAL_MS,
  ORDER_POLL_MAX_WAIT_MS,
} from "@/features/shop/utils/checkout.utils";
import { useNotificationStore } from "@/features/notifications/store";

export default function OrderSuccessPage() {
  const params = useParams();
  const orderId = params.id as string;

  const [order, setOrder] = useState<ShopOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  const showToast = useNotificationStore((state) => state.showToast);

  useEffect(() => {
    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    const startedAt = Date.now();
    const abortController = new AbortController();

    const fetchOrder = async () => {
      try {
        const orderData = await shopApi.getOrder(orderId, { signal: abortController.signal });
        if (cancelled) return;

        if (orderData) {
          setOrder(orderData);
          setError(null);

          const terminal = isOrderStatusTerminal(orderData.status);
          if (!terminal && Date.now() - startedAt < ORDER_POLL_MAX_WAIT_MS) {
            setLoading(true);
            timeoutId = setTimeout(fetchOrder, ORDER_POLL_INTERVAL_MS);
          } else {
            setLoading(false);
          }
        } else if (Date.now() - startedAt < ORDER_POLL_MAX_WAIT_MS) {
          timeoutId = setTimeout(fetchOrder, ORDER_POLL_INTERVAL_MS);
        } else {
          setError("Failed to locate order details.");
          setLoading(false);
        }
      } catch (err: unknown) {
        if (cancelled) return;

        // Skip handling for aborted/canceled requests
        if (err instanceof Error && (err.name === "CanceledError" || err.name === "AbortError")) {
          return;
        }

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
      abortController.abort();
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [orderId]);

  const handleCopy = (text: string, id: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    showToast({
      title: "Copied to Clipboard",
      body: `${label} has been copied successfully.`,
    });
    setTimeout(() => setCopiedId(null), 2000);
  };

  const status = order?.status.toLowerCase() || "";
  const isFulfilled = status === "fulfilled";
  const isPending = order ? isOrderStatusPending(status) : true;

  if (loading || (order && isPending)) {
    return (
      <ShopAccountShell hideSidebar>
        <div className="mx-auto max-w-[500px] w-full px-4 py-16 animate-in fade-in duration-300">
          <div className="flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-black py-24 text-center text-white shadow-xl">
            <Loader2 className="mb-4 h-10 w-10 animate-spin text-[var(--flame)]" />
            <h2 className="text-lg font-bold text-white mb-1">Generating Codes</h2>
            <p className="text-xs text-[var(--muted)] max-w-xs">
              {order ? orderStatusMessage(order.status) : "Confirming payment details…"}
            </p>
          </div>
        </div>
      </ShopAccountShell>
    );
  }

  if (error && !order) {
    return (
      <ShopAccountShell hideSidebar>
        <div className="mx-auto max-w-[500px] w-full px-4 py-16 animate-in fade-in duration-300">
          <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-white/10 bg-black px-6 py-16 text-center text-white shadow-xl">
            <AlertCircle className="h-12 w-12 text-red-500" />
            <h2 className="font-heading text-lg font-bold text-white">Order Not Found</h2>
            <p className="max-w-sm text-xs text-[var(--muted)]">{error}</p>
            <Link
              href="/shop"
              className="mt-2 rounded-xl bg-gradient-to-r from-[#ff973c] to-[#ff6a00] px-5 py-2.5 text-xs font-bold text-black hover:brightness-110 active:scale-95 transition"
            >
              Return to Store
            </Link>
          </div>
        </div>
      </ShopAccountShell>
    );
  }

  return (
    <ShopAccountShell hideSidebar>
      <div className="relative mx-auto w-full max-w-[1100px] text-white pb-20 pt-6 px-4 animate-in fade-in zoom-in-95 duration-300 ease-out fill-mode-both">
        {/* Glow backdrop centered on top header */}
        <div
          className="pointer-events-none absolute left-1/2 -top-24 h-96 w-96 -translate-x-1/2 rounded-full opacity-15 blur-[120px]"
          style={{
            background: isFulfilled
              ? "radial-gradient(circle, #2ec46e, transparent 75%)"
              : "radial-gradient(circle, #fe8321, transparent 75%)",
          }}
        />

        {/* Success Header Area */}
        <div className="relative z-10 mb-8 flex flex-col items-center text-center animate-in fade-in zoom-in duration-300">
          <div
            className={`mb-5 flex h-20 w-20 items-center justify-center rounded-full border-2 ${
              isFulfilled
                ? "border-[var(--win)]/30 bg-[rgba(37,194,110,0.1)] text-[var(--win)] shadow-[0_0_30px_rgba(46,196,110,0.25)]"
                : isPending
                  ? "animate-pulse border-[var(--flame)]/30 bg-[var(--flame)]/10 text-[var(--flame)]"
                  : "border-red-500/30 bg-red-500/10 text-red-400"
            }`}
          >
            {isFulfilled ? (
              <CheckCircle2 className="h-10 w-10 animate-in zoom-in-50 duration-300" />
            ) : isPending ? (
              <Loader2 className="h-8 w-8 animate-spin" />
            ) : (
              <AlertCircle className="h-10 w-10 animate-in zoom-in-50 duration-300" />
            )}
          </div>

          <h1 className="font-heading text-3xl font-black tracking-tight text-white md:text-4xl">
            {isFulfilled
              ? "Fulfillment Complete!"
              : isPending
                ? "Fulfillment in Progress"
                : "Fulfillment Failed"}
          </h1>

          <p className="mt-3 max-w-md text-sm text-[var(--muted)] font-semibold leading-relaxed">
            {isFulfilled
              ? "Your digital voucher has been generated successfully. You can redeem it immediately."
              : orderStatusMessage(status)}
          </p>
        </div>

        {order && (
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 items-start gap-8">
            {/* Left Column (Fulfillment & Voucher codes) */}
            <div className="lg:col-span-7 flex flex-col gap-6">
              {order.items.map((item) => {
                const fields = buildOrderItemCredentials(item);
                
                // Helper to normalise field key mapping
                const normalizeKey = (k: string) => k.toLowerCase().replace(/[^a-z0-9]/g, "");
                
                const voucherCodeField = fields.find(f => normalizeKey(f.key) === "code" || normalizeKey(f.key) === "vouchercode");
                const pinField = fields.find(f => normalizeKey(f.key) === "pin");
                const serialField = fields.find(f => normalizeKey(f.key) === "serial");
                const otherFields = fields.filter(f => ![voucherCodeField?.id, pinField?.id, serialField?.id].includes(f.id));

                return (
                  <div
                    key={item.id}
                    className="flex flex-col gap-6 rounded-2xl border border-white/10 bg-black p-6 shadow-xl hover:border-white/20 transition duration-300 relative overflow-hidden"
                  >
                    {/* Product Presentation Header */}
                    <div className="flex items-start gap-4">
                      {item.productImageUrl && (
                        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-black/40">
                          <Image src={item.productImageUrl} alt="" fill className="object-cover" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1 flex flex-col justify-between h-16 py-0.5">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[9px] font-black uppercase tracking-wider text-[var(--muted)]">
                            {item.skuLabel ? "Voucher" : "Game Key"}
                          </span>
                          <span className="text-[9px] font-black uppercase tracking-wider text-[var(--flame)] bg-[var(--flame)]/10 px-2.5 py-0.5 rounded">
                            Instant Delivery
                          </span>
                        </div>
                        <h3 className="truncate text-base font-black leading-tight text-white mt-1">
                          {item.productName}
                        </h3>
                        <p className="text-[10px] text-white/40 font-semibold mt-1">
                          Quantity: 1
                        </p>
                      </div>
                    </div>

                    {/* Vouchers and Codes Display */}
                    {isFulfilled ? (
                      fields.length > 0 ? (
                        <div className="flex flex-col gap-4 animate-in fade-in duration-300">
                          {/* Voucher Code (Hero Visual) */}
                          {voucherCodeField && (
                            <div className="relative rounded-xl border border-[var(--flame)]/40 bg-zinc-950 p-5 flex flex-col gap-2.5 group hover:border-[var(--flame)]/75 hover:shadow-[0_0_15px_rgba(255,106,0,0.05)] transition duration-300">
                              <div className="flex items-center justify-between">
                                <span className="text-[9px] font-bold uppercase tracking-widest text-[var(--flame)]">
                                  Voucher Code
                                </span>
                                <span className="text-[9px] font-medium text-white/20 select-none">
                                  Double-tap to select
                                </span>
                              </div>
                              
                              <div className="flex items-center justify-between gap-4 mt-0.5">
                                <div className="font-mono text-xl sm:text-2xl font-black tracking-wider text-white truncate selection:bg-[var(--flame)]/30">
                                  {voucherCodeField.value}
                                </div>
                                
                                <button
                                  onClick={() => handleCopy(voucherCodeField.value, voucherCodeField.id, "Voucher Code")}
                                  className="flex h-10 items-center gap-1.5 rounded-lg bg-[var(--flame)] px-4 text-xs font-black text-black transition hover:bg-[#ffaa55] active:scale-95 shrink-0 focus:outline-none focus:ring-2 focus:ring-[var(--flame)]/50"
                                >
                                  {copiedId === voucherCodeField.id ? (
                                    <>
                                      <Check className="h-3.5 w-3.5 stroke-[3px]" />
                                      <span>Copied</span>
                                    </>
                                  ) : (
                                    <>
                                      <Copy className="h-3.5 w-3.5" />
                                      <span>Copy</span>
                                    </>
                                  )}
                                </button>
                              </div>
                            </div>
                          )}

                          {/* PIN and Serial details */}
                          {(pinField || serialField) && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              {pinField && (
                                <div className="rounded-xl border border-white/5 bg-white/[0.01] p-4 flex flex-col gap-1.5 hover:border-white/10 transition">
                                  <span className="text-[9px] font-bold uppercase tracking-widest text-white/30">
                                    PIN
                                  </span>
                                  <div className="flex items-center justify-between gap-3">
                                    <span className="font-mono text-base font-black tracking-wider text-white select-all">
                                      {pinField.value}
                                    </span>
                                    <button
                                      onClick={() => handleCopy(pinField.value, pinField.id, "PIN")}
                                      className="rounded-lg p-2 text-white/40 hover:bg-white/5 hover:text-white transition focus:outline-none focus:ring-1 focus:ring-white/20"
                                    >
                                      {copiedId === pinField.id ? (
                                        <Check className="h-3.5 w-3.5 text-emerald-400 stroke-[3px]" />
                                      ) : (
                                        <Copy className="h-3.5 w-3.5" />
                                      )}
                                    </button>
                                  </div>
                                </div>
                              )}

                              {serialField && (
                                <div className="rounded-xl border border-white/5 bg-white/[0.01] p-4 flex flex-col gap-1.5 hover:border-white/10 transition">
                                  <span className="text-[9px] font-bold uppercase tracking-widest text-white/30">
                                    Serial Number
                                  </span>
                                  <div className="flex items-center justify-between gap-3">
                                    <span className="font-mono text-base font-black tracking-wider text-white/70 select-all truncate">
                                      {serialField.value}
                                    </span>
                                    <button
                                      onClick={() => handleCopy(serialField.value, serialField.id, "Serial Number")}
                                      className="rounded-lg p-2 text-white/40 hover:bg-white/5 hover:text-white transition focus:outline-none focus:ring-1 focus:ring-white/20"
                                    >
                                      {copiedId === serialField.id ? (
                                        <Check className="h-3.5 w-3.5 text-emerald-400 stroke-[3px]" />
                                      ) : (
                                        <Copy className="h-3.5 w-3.5" />
                                      )}
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Remaining Credentials Fields */}
                          {otherFields.map(f => (
                            <div key={f.id} className="rounded-xl border border-white/5 bg-white/[0.01] p-4 flex items-center justify-between gap-4 hover:border-white/10 transition">
                              <div className="flex flex-col gap-0.5">
                                <span className="text-[9px] font-bold uppercase tracking-widest text-white/30">
                                  {f.label}
                                </span>
                                <span className="font-mono text-sm font-semibold text-white/80 select-all">
                                  {f.value}
                                </span>
                              </div>
                              <button
                                onClick={() => handleCopy(f.value, f.id, f.label)}
                                className="rounded-lg p-2 text-white/40 hover:bg-white/5 hover:text-white transition focus:outline-none focus:ring-1 focus:ring-white/20"
                              >
                                {copiedId === f.id ? (
                                  <Check className="h-3.5 w-3.5 text-emerald-400 stroke-[3px]" />
                                ) : (
                                  <Copy className="h-3.5 w-3.5" />
                                )}
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-center">
                          <CheckCircle2 className="h-8 w-8 text-emerald-400" />
                          <p className="text-xs font-semibold text-emerald-300">
                            {item.fulfillmentMessage || "Delivered successfully."}
                          </p>
                        </div>
                      )
                    ) : isPending ? (
                      <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-white/10 bg-black/10 py-8 text-center">
                        <Loader2 className="h-6 w-6 animate-spin text-[var(--flame)]" />
                        <span className="text-xs font-semibold text-[var(--muted)]">
                          Generating your unique codes…
                        </span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-center">
                        <AlertCircle className="h-8 w-8 text-red-400" />
                        <p className="text-xs font-semibold text-red-300">
                          {item.fulfillmentMessage || "Fulfillment encountered an issue."}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Right Column (Payment Details, Trust, and Next Actions) */}
            <div className="lg:col-span-5 flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
              {/* Payment Summary Box */}
              <div className="rounded-2xl border border-white/5 bg-black p-6 shadow-xl flex flex-col gap-4">
                <h4 className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-white/30">
                  <Receipt className="h-3.5 w-3.5" /> Order payment details
                </h4>

                <div className="flex flex-col gap-3 text-xs">
                  <div className="flex justify-between">
                    <span className="text-white/50">Subtotal</span>
                    <span className="font-semibold text-white">
                      ₹{order.subtotal.toLocaleString("en-IN")}
                    </span>
                  </div>

                  {order.discountAmount > 0 && (
                    <div className="flex justify-between text-emerald-400">
                      <span>Coupon Discount</span>
                      <span className="font-semibold">-₹{order.discountAmount.toLocaleString("en-IN")}</span>
                    </div>
                  )}

                  {order.coinsSpent > 0 && (
                    <div className="flex justify-between text-amber-500">
                      <span>Coins redeemed</span>
                      <span className="font-bold">-{order.coinsSpent.toLocaleString()} coins</span>
                    </div>
                  )}

                  <div className="flex justify-between">
                    <span className="text-white/50">Estimated Tax</span>
                    <span className="font-semibold text-white/40">₹0 (Included)</span>
                  </div>

                  <div className="my-1.5 border-t border-white/[0.08]" />

                  <div className="flex items-center justify-between text-sm pt-0.5">
                    <span className="text-white/60 font-semibold">Total Paid</span>
                    <span className="font-black text-white text-xl">₹{order.totalPaid.toLocaleString("en-IN")}</span>
                  </div>
                </div>
              </div>


              {/* Navigation Action Buttons (Primary & Secondary) */}
              <div className="flex flex-col gap-3">
                {/* Primary CTA (Return to Store) */}
                <Link
                  href="/shop"
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#ff973c] to-[#ff6a00] p-4 text-sm font-black text-black shadow-lg hover:brightness-110 active:scale-[0.99] transition duration-200 focus:outline-none focus:ring-2 focus:ring-[var(--flame)]/50"
                >
                  <ShoppingBag className="w-4 h-4 stroke-[2.5px]" />
                  <span>Continue Shopping</span>
                  <ArrowRight className="w-4 h-4 ml-0.5 stroke-[2.5px]" />
                </Link>

                {/* Secondary navigation actions list */}
                <div className="flex flex-col gap-2">
                  <Link
                    href={buildInvoicePageUrl(order.id, { chrome: true })}
                    className="flex w-full items-center justify-between rounded-xl border border-white/5 bg-black p-4 text-xs text-white/60 transition hover:bg-white/[0.02] hover:text-white focus:outline-none focus:ring-1 focus:ring-white/20"
                  >
                    <span className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-[var(--flame)]" />
                      View Invoice
                    </span>
                    <ChevronRight className="h-4 w-4 text-white/40" />
                  </Link>
                  <Link
                    href={`/orders/${order.id}`}
                    className="flex w-full items-center justify-between rounded-xl border border-white/5 bg-black p-4 text-xs text-white/60 transition hover:bg-white/[0.02] hover:text-white focus:outline-none focus:ring-1 focus:ring-white/20"
                  >
                    <span className="flex items-center gap-2">
                      <Receipt className="h-4 w-4 text-[var(--flame)]" />
                      View full order details
                    </span>
                    <ChevronRight className="h-4 w-4 text-white/40" />
                  </Link>
                  <Link
                    href="/orders"
                    className="flex w-full items-center justify-between rounded-xl border border-white/5 bg-black p-4 text-xs text-white/60 transition hover:bg-white/[0.02] hover:text-white focus:outline-none focus:ring-1 focus:ring-white/20"
                  >
                    <span className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-[var(--flame)]" />
                      Order history
                    </span>
                    <ChevronRight className="h-4 w-4 text-white/40" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </ShopAccountShell>
  );
}
