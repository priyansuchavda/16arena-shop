"use client";

import React, { useState, useEffect, useCallback } from "react";
import { buildInvoicePageUrl } from "@/features/invoices/utils/invoice-url";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Clock,
  AlertCircle,
  Copy,
  Check,
  Eye,
  EyeOff,
  Loader2,
  Receipt,
  MessageSquare,
  FileText,
  ChevronRight,
  ChevronDown,
} from "lucide-react";
import { shopApi } from "@/features/shop";
import { ShopAccountShell } from "@/features/shop/components/shop-account-shell";
import { ShopOrder, ShopOrderItem } from "@/features/shop/types/shop.types";
import coinImg from "@/assets/png/coin.png";

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatDate(isoString: string) {
  try {
    return new Date(isoString).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return isoString;
  }
}

function formatInr(amount: number) {
  return `₹${amount.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

function paymentMethodLabel(method: string) {
  const n = method.toLowerCase();
  if (n.includes("phonepe")) return "PhonePe UPI";
  if (n.includes("upi")) return "UPI";
  if (n.includes("razorpay")) return "UPI";
  if (n.includes("wallet")) return "Wallet";
  if (!method) return "UPI";
  return method.toUpperCase();
}

function maskValue(value: string) {
  return value.replace(/[^\s\-]/g, "*");
}

// ─── Status chip ────────────────────────────────────────────────────────────

function StatusChip({ status }: { status: string }) {
  const s = status.toLowerCase();
  const config: Record<string, { label: string; color: string; bg: string; border: string; Icon: React.FC<{ className?: string }> }> = {
    fulfilled:          { label: "Fulfilled",         color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/25", Icon: CheckCircle2 },
    refunded:           { label: "Refunded",          color: "text-[var(--flame)]", bg: "bg-[var(--flame)]/10", border: "border-[var(--flame)]/25", Icon: RefreshCw },
    cancelled:          { label: "Cancelled",         color: "text-white/50", bg: "bg-white/5",         border: "border-white/10",            Icon: XCircle },
    payment_failed:     { label: "Payment Failed",    color: "text-red-400",   bg: "bg-red-500/10",     border: "border-red-500/25",           Icon: XCircle },
    fulfillment_failed: { label: "Fulfillment Failed",color: "text-red-400",   bg: "bg-red-500/10",     border: "border-red-500/25",           Icon: AlertCircle },
  };
  const c = config[s] ?? { label: status.replace(/_/g, " "), color: "text-[var(--flame)]", bg: "bg-[var(--flame)]/10", border: "border-[var(--flame)]/25", Icon: Clock };
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold capitalize ${c.color} ${c.bg} border ${c.border}`}>
      <c.Icon className="w-3 h-3" />
      {c.label}
    </span>
  );
}

// ─── Section card (glass gradient border) ───────────────────────────────────

function SectionCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black overflow-hidden shadow-lg">
      {children}
    </div>
  );
}

function CollapsibleSectionCard({
  title,
  children,
  defaultExpanded = false,
}: {
  title: string;
  children: React.ReactNode;
  defaultExpanded?: boolean;
}) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <div className="rounded-2xl border border-white/10 bg-black overflow-hidden shadow-lg">
      {/* Header (clickable toggle) */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-5 py-4 text-left focus:outline-none hover:bg-white/[0.02] transition"
      >
        <span className="text-[13px] font-extrabold text-white tracking-wide">{title}</span>
        <ChevronDown
          className={`w-4 h-4 text-white/50 transition-transform duration-200 ${
            isExpanded ? "transform rotate-180" : ""
          }`}
        />
      </button>

      {/* Expandable Content Container */}
      <div
        className={`transition-all duration-200 ease-in-out overflow-hidden ${
          isExpanded ? "max-h-[1000px] opacity-100 border-t border-white/[0.06]" : "max-h-0 opacity-0"
        }`}
      >
        {children}
      </div>
    </div>
  );
}

function SectionDivider() {
  return <div className="h-px bg-white/[0.06] mx-0" />;
}

function SectionHeader({ title }: { title: string }) {
  return (
    <div className="px-5 pt-5 pb-0">
      <p className="text-[13px] font-extrabold text-white tracking-wide">{title}</p>
      <div className="h-px bg-white/[0.06] mt-4" />
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
      className="p-1.5 bg-white/5 rounded-lg hover:bg-white/10 active:scale-95 transition border border-white/[0.06] focus:outline-none flex-shrink-0"
      style={{ outline: "none", boxShadow: "none" }}
    >
      {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-white/40" />}
    </button>
  );
}

// ─── Credential row (masked/revealed) ────────────────────────────────────────

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
    <div className="px-5 py-4 flex items-center gap-3">
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-bold text-white leading-snug">{field.label}</p>
        <p className={`text-[12px] font-semibold mt-1.5 font-mono truncate transition-all duration-200 ${hidden ? "text-white/35 tracking-widest" : "text-[#BABABA]"}`}>
          {display}
        </p>
      </div>
      {field.sensitive && (
        <button
          type="button"
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); onToggleReveal(index); }}
          className="p-1.5 bg-white/5 rounded-lg hover:bg-white/10 transition border border-white/[0.06] focus:outline-none flex-shrink-0"
          style={{ outline: "none", boxShadow: "none" }}
        >
          {revealed ? <EyeOff className="w-3.5 h-3.5 text-white/50" /> : <Eye className="w-3.5 h-3.5 text-white/50" />}
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
      <p className={`text-[12px] leading-snug ${bold ? "font-bold text-white" : "font-medium text-white/80"}`}>{label}</p>
      <p className={`text-[12px] font-semibold shrink-0 ${valueColor ?? "text-white"} ${bold ? "font-bold" : ""}`}>{value}</p>
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
        <p className="text-[13px] font-bold text-white">{label}</p>
        <p className="text-[11px] font-mono font-medium text-[#BABABA] mt-1 truncate">{value}</p>
      </div>
      {showCopy && <CopyButton text={value} id={id} copiedId={copiedId} onCopy={onCopy} />}
    </div>
  );
}

// ─── Action row ───────────────────────────────────────────────────────────────

function ActionRow({ icon: Icon, label, href, onClick }: {
  icon: React.FC<{ className?: string }>;
  label: string;
  href?: string;
  onClick?: () => void;
}) {
  const inner = (
    <div className="flex items-center gap-3.5 px-5 py-4 hover:bg-white/[0.03] active:bg-white/[0.06] transition cursor-pointer">
      <Icon className="w-[18px] h-[18px] text-white/70 flex-shrink-0" />
      <span className="flex-1 text-[13px] font-semibold text-white">{label}</span>
      <ChevronRight className="w-4 h-4 text-white/20" />
    </div>
  );
  if (href) return <Link href={href}>{inner}</Link>;
  return <div onClick={onClick}>{inner}</div>;
}

// ─── Credential fields builder ────────────────────────────────────────────────

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

// ─── Hero card (gradient voucher card) ──────────────────────────────────────

function HeroCard({ order }: { order: ShopOrder }) {
  const item = order.items[0];
  const logoUrl = item?.brandLogoUrl ?? item?.productImageUrl;
  const brandName = item?.brandName ?? item?.productName ?? "Gift Card";
  const worthText = item?.faceValue && item.faceValue > 0
    ? formatInr(item.faceValue)
    : (item?.skuLabel || formatInr(order.subtotal));

  const bgImg = item?.productImageUrl ?? item?.brandLogoUrl;

  return (
    <div
      className="relative w-full rounded-2xl overflow-hidden shadow-2xl"
      style={{ aspectRatio: "1.586/1", background: "linear-gradient(135deg, #1f1f1f 0%, #2e2e2e 100%)" }}
    >
      {/* Ambient background photo */}
      {bgImg && (
        <div className="absolute inset-0 w-full h-full pointer-events-none z-0">
          <Image
            src={bgImg}
            alt=""
            fill
            className="object-cover opacity-25 filter blur-[2px]"
            priority
          />
          {/* Dark gradient overlay to ensure text contrast */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/45 to-black/25" />
        </div>
      )}

      {/* Glare overlay */}
      <div className="absolute inset-0 opacity-30 z-10 pointer-events-none" style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.25) 0%, transparent 50%)" }} />

      {/* Brand logo top-left */}
      <div className="absolute top-4 left-4 flex items-center gap-2.5 z-20">
        {logoUrl ? (
          <div className="relative w-10 h-10 rounded-xl overflow-hidden bg-black/20 border border-white/10 shrink-0">
            <Image src={logoUrl} alt={brandName} fill className="object-contain p-1" />
          </div>
        ) : (
          <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
            <span className="text-white text-xs font-black">{brandName[0]}</span>
          </div>
        )}
        <div>
          <p className="text-white text-[13px] font-black leading-tight">{brandName}</p>
          <p className="text-white/50 text-[10px] font-semibold">Gift Card</p>
        </div>
      </div>

      {/* Worth bottom-right */}
      <div className="absolute bottom-4 right-4 text-right z-20">
        <p className="text-white/50 text-[9px] font-semibold uppercase tracking-widest mb-0.5">Voucher worth</p>
        <p className="text-white text-2xl font-black tracking-tight">{worthText}</p>
      </div>

      {/* Chip emblem */}
      <div className="absolute bottom-4 left-4 opacity-25 z-20">
        <div className="w-8 h-6 rounded-sm border-2 border-white/40 grid grid-cols-2 gap-px p-px">
          <div className="bg-white/40 rounded-[1px]" />
          <div className="bg-white/40 rounded-[1px]" />
          <div className="bg-white/40 rounded-[1px]" />
          <div className="bg-white/40 rounded-[1px]" />
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function OrderDetailShell({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [order, setOrder] = useState<ShopOrder | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [revealedIndexes, setRevealedIndexes] = useState<Set<number>>(new Set());

  const loadOrder = useCallback(async () => {
    setIsLoading(true);
    try {
      const o = await shopApi.getOrder(orderId);
      setOrder(o);
    } finally {
      setIsLoading(false);
    }
  }, [orderId]);

  useEffect(() => { loadOrder(); }, [loadOrder]);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const toggleReveal = (index: number) => {
    setRevealedIndexes((prev) => {
      const next = new Set(prev);
      next.has(index) ? next.delete(index) : next.add(index);
      return next;
    });
  };

  // ─── Loading ─────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <ShopAccountShell hideSidebar>
        <div className="mx-auto max-w-[500px] w-full">
          <div className="flex flex-col items-center justify-center rounded-2xl border border-[var(--line)] bg-[var(--surface)] py-24">
            <Loader2 className="mb-4 h-8 w-8 animate-spin text-[var(--flame)]" />
            <p className="text-sm text-[var(--muted)]">Loading order details…</p>
          </div>
        </div>
      </ShopAccountShell>
    );
  }

  if (!order) {
    return (
      <ShopAccountShell hideSidebar>
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
      </ShopAccountShell>
    );
  }

  // ─── Build credential rows ────────────────────────────────────────────────

  const credFields = buildCredentialFields(order.items);
  const isPending = ["pending", "processing", "payment_initiated", "payment_success"].includes(order.status.toLowerCase());
  const hasDeliveredVouchers = order.items.some((item) =>
    (item.vouchers && item.vouchers.length > 0) || item.voucherCode || (item.voucherDetails && item.voucherDetails.length > 0)
  );

  const item = order.items[0];
  const transactionId = order.orderNumber || order.id;
  const savingsPercent =
    order.subtotal > 0 && order.coinsDiscount > 0
      ? Math.round((order.coinsDiscount / order.subtotal) * 100)
      : null;
  const cashPaid =
    order.totalPaid > 0
      ? order.totalPaid
      : Math.max(0, order.subtotal - order.coinsDiscount - order.discountAmount);

  return (
    <ShopAccountShell hideSidebar>
      {/* Header row - aligns with the layout width */}
      <div className="mb-6 flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="rounded-full border border-[var(--line)] p-2 transition hover:bg-white/5 focus:outline-none"
          style={{ outline: "none", boxShadow: "none" }}
        >
          <ArrowLeft className="h-5 w-5 text-white" />
        </button>
        <h1 className="font-heading text-2xl font-extrabold text-white">Order Details</h1>
      </div>

      {/* Grid Layout: Left Column (Card & Codes), Right Column (Bill, Items, Actions) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 items-start gap-6">
        
        {/* Left Column - Card & Credentials */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <SectionCard>
            <div className="p-5 flex flex-col gap-5">
              {/* ── Hero Card ── */}
              <HeroCard order={order} />

              {/* Status + date */}
              <div className="flex items-center justify-between px-1">
                <StatusChip status={order.status} />
                <p className="text-[11px] text-white/30 font-semibold">{formatDate(order.createdAt)}</p>
              </div>

              {/* ── Credentials Section ── */}
              {isPending ? (
                <div className="p-5 flex items-center gap-3 bg-white/5 rounded-xl border border-white/10">
                  <Loader2 className="w-5 h-5 text-[var(--flame)] animate-spin shrink-0" />
                  <p className="text-[12px] text-white/70 leading-snug">
                    Your order is being processed. Voucher codes will appear here once fulfilled.
                  </p>
                </div>
              ) : hasDeliveredVouchers && credFields.length > 0 ? (
                <div className="flex flex-col bg-white/5 rounded-xl border border-white/10 overflow-hidden">
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
              ) : null}

              {/* Buy Again button */}
              <button
                onClick={() => router.push("/shop")}
                className="w-full rounded-xl bg-gradient-to-r from-[#ff973c] to-[#ff6a00] py-3.5 text-xs font-bold text-black transition active:scale-95 hover:opacity-90 mt-1"
              >
                Buy Again
              </button>
            </div>
          </SectionCard>
        </div>

        {/* Right Column - Billing, Items, Actions */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          {/* ── Item Details ── */}
          <CollapsibleSectionCard title="Item Details" defaultExpanded={true}>
            <div className="px-5 pt-3 pb-2">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-white/30">Item</p>
                <p className="text-[10px] font-bold uppercase tracking-wider text-white/30">Qty</p>
              </div>
              {order.items.map((it) => {
                const label = it.skuLabel ? `${it.skuLabel} card` : it.productName;
                return (
                  <div key={it.id} className="flex items-center justify-between gap-4 pb-3">
                    <div className="flex items-center gap-3 min-w-0">
                      {it.productImageUrl && (
                        <div className="relative w-9 h-9 rounded-lg overflow-hidden border border-white/10 shrink-0">
                          <Image src={it.productImageUrl} alt="" fill className="object-cover" />
                        </div>
                      )}
                      <p className="text-[13px] font-bold text-white truncate leading-snug">{label}</p>
                    </div>
                    <p className="text-[13px] font-bold text-white/60 shrink-0">×{it.quantity}</p>
                  </div>
                );
              })}
            </div>
          </CollapsibleSectionCard>

          {/* ── Bill Details ── */}
          <CollapsibleSectionCard title="Bill Details" defaultExpanded={false}>
            <div className="pt-3 pb-3 flex flex-col gap-0.5">
              <BillRow label="Brand Card worth" value={formatInr(order.subtotal)} bold />
              {order.coinsDiscount > 0 && (
                <div className="flex items-start justify-between gap-4 px-5 py-2">
                  <p className="text-[12px] font-medium text-emerald-400 leading-snug flex-1">
                    Instant savings with arena coins{savingsPercent ? ` (${savingsPercent}%)` : ""}
                  </p>
                  <div className="flex items-center gap-1 shrink-0">
                    <Image src={coinImg} alt="Coins" width={13} height={13} />
                    <p className="text-[12px] font-bold text-white">-{formatInr(order.coinsDiscount)}</p>
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
                <BillRow label="Arena Coins spent" value={`${order.coinsSpent.toLocaleString()} coins`} />
              )}
              {order.cashbackCoinsEarned != null && order.cashbackCoinsEarned > 0 && (
                <BillRow
                  label="Cashback earned"
                  value={`${order.cashbackCoinsEarned.toLocaleString()} Arena Coins`}
                  valueColor="text-emerald-400"
                />
              )}
              <div className="h-px bg-white/[0.06] mx-5 my-2" />
              <BillRow label="You paid" value={formatInr(order.subtotal)} bold />
              <BillRow label={`Via ${paymentMethodLabel(order.paymentMethod)}`} value={formatInr(cashPaid)} />
            </div>
          </CollapsibleSectionCard>

          {/* ── Order Details ── */}
          <CollapsibleSectionCard title="Order Details" defaultExpanded={false}>
            <div className="pt-2 pb-2">
              <CopyField label="Order ID" value={order.id} id="order-id" copiedId={copiedId} onCopy={handleCopy} />
              <SectionDivider />
              <CopyField label="Transaction ID" value={transactionId} id="txn-id" copiedId={copiedId} onCopy={handleCopy} />
              <SectionDivider />
              <CopyField label="Purchase Date" value={formatDate(order.createdAt)} id="date" showCopy={false} copiedId={copiedId} onCopy={handleCopy} />
            </div>
          </CollapsibleSectionCard>

          {/* ── Actions ── */}
          <SectionCard>
            <ActionRow
              icon={Receipt}
              label="View Invoice"
              href={buildInvoicePageUrl(order.id, { chrome: true })}
            />
            <SectionDivider />
            <ActionRow icon={MessageSquare} label="Contact Support" href="https://www.16arena.com/#contact" />
          </SectionCard>
        </div>
      </div>
    </ShopAccountShell>
  );
}
