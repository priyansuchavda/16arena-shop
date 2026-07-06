"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { CheckCircle2, Copy, Check, Loader2, Sparkles, Receipt, HelpCircle, FileText, ChevronRight, AlertCircle } from "lucide-react";
import { shopApi } from "@/features/shop";
import { ShopOrder } from "@/features/shop/types/shop.types";
import coinImg from "@/assets/png/coin.png";

export default function OrderSuccessPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;

  const [order, setOrder] = useState<ShopOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Status mapping logic
  const isOrderStatusPending = (status: string) => {
    const s = status.toLowerCase();
    return ["pending", "payment_initiated", "payment_success", "processing"].includes(s);
  };

  const orderStatusMessage = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending":
      case "payment_success":
        return "Delivering your voucher code...";
      case "payment_initiated":
        return "Authorizing payment transaction...";
      case "processing":
        return "Generating your digital cards...";
      case "fulfilled":
        return "Voucher delivered successfully!";
      case "failed":
      case "payment_failed":
        return "Fulfillment or payment failed.";
      default:
        return "Processing order...";
    }
  };

  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    const fetchOrder = async () => {
      try {
        const orderData = await shopApi.getOrder(orderId);
        if (orderData) {
          setOrder(orderData);
          setLoading(false);

          // If order is still in pending/processing, keep polling
          if (isOrderStatusPending(orderData.status)) {
            intervalId = setTimeout(fetchOrder, 3000);
          }
        } else {
          setError("Failed to locate order details.");
          setLoading(false);
        }
      } catch (err: any) {
        setError("Error loading order. Retrying...");
        setLoading(false);
        intervalId = setTimeout(fetchOrder, 3000);
      }
    };

    fetchOrder();

    return () => {
      if (intervalId) clearTimeout(intervalId);
    };
  }, [orderId]);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--void)] text-white p-6">
        <Loader2 className="w-8 h-8 text-[var(--flame)] animate-spin mb-4" />
        <p className="text-sm text-[var(--muted)]">Resolving transaction details...</p>
      </div>
    );
  }

  if (error && !order) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--void)] text-white p-6 text-center">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <h2 className="font-heading text-lg font-bold text-white mb-2">Order Not Found</h2>
        <p className="text-xs text-[var(--muted)] mb-6 max-w-sm">{error}</p>
        <Link href="/shop" className="px-5 py-2.5 bg-gradient-to-r from-[#ff973c] to-[#ff6a00] text-black text-xs font-bold rounded-xl">
          Return to Store
        </Link>
      </div>
    );
  }

  const status = order?.status.toLowerCase() || "";
  const isFulfilled = status === "fulfilled";
  const isPending = isOrderStatusPending(status);

  return (
    <div className="min-h-screen bg-[var(--void)] text-white pb-20 px-4 md:px-8 max-w-[580px] mx-auto pt-12">
      
      {/* Dynamic graphic glow */}
      <div className="pointer-events-none absolute left-1/2 -top-24 h-96 w-96 -translate-x-1/2 rounded-full opacity-15 blur-[120px]"
           style={{ background: isFulfilled ? "radial-gradient(circle, #2ec46e, transparent 75%)" : "radial-gradient(circle, #fe8321, transparent 75%)" }} />

      <div className="flex flex-col items-center text-center mb-8 relative z-10">
        <div className={`w-16 h-16 rounded-full flex items-center justify-center border mb-5 ${
          isFulfilled 
            ? "bg-[rgba(37,194,110,0.1)] border-[var(--win)]/30 text-[var(--win)] shadow-[0_0_20px_rgba(46,196,110,0.2)]" 
            : isPending
              ? "bg-[var(--flame)]/10 border-[var(--flame)]/30 text-[var(--flame)] animate-pulse"
              : "bg-red-500/10 border-red-500/30 text-red-400"
        }`}>
          {isFulfilled ? (
            <CheckCircle2 className="w-9 h-9" />
          ) : isPending ? (
            <Loader2 className="w-8 h-8 animate-spin" />
          ) : (
            <AlertCircle className="w-9 h-9" />
          )}
        </div>

        <h1 className="font-heading text-2xl font-black text-white">
          {isFulfilled ? "Fulfillment Complete!" : isPending ? "Fulfillment in Progress" : "Fulfillment Failed"}
        </h1>
        
        <p className="mt-2 text-sm text-[var(--muted)] font-semibold max-w-sm leading-relaxed">
          {orderStatusMessage(status)}
        </p>
      </div>

      {order && (
        <div className="flex flex-col gap-5 relative z-10">
          
          {/* Main items delivery card */}
          {order.items.map((item) => (
            <div key={item.id} className="border border-white/5 bg-[#121212]/40 rounded-2xl p-5 flex flex-col gap-4 shadow-xl">
              <div className="flex gap-4 items-center">
                {item.productImageUrl && (
                  <div className="relative w-14 h-14 rounded-xl overflow-hidden border border-white/10 shrink-0 bg-black/20">
                    <Image src={item.productImageUrl} alt="" fill className="object-cover" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-black text-white truncate leading-snug">{item.productName}</h3>
                  <p className="text-[10px] text-[var(--muted)] font-bold uppercase tracking-wider mt-0.5">{item.skuLabel}</p>
                </div>
              </div>

              {/* Vouchers lists */}
              {isFulfilled && item.vouchers && item.vouchers.length > 0 ? (
                <div className="flex flex-col gap-3 mt-1">
                  {item.vouchers.map((voucher, idx) => (
                    <div key={idx} className="flex flex-col gap-2.5 p-4 rounded-xl bg-black/35 border border-white/5">
                      
                      {/* Voucher Card Code */}
                      <div className="flex justify-between items-center gap-3">
                        <div className="flex flex-col">
                          <span className="text-[9px] font-bold text-white/30 uppercase tracking-wider">Voucher Code</span>
                          <span className="text-sm font-mono font-bold text-white mt-0.5 tracking-wide">{voucher.cardNumber}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleCopy(voucher.cardNumber, `${item.id}-code-${idx}`)}
                          className="p-2 bg-white/5 rounded-lg hover:bg-white/10 active:scale-95 transition border border-white/5"
                        >
                          {copiedId === `${item.id}-code-${idx}` ? (
                            <Check className="w-4 h-4 text-[var(--win)]" />
                          ) : (
                            <Copy className="w-4 h-4 text-white/50" />
                          )}
                        </button>
                      </div>

                      {/* Voucher PIN */}
                      {voucher.cardPin && (
                        <div className="flex justify-between items-center gap-3 pt-3 border-t border-white/5">
                          <div className="flex flex-col">
                            <span className="text-[9px] font-bold text-white/30 uppercase tracking-wider">PIN Code</span>
                            <span className="text-sm font-mono font-bold text-[#FFA000] mt-0.5 tracking-wide">{voucher.cardPin}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleCopy(voucher.cardPin!, `${item.id}-pin-${idx}`)}
                            className="p-2 bg-white/5 rounded-lg hover:bg-white/10 active:scale-95 transition border border-white/5"
                          >
                            {copiedId === `${item.id}-pin-${idx}` ? (
                              <Check className="w-4 h-4 text-[var(--win)]" />
                            ) : (
                              <Copy className="w-4 h-4 text-white/50" />
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : isPending ? (
                <div className="py-8 text-center flex flex-col items-center justify-center gap-3 border border-dashed border-white/10 rounded-xl bg-black/10">
                  <Loader2 className="w-6 h-6 text-[var(--flame)] animate-spin" />
                  <span className="text-xs text-[var(--muted)] font-semibold">Generating your unique codes...</span>
                </div>
              ) : (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-center flex flex-col items-center gap-2">
                  <AlertCircle className="w-8 h-8 text-red-400" />
                  <p className="text-xs text-red-300 font-semibold">
                    {item.fulfillmentMessage || "Fulfillment encountered an issue on order request."}
                  </p>
                </div>
              )}
            </div>
          ))}

          {/* Pricing detail breakdown */}
          <div className="border border-white/5 bg-[#121212]/30 rounded-2xl p-5 shadow-lg">
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-white/30 mb-3.5 flex items-center gap-2">
              <Receipt className="w-3.5 h-3.5" /> Order payment Details
            </h4>
            
            <div className="flex flex-col gap-2.5 text-xs">
              <div className="flex justify-between">
                <span className="text-white/50">Subtotal:</span>
                <span className="text-white font-semibold">₹{order.subtotal.toLocaleString()}</span>
              </div>
              
              {order.discountAmount > 0 && (
                <div className="flex justify-between text-[var(--win)]">
                  <span>Discount:</span>
                  <span className="font-semibold">-₹{order.discountAmount.toLocaleString()}</span>
                </div>
              )}

              {order.coinsSpent > 0 && (
                <div className="flex justify-between text-[#FFA000]">
                  <span>Coins Redeemed:</span>
                  <span className="font-bold flex items-center gap-1">
                    -{order.coinsSpent.toLocaleString()} Coins
                  </span>
                </div>
              )}

              <div className="border-t border-white/5 my-1.5" />

              <div className="flex justify-between items-center text-sm">
                <span className="text-white/50">Total Cash Paid:</span>
                <span className="text-white font-black">₹{order.totalPaid.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Core Support Accordions */}
          <div className="flex flex-col gap-2.5">
            <Link
              href="/orders"
              className="w-full flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/5 text-xs text-white/60 hover:text-white hover:bg-white/[0.04] transition"
            >
              <span className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-[var(--flame)]" />
                View Order History Vouchers
              </span>
              <ChevronRight className="w-4 h-4 text-white/40" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
