"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { buildInvoicePageUrl } from "@/features/invoices/utils/invoice-url";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  Check,
  Eye,
  EyeOff,
  Loader2,
  MessageSquare,
  ChevronRight,
} from "lucide-react";
import { shopApi } from "@/features/shop";
import { ShopAccountShell } from "@/features/shop/components/shop-account-shell";
import { BrandPremiumVoucherCard } from "@/features/shop/components/brand-premium-voucher-card";
import { ShopOrder, ShopOrderItem } from "@/features/shop/types/shop.types";
import {
  canCompleteOrCancelPayment,
  isOrderStatusTerminal,
  ORDER_POLL_INTERVAL_MS,
} from "@/features/shop/utils/checkout.utils";
import {
  PAYMENT_CANCELLED_MESSAGE,
  // initiateAndOpenEasebuzz,
  isPaymentCancelledError,
} from "@/features/shop/utils/easebuzz-checkout";
import { PaymentComingSoonSheet } from "@/features/shop/components/payment-coming-soon-sheet";
import { useAuthStore } from "@/features/auth";
import { getApiErrorMessage } from "@/features/shop/services/shop-api-client";
import coinImg from "@/assets/png/coin.png";
import invoiceIcon from "@/assets/svg/invoice.svg";
import copyIcon from "@/assets/svg/copy.svg";

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatDate(isoString: string) {
  try {
    const date = new Date(isoString);
    const datePart = date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    const timePart = date
      .toLocaleTimeString("en-IN", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      })
      .toLowerCase();
    return `${datePart} - ${timePart}`;
  } catch {
    return isoString;
  }
}

function formatInr(amount: number) {
  return `₹${amount.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

function resolveItemFaceValue(item: ShopOrderItem): number {
  const qty = item.quantity ?? 1;
  if (item.faceValue && item.faceValue > 0) {
    return item.faceValue * qty;
  }
  const parsed = item.skuLabel?.replace(/[₹,\s]/g, "");
  const fromLabel = parsed ? parseFloat(parsed) : NaN;
  if (!Number.isNaN(fromLabel) && fromLabel > 0) {
    return fromLabel * qty;
  }
  return item.unitPrice * qty;
}

function resolveBrandCardWorth(items: ShopOrderItem[]): number {
  return items.reduce((sum, item) => sum + resolveItemFaceValue(item), 0);
}

function maskValue(value: string) {
  return value.replace(/[^\s\-]/g, "*");
}

// ─── Section card ───────────────────────────────────────────────────────────

function SectionCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.06] font-heading shadow-lg">
      {children}
    </div>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <div className="px-5 pt-5 pb-0">
      <p className="text-sm font-bold tracking-wide text-white">{title}</p>
      <div className="mt-4 h-px bg-white/[0.06]" />
    </div>
  );
}

// ─── Copy button ─────────────────────────────────────────────────────────────

function CopyButton({ text, id, copiedId, onCopy }: { text: string; id: string; copiedId: string | null; onCopy: (text: string, id: string) => void }) {
  const copied = copiedId === id;
  return (
    <button
      type="button"
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); onCopy(text, id); }}
      className="shrink-0 transition hover:opacity-80 active:scale-95 focus:outline-none"
      style={{ outline: "none", boxShadow: "none" }}
    >
      {copied ? (
        <Check className="h-3.5 w-3.5 text-emerald-400" />
      ) : (
        <Image src={copyIcon} alt="" width={14} height={15} className="object-contain opacity-70" />
      )}
    </button>
  );
}

// ─── Credential row ──────────────────────────────────────────────────────────

type CredField = { label: string; value: string; sensitive: boolean };

function CredentialRow({
  index, field, revealed, onToggleReveal, copiedId, onCopy,
}: {
  index: number;
  field: CredField;
  revealed: boolean;
  onToggleReveal: (i: number) => void;
  copiedId: string | null;
  onCopy: (text: string, id: string) => void;
}) {
  const hidden = field.sensitive && !revealed;
  const display = hidden ? maskValue(field.value) : field.value;

  return (
    <div className="flex items-center gap-3 px-5 py-4">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold leading-snug text-white">{field.label}</p>
        <p
          className={`mt-1.5 truncate text-[13px] font-medium transition-all duration-200 ${
            hidden ? "font-mono tracking-widest text-white/35" : "text-[#BABABA]"
          }`}
        >
          {display}
        </p>
      </div>
      {field.sensitive && (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onToggleReveal(index);
          }}
          className="shrink-0 transition hover:opacity-80 active:scale-95 focus:outline-none"
          style={{ outline: "none", boxShadow: "none" }}
          aria-label={revealed ? "Hide value" : "Show value"}
        >
          {revealed ? (
            <EyeOff className="h-3.5 w-3.5 text-white opacity-70" />
          ) : (
            <Eye className="h-3.5 w-3.5 text-white opacity-70" />
          )}
        </button>
      )}
      {field.sensitive && (
        <CopyButton text={field.value} id={`cred-${index}`} copiedId={copiedId} onCopy={onCopy} />
      )}
    </div>
  );
}

// ─── Bill row ─────────────────────────────────────────────────────────────────

function BillRow({ label, value, bold = false, valueColor }: { label: string; value: string; bold?: boolean; valueColor?: string }) {
  return (
    <div className="flex items-start justify-between gap-4 px-5 py-2">
      <p className={`text-[13px] leading-snug ${bold ? "font-semibold text-white" : "font-medium text-white/80"}`}>{label}</p>
      <p className={`text-[13px] shrink-0 ${valueColor ?? "text-white"} ${bold ? "font-semibold" : "font-medium"}`}>{value}</p>
    </div>
  );
}

// ─── Copy field ───────────────────────────────────────────────────────────────

function CopyField({ label, value, id, showCopy = true, copiedId, onCopy }: {
  label: string; value: string; id: string; showCopy?: boolean; copiedId: string | null; onCopy: (text: string, id: string) => void;
}) {
  return (
    <div className="px-5 py-4 flex items-start gap-3">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-white">{label}</p>
        <p className="mt-1 truncate text-[12px] font-medium text-[#BABABA]">{value}</p>
      </div>
      {showCopy && <CopyButton text={value} id={id} copiedId={copiedId} onCopy={onCopy} />}
    </div>
  );
}

// ─── Action row ───────────────────────────────────────────────────────────────

function ActionRow({ icon, label, href, onClick }: {
  icon: React.ReactNode;
  label: string;
  href?: string;
  onClick?: () => void;
}) {
  const inner = (
    <div className="flex cursor-pointer items-center gap-3.5 px-5 py-4 transition hover:bg-white/[0.03] active:bg-white/[0.06]">
      <span className="flex h-[18px] w-[18px] shrink-0 items-center justify-center">{icon}</span>
      <span className="flex-1 text-sm font-medium text-white">{label}</span>
      <ChevronRight className="w-4 h-4 text-white/20" />
    </div>
  );
  if (href) return <Link href={href}>{inner}</Link>;
  return <div onClick={onClick}>{inner}</div>;
}

// ─── Credential fields builder ────────────────────────────────────────────────

function SectionDivider() {
  return <div className="h-px bg-white/[0.06]" />;
}

function buildCredentialFields(items: ShopOrderItem[]): CredField[] {
  const fields: CredField[] = [];
  const isSensitive = (label: string) => {
    const l = label.toLowerCase();
    return !(l.includes("valid") || l.includes("expiry") || l.includes("date"));
  };

  for (const item of items) {
    if (item.vouchers && item.vouchers.length > 0) {
      for (const v of item.vouchers) {
        if (v.cardNumber) fields.push({ label: "Card Number", value: v.cardNumber, sensitive: true });
        if (v.cardPin) fields.push({ label: "Card Code", value: v.cardPin, sensitive: true });
        if (v.validTill) fields.push({ label: "Validity", value: v.validTill, sensitive: false });
      }
    } else if (item.voucherDetails && item.voucherDetails.length > 0) {
      for (const f of item.voucherDetails) {
        fields.push({ label: f.label, value: f.value, sensitive: isSensitive(f.label) });
      }
    } else if (item.voucherCode) {
      fields.push({ label: "Card Number", value: item.voucherCode, sensitive: true });
    }
  }
  return fields;
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function OrderDetailShell({ orderId }: { orderId: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const [order, setOrder] = useState<ShopOrder | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [revealedIndexes, setRevealedIndexes] = useState<Set<number>>(new Set());
  const [actionLoading, setActionLoading] = useState<"pay" | "cancel" | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionInfo, setActionInfo] = useState<string | null>(null);
  const [paymentComingSoonOpen, setPaymentComingSoonOpen] = useState(false);
  const pollRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadOrder = useCallback(async (showSpinner = true) => {
    if (showSpinner) setIsLoading(true);
    try {
      const o = await shopApi.getOrder(orderId);
      setOrder(o);
      return o;
    } finally {
      if (showSpinner) setIsLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadOrder();
  }, [loadOrder]);

  useEffect(() => {
    if (!order || isOrderStatusTerminal(order.status)) return;
    if (
      !canCompleteOrCancelPayment(order.status) &&
      order.status.toLowerCase() !== "payment_success"
    ) {
      return;
    }

    const tick = async () => {
      const next = await shopApi.getOrder(orderId);
      if (next) setOrder(next);
      if (next && !isOrderStatusTerminal(next.status)) {
        pollRef.current = setTimeout(() => void tick(), ORDER_POLL_INTERVAL_MS);
      }
    };

    pollRef.current = setTimeout(() => void tick(), ORDER_POLL_INTERVAL_MS);
    return () => {
      if (pollRef.current) clearTimeout(pollRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [order?.status, orderId]);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const toggleReveal = (index: number) => {
    setRevealedIndexes((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const handleCompletePayment = async () => {
    if (!order || actionLoading) return;
    setPaymentComingSoonOpen(true);
    return;

    // setActionLoading("pay");
    // setActionError(null);
    // setActionInfo(null);
    // try {
    //   const productName =
    //     order.items[0]?.productName ?? order.items[0]?.brandName ?? "Order";
    //   await initiateAndOpenEasebuzz({
    //     orderId: order.id,
    //     productName,
    //     contact: user?.phoneNumber ?? "",
    //     email: user?.email ?? "",
    //   });
    //   router.push(`/orders/${order.id}`);
    // } catch (err) {
    //   const errorMsg = getApiErrorMessage(err, "");
    //   if (errorMsg.includes("Name, email, and phone are required on your profile before paying online.")) {
    //     useAuthStore.getState().openRegisterModal(window.location.pathname + window.location.search, errorMsg);
    //     return;
    //   }
    //   if (isPaymentCancelledError(err)) {
    //     setActionInfo(PAYMENT_CANCELLED_MESSAGE);
    //   } else {
    //     setActionError(
    //       getApiErrorMessage(err, "Payment could not be completed. Please try again.")
    //     );
    //   }
    //   await loadOrder(false);
    // } finally {
    //   setActionLoading(null);
    // }
  };

  const handleCancelOrder = async () => {
    if (!order || actionLoading) return;
    setActionLoading("cancel");
    setActionError(null);
    setActionInfo(null);
    try {
      await shopApi.cancelOrder(order.id);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["auth", "userSummary"] }),
        queryClient.invalidateQueries({ queryKey: ["shop", "orders"] }),
      ]);
      router.push("/orders");
    } catch (err) {
      setActionError(getApiErrorMessage(err, "Failed to cancel order."));
      setActionLoading(null);
      await loadOrder(false);
    }
  };

  // ─── Loading ─────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <ShopAccountShell hideSidebar>
        <div className="mx-auto w-full max-w-[1100px]">
          <h1 className="font-heading mb-6 text-2xl font-black text-white">Order Details</h1>
          <div className="mx-auto max-w-[500px] w-full">
            <div className="flex flex-col items-center justify-center rounded-2xl border border-[var(--line)] bg-[var(--surface)] py-24">
              <Loader2 className="mb-4 h-8 w-8 animate-spin text-[var(--flame)]" />
              <p className="text-sm text-[var(--muted)]">Loading order details…</p>
            </div>
          </div>
        </div>
      </ShopAccountShell>
    );
  }

  if (!order) {
    return (
      <ShopAccountShell hideSidebar>
        <div className="mx-auto w-full max-w-[1100px]">
          <h1 className="font-heading mb-6 text-2xl font-black text-white">Order Details</h1>
          <div className="mx-auto max-w-[500px] w-full">
            <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-[var(--line)] bg-[var(--surface)] px-6 py-16 text-center">
              <AlertCircle className="h-12 w-12 text-red-500" />
              <p className="text-sm text-white/60">Failed to load order details.</p>
              <button
                onClick={() => router.back()}
                className="rounded-xl border border-[var(--flame)]/30 px-5 py-2.5 text-xs font-bold text-[var(--flame)] transition hover:bg-[var(--flame)]/10"
              >
                Go Back
              </button>
            </div>
          </div>
        </div>
      </ShopAccountShell>
    );
  }

  // ─── Build credential rows ────────────────────────────────────────────────

  const credFields = buildCredentialFields(order.items);
  const needsPayment = canCompleteOrCancelPayment(order.status);
  const isPending = ["pending", "processing", "payment_initiated", "payment_success"].includes(order.status.toLowerCase());
  const hasDeliveredVouchers = order.items.some((item) =>
    (item.vouchers && item.vouchers.length > 0) || item.voucherCode || (item.voucherDetails && item.voucherDetails.length > 0)
  );

  const transactionId = order.orderNumber || order.id;
  const savingsPercent =
    order.subtotal > 0 && order.coinsDiscount > 0
      ? Math.round((order.coinsDiscount / order.subtotal) * 100)
      : null;
  const cashPaid =
    order.totalPaid > 0
      ? order.totalPaid
      : Math.max(0, order.subtotal - order.coinsDiscount - order.discountAmount);

  const primaryItem = order.items[0];
  const brandName = primaryItem?.brandName ?? primaryItem?.productName ?? "Gift Card";
  const logoUrl = primaryItem?.brandLogoUrl ?? null;
  const brandCardWorth = resolveBrandCardWorth(order.items);
  const cardWorthValue =
    primaryItem?.skuLabel ||
    (brandCardWorth > 0 ? formatInr(brandCardWorth) : formatInr(order.subtotal));
  const instantDiscountAmount = Math.max(0, brandCardWorth - order.subtotal);
  const instantDiscountPercent =
    brandCardWorth > 0 && instantDiscountAmount > 0
      ? Math.round((instantDiscountAmount / brandCardWorth) * 100)
      : null;

  return (
    <>
    <PaymentComingSoonSheet
      open={paymentComingSoonOpen}
      onClose={() => setPaymentComingSoonOpen(false)}
    />
    <ShopAccountShell hideSidebar>
      <div className="mx-auto w-full max-w-[1100px]">
        <h1 className="font-heading mb-6 text-2xl font-black text-white">Order Details</h1>
        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-2">
        {/* Left column */}
        <div className="flex flex-col gap-4">
          <BrandPremiumVoucherCard
            brandName={brandName}
            logoUrl={logoUrl}
            footerWorth={{ label: "Card worth", value: cardWorthValue }}
          />

          {needsPayment && (
            <SectionCard>
              <div className="flex flex-col gap-3 p-5">
                <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-4">
                  <p className="text-[12px] leading-snug text-amber-100">
                    Payment is incomplete. Your Arena Coins stay on this order until you complete
                    payment or cancel — cancel to release them back to your balance.
                  </p>
                </div>
                {actionInfo && (
                  <p className="rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-white/80">
                    {actionInfo}
                  </p>
                )}
                {actionError && (
                  <p className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-300">
                    {actionError}
                  </p>
                )}
                <button
                  type="button"
                  onClick={() => void handleCompletePayment()}
                  disabled={!!actionLoading}
                  className="w-full rounded-xl bg-gradient-to-r from-[#ff973c] to-[#ff6a00] py-3.5 text-xs font-bold text-black transition hover:opacity-90 active:scale-95 disabled:opacity-50"
                >
                  {actionLoading === "pay" ? (
                    <span className="inline-flex items-center justify-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Opening payment…
                    </span>
                  ) : (
                    "Complete payment"
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => void handleCancelOrder()}
                  disabled={!!actionLoading}
                  className="w-full rounded-xl border border-white/15 py-3 text-xs font-bold uppercase tracking-wide text-white/70 transition hover:bg-white/5 disabled:opacity-50"
                >
                  {actionLoading === "cancel" ? "Cancelling…" : "Cancel order"}
                </button>
              </div>
            </SectionCard>
          )}

          <SectionCard>
            <SectionHeader title="Order Details" />
            <div className="pb-2 pt-2">
              <CopyField label="Order ID" value={order.id} id="order-id" copiedId={copiedId} onCopy={handleCopy} />
              <SectionDivider />
              <CopyField label="Transaction ID" value={transactionId} id="txn-id" copiedId={copiedId} onCopy={handleCopy} />
              <SectionDivider />
              <CopyField
                label="Purchase Date"
                value={formatDate(order.createdAt)}
                id="date"
                showCopy={false}
                copiedId={copiedId}
                onCopy={handleCopy}
              />
            </div>
          </SectionCard>

          <SectionCard>
            <ActionRow
              icon={<Image src={invoiceIcon} alt="" width={18} height={18} className="object-contain opacity-70" />}
              label="View Invoice"
              href={buildInvoicePageUrl(order.id, { chrome: true })}
            />
            <SectionDivider />
            <ActionRow
              icon={<MessageSquare className="h-[18px] w-[18px] text-white/70" />}
              label="Contact Support"
              href="https://www.16arena.com/#contact"
            />
          </SectionCard>
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-4">
          <SectionCard>
            <SectionHeader title="Item Details" />
            <div className="px-5 pb-4 pt-3">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-[11px] font-semibold tracking-wider text-[#BABABA]">Item</p>
                <p className="text-[11px] font-semibold tracking-wider text-[#BABABA]">No.</p>
              </div>
              {order.items.map((it) => {
                const label = it.skuLabel ? `${it.skuLabel} card` : it.productName;
                return (
                  <div key={it.id} className="flex items-center justify-between gap-4">
                    <p className="min-w-0 truncate text-sm font-semibold leading-snug text-white">{label}</p>
                    <p className="shrink-0 text-sm font-semibold text-white/60">x{it.quantity}</p>
                  </div>
                );
              })}
            </div>
          </SectionCard>

          {isPending && !needsPayment && (
            <SectionCard>
              <div className="flex items-center gap-3 p-5">
                <Loader2 className="h-5 w-5 shrink-0 animate-spin text-[var(--flame)]" />
                <p className="text-[13px] leading-snug text-white/70">
                  Your order is being processed. Voucher codes will appear here once fulfilled.
                </p>
              </div>
            </SectionCard>
          )}

          {hasDeliveredVouchers && credFields.length > 0 && (
            <SectionCard>
              <div className="pb-2 pt-2">
                {credFields.map((field, i) => (
                  <React.Fragment key={`cred-${i}`}>
                    {i > 0 && <SectionDivider />}
                    <CredentialRow
                      index={i}
                      field={field}
                      revealed={revealedIndexes.has(i)}
                      onToggleReveal={toggleReveal}
                      copiedId={copiedId}
                      onCopy={handleCopy}
                    />
                  </React.Fragment>
                ))}
              </div>
            </SectionCard>
          )}

          <SectionCard>
            <SectionHeader title="Bill Details" />
            <div className="flex flex-col gap-0.5 pb-3 pt-3">
              <BillRow
                label="Brand Card worth"
                value={formatInr(brandCardWorth > 0 ? brandCardWorth : order.subtotal)}
                bold
              />
              {instantDiscountAmount > 0 && (
                <div className="flex items-start justify-between gap-4 px-5 py-2">
                  <p className="flex-1 text-[13px] font-medium leading-snug text-emerald-400">
                    Instant discount{instantDiscountPercent ? ` (${instantDiscountPercent}%)` : ""}
                  </p>
                  <p className="shrink-0 text-[13px] font-semibold text-white">
                    -{formatInr(instantDiscountAmount)}
                  </p>
                </div>
              )}
              {order.coinsDiscount > 0 && (
                <div className="flex items-start justify-between gap-4 px-5 py-2">
                  <p className="flex-1 text-[13px] font-medium leading-snug text-emerald-400">
                    Instant savings with arena coins{savingsPercent ? ` (${savingsPercent}%)` : ""}
                  </p>
                  <div className="flex shrink-0 items-center gap-1">
                    <p className="text-[13px] font-semibold text-white">-{formatInr(order.coinsDiscount)}</p>
                  </div>
                </div>
              )}
              {order.discountAmount > 0 && (
                <BillRow
                  label={`Coupon discount${order.couponCode ? ` (${order.couponCode})` : ""}`}
                  value={`-${formatInr(order.discountAmount)}`}
                />
              )}
              {order.coinsSpent > 0 && (
                <div className="flex items-start justify-between gap-4 px-5 py-2">
                  <p className="flex-1 text-[13px] font-medium leading-snug text-white/80">Arena Coins spent</p>
                  <div className="flex shrink-0 items-center gap-1">
                    <Image src={coinImg} alt="Coins" width={13} height={13} />
                    <p className="text-[13px] font-medium text-white">
                      {order.coinsSpent.toLocaleString()}
                    </p>
                  </div>
                </div>
              )}
              {order.cashbackCoinsEarned != null && order.cashbackCoinsEarned > 0 && (
                <BillRow
                  label="Cashback earned"
                  value={`${order.cashbackCoinsEarned.toLocaleString()} Arena Coins`}
                  valueColor="text-emerald-400"
                />
              )}
              <div className="mx-5 my-2 h-px bg-white/[0.06]" />
              <BillRow label="You Paid" value={formatInr(cashPaid)} bold />
            </div>
          </SectionCard>
        </div>
        </div>
      </div>
    </ShopAccountShell>
    </>
  );
}
