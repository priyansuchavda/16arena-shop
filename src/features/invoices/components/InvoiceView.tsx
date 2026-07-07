"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Share2 } from "lucide-react";
import { useAuthStore } from "@/features/auth";
import {
  buildInvoiceDocumentUrl,
  buildInvoicePageUrl,
  isOnInvoiceWebHost,
} from "../utils/invoice-url";

type InvoiceViewProps = {
  orderId: string;
  token?: string;
  /** Show top bar when opened from shop web (mobile WebView has its own chrome). */
  showChrome?: boolean;
};

/**
 * Web equivalent of `invoice_web_view_page.dart`:
 * loads the backend invoice document in an iframe (InAppWebView parity).
 */
export function InvoiceView({ orderId, token, showChrome = false }: InvoiceViewProps) {
  const router = useRouter();
  const accessToken = useAuthStore((state) => state.accessToken);
  const setAuth = useAuthStore((state) => state.setAuth);

  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (token && !accessToken) {
      setAuth({ displayName: "Guest" }, token, "");
    }
  }, [token, accessToken, setAuth]);

  const effectiveToken = token ?? accessToken;
  const invoiceDocUrl = useMemo(
    () => buildInvoiceDocumentUrl(orderId, effectiveToken),
    [orderId, effectiveToken]
  );

  useEffect(() => {
    if (!orderId || typeof window === "undefined") return;
    if (!isOnInvoiceWebHost()) {
      const target = buildInvoicePageUrl(orderId, { token, chrome: showChrome });
      if (target) window.location.replace(target);
    }
  }, [orderId, token, showChrome]);

  useEffect(() => {
    if (!loading) return;
    setProgress(0);
    const interval = window.setInterval(() => {
      setProgress((value) => {
        if (value >= 0.9) return value;
        return value + 0.08;
      });
    }, 180);
    return () => window.clearInterval(interval);
  }, [loading, invoiceDocUrl]);

  const shareInvoice = async () => {
    const shareUrl = buildInvoicePageUrl(orderId);
    if (navigator.share) {
      await navigator.share({
        title: "16 Arena Invoice",
        text: "Check out my invoice from 16 Arena",
        url: shareUrl,
      });
      return;
    }
    await navigator.clipboard.writeText(shareUrl);
  };

  if (!orderId) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white text-sm text-black/50">
        Invalid Order ID.
      </div>
    );
  }

  if (!invoiceDocUrl) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white text-sm text-black/50">
        Invoice service is not configured.
      </div>
    );
  }

  const topOffset = showChrome ? "pt-[68px]" : "";

  return (
    <div className="relative min-h-screen bg-white">
      {showChrome && (
        <header className="fixed inset-x-0 top-0 z-20 flex h-[68px] items-center justify-between border-b border-[#fe8321]/30 bg-[#0c0c0c] px-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 text-sm font-semibold text-white/80 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
          <h1 className="text-sm font-bold text-white">Invoice</h1>
          <button
            type="button"
            onClick={shareInvoice}
            className="rounded-lg p-2 text-white/80 hover:bg-white/10 hover:text-white"
            aria-label="Share invoice"
          >
            <Share2 className="h-5 w-5" />
          </button>
        </header>
      )}

      {loading && (
        <div className="fixed inset-x-0 top-0 z-30 h-[3px] bg-white/10">
          <div
            className="h-full bg-[#fe8321] transition-all duration-200"
            style={{ width: `${Math.max(progress * 100, 12)}%` }}
          />
        </div>
      )}

      <div className={`min-h-screen ${topOffset}`}>
        <iframe
          key={invoiceDocUrl}
          src={invoiceDocUrl}
          title="Invoice"
          className="h-screen w-full border-0 bg-white"
          onLoad={() => {
            setProgress(1);
            setLoading(false);
          }}
        />
      </div>

      {!showChrome && (
        <div className="fixed bottom-4 right-4 z-20 print:hidden">
          <Link
            href={`/orders/${orderId}`}
            className="rounded-full border border-black/10 bg-white/95 px-4 py-2 text-xs font-semibold text-black/70 shadow-md backdrop-blur hover:text-black"
          >
            Order details
          </Link>
        </div>
      )}
    </div>
  );
}
