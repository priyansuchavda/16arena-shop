"use client";

import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import Image from "next/image";
import { X, Check } from "lucide-react";
import type { ShopProductDetail, ShopSku, ShopAmountRestrictions } from "../types/shop.types";
import { gradientFor } from "../utils/mappers";
import { formatPercent } from "../utils/checkout.utils";
import { getCachedLogoColors, prefetchLogoColors } from "../utils/logo-colors";
import { useTransparentLogo } from "../hooks/useTransparentLogo";
import { SlantedButton } from "@/shared/components/ui/slanted-button";

function rgba(hex: string, opacity: number) {
  if (!hex || hex.length < 7) return `rgba(255, 255, 255, ${opacity})`;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

function useLogoColors(
  logoUrl: string | null,
  fallbackColors: { accent: string; accent2: string }
) {
  const [colors, setColors] = useState(
    () => getCachedLogoColors(logoUrl) ?? fallbackColors
  );

  useEffect(() => {
    if (!logoUrl) {
      setColors(fallbackColors);
      return;
    }

    const cached = getCachedLogoColors(logoUrl);
    if (cached) {
      setColors(cached);
      return;
    }

    let cancelled = false;
    prefetchLogoColors(logoUrl).then((extracted) => {
      if (!cancelled) setColors(extracted ?? fallbackColors);
    });

    return () => {
      cancelled = true;
    };
  }, [logoUrl, fallbackColors.accent, fallbackColors.accent2]);

  return colors;
}

type EditAmountModalProps = {
  open: boolean;
  onClose: () => void;
  product: ShopProductDetail;
  sku: ShopSku;
  fixedSkus: ShopSku[];
  isFlexibleSelection: boolean;
  initialAmountText: string;
  amountRestrictions: ShopAmountRestrictions | null;
  onConfirm: (amountText: string, amount: number, selectedSku?: ShopSku) => void;
};

export function EditAmountModal({
  open,
  onClose,
  product,
  sku,
  fixedSkus,
  isFlexibleSelection,
  initialAmountText,
  amountRestrictions,
  onConfirm,
}: EditAmountModalProps) {
  const [localText, setLocalText] = useState(initialAmountText);
  const [localAmount, setLocalAmount] = useState(() => {
    const num = parseFloat(initialAmountText);
    return Number.isNaN(num) ? 0 : num;
  });
  const [localSelectedSku, setLocalSelectedSku] = useState<ShopSku>(sku);
  const localTextRef = useRef(localText);
  const localAmountRef = useRef(localAmount);
  const localSelectedSkuRef = useRef(localSelectedSku);

  // All hooks must be above the early return
  const fallbackG = useMemo(() => gradientFor(product.brandName ?? product.name), [product]);
  const g = useLogoColors(product.logoUrl ?? null, fallbackG);
  const transparentLogoUrl = useTransparentLogo(product.logoUrl ?? null);

  const cardRef = useRef<HTMLDivElement>(null);
  const [cardWidth, setCardWidth] = useState(0);

  useEffect(() => {
    localTextRef.current = localText;
  }, [localText]);

  useEffect(() => {
    localAmountRef.current = localAmount;
  }, [localAmount]);

  useEffect(() => {
    localSelectedSkuRef.current = localSelectedSku;
  }, [localSelectedSku]);

  useEffect(() => {
    if (open) {
      setLocalText(initialAmountText);
      localTextRef.current = initialAmountText;
      const num = parseFloat(initialAmountText);
      const nextAmount = Number.isNaN(num) ? 0 : num;
      setLocalAmount(nextAmount);
      localAmountRef.current = nextAmount;
      setLocalSelectedSku(sku);
      localSelectedSkuRef.current = sku;
    }
  }, [open, initialAmountText, sku]);

  useEffect(() => {
    if (!cardRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (let entry of entries) {
        setCardWidth(entry.contentRect.width);
      }
    });
    observer.observe(cardRef.current);
    return () => observer.disconnect();
  }, [open]);

  const flatStop = useMemo(() => {
    if (cardWidth <= 0) return 0.10;
    const logoInset = 10;
    const logoMaxWidth = 188;
    const logoEndFraction = (logoInset + logoMaxWidth) / cardWidth;
    const gradientStartBias = 0.76;
    return Math.min(0.42, Math.max(0.08, logoEndFraction * gradientStartBias));
  }, [cardWidth]);

  const applyText = useCallback((current: string) => {
    setLocalText(current);
    localTextRef.current = current;
    const num = parseFloat(current);
    const nextAmount = Number.isNaN(num) ? 0 : num;
    setLocalAmount(nextAmount);
    localAmountRef.current = nextAmount;
  }, []);

  const handleKeypadPress = useCallback(
    (key: string) => {
      let current = localTextRef.current;
      if (key === "clear") {
        current = "";
      } else if (key === "backspace") {
        current = current.slice(0, -1);
      } else {
        const maxLength = amountRestrictions
          ? String(amountRestrictions.maxVoucherAmount).length
          : 7;
        if (current.length >= maxLength) {
          return;
        }
        if (current === "0" || current === "") {
          current = key;
        } else {
          current = current + key;
        }
      }

      applyText(current);
    },
    [amountRestrictions, applyText]
  );

  // Check validations (only relevant for flexible mode)
  let hasError = false;
  let errorMessage = "";

  if (isFlexibleSelection && amountRestrictions) {
    if (
      localAmount < amountRestrictions.minVoucherAmount ||
      localAmount > amountRestrictions.maxVoucherAmount
    ) {
      hasError = true;
      errorMessage = `Amount must be between ₹${amountRestrictions.minVoucherAmount} and ₹${amountRestrictions.maxVoucherAmount}`;
    }
  }

  // Physical keyboard support for flexible amount entry.
  useEffect(() => {
    if (!open || !isFlexibleSelection) return;

    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return;
      }

      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key === "Enter") {
        e.preventDefault();
        const amount = localAmountRef.current;
        const text = localTextRef.current;
        const selectedSku = localSelectedSkuRef.current;
        const outOfRange =
          !!amountRestrictions &&
          (amount < amountRestrictions.minVoucherAmount ||
            amount > amountRestrictions.maxVoucherAmount);
        if (!outOfRange && amount > 0) {
          onConfirm(text, amount, selectedSku);
        }
        return;
      }
      if (e.key === "Backspace") {
        e.preventDefault();
        handleKeypadPress("backspace");
        return;
      }
      if (e.key === "Delete") {
        e.preventDefault();
        handleKeypadPress("clear");
        return;
      }
      if (/^[0-9]$/.test(e.key)) {
        e.preventDefault();
        handleKeypadPress(e.key);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [
    open,
    isFlexibleSelection,
    amountRestrictions,
    onClose,
    onConfirm,
    handleKeypadPress,
  ]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[150] bg-black/80 flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[480px] bg-[#141414] border border-white/10 rounded-[28px] p-6 shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col gap-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-base font-extrabold text-white">
            {isFlexibleSelection ? "Edit Amount" : "Select Denomination"}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full bg-white/5 border border-white/10 text-white/50 hover:text-white hover:bg-white/10 active:scale-95 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Card inside modal */}
        <div
          ref={cardRef}
          className="relative w-full max-w-[560px] aspect-[1.85/1] rounded-[14px] overflow-hidden border border-white/10 p-6 flex flex-col justify-between mx-auto select-none"
          style={{
            background: `linear-gradient(to top right, ${g.accent} 0%, ${g.accent} ${flatStop * 100}%, ${g.accent2} 100%)`,
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.15)"
          }}
        >
          {/* Specular Sheen Reflections Overlay */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden select-none z-0">
            {/* Ellipse 1 */}
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
            {/* Ellipse 2 */}
            <div 
              className="absolute rounded-full"
              style={{
                left: '18%',
                top: '34%',
                width: '72%',
                height: '14%',
                transform: 'rotate(45deg)',
                filter: 'blur(20px)',
                background: 'linear-gradient(to right, rgba(255,255,255,0) 0%, rgba(255,255,255,0.14) 50%, rgba(255,255,255,0) 100%)',
              }}
            />
            {/* Ellipse 3 */}
            <div 
              className="absolute rounded-full"
              style={{
                left: '52%',
                top: '-4%',
                width: '42%',
                height: '10%',
                transform: 'rotate(45deg)',
                filter: 'blur(16px)',
                background: 'linear-gradient(to right, rgba(255,255,255,0) 0%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0) 100%)',
              }}
            />
          </div>

          <div className="flex justify-between items-start"></div>

          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center justify-center bg-white/10 backdrop-blur-md border border-white/15 rounded-[18px] px-7 py-4.5 shadow-[0_8px_32px_0_rgba(0,0,0,0.15)] z-10">
            <span className="text-white/80 text-[11.5px] font-semibold tracking-[0.06em] mb-1.5 font-heading">
              1 Card Worth
            </span>
            <span className="text-white text-[36px] font-medium leading-none tabular-nums flex items-center font-sans">
              ₹{localAmount.toLocaleString("en-IN")}
              <span
                className="inline-block w-[2px] h-8 bg-white ml-0.5"
                style={{ animation: "blink-caret 1s step-end infinite" }}
              />
            </span>
          </div>

          <div className="flex items-center gap-3 relative z-10">
            {transparentLogoUrl ? (
              <Image
                src={transparentLogoUrl}
                alt=""
                width={276}
                height={92}
                className="h-[92px] w-auto object-contain translate-y-5"
              />
            ) : (
              <span className="text-xs font-bold uppercase tracking-[0.05em] text-white/90">
                {product.brandName ?? product.name}
              </span>
            )}
          </div>
        </div>

        {/* Input Selector Area */}
        {isFlexibleSelection ? (
          /* Custom Numeric Keypad for flexible amount */
          <div className="grid grid-cols-3 gap-x-6 gap-y-4 w-full max-w-[360px] mx-auto my-2">
            {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => handleKeypadPress(num)}
                className="h-12 flex items-center justify-center text-2xl font-bold text-white/90 hover:bg-white/5 active:scale-90 transition rounded-xl"
              >
                {num}
              </button>
            ))}
            <button
              type="button"
              onClick={() => handleKeypadPress("clear")}
              className="h-12 flex items-center justify-center text-sm font-bold text-white/50 hover:bg-white/5 hover:text-white active:scale-90 transition rounded-xl"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={() => handleKeypadPress("0")}
              className="h-12 flex items-center justify-center text-2xl font-bold text-white/90 hover:bg-white/5 active:scale-90 transition rounded-xl"
            >
              0
            </button>
            <button
              type="button"
              onClick={() => handleKeypadPress("backspace")}
              className="h-12 flex items-center justify-center text-white/70 hover:bg-white/5 hover:text-white active:scale-90 transition rounded-xl"
            >
              <svg
                viewBox="0 0 24 24"
                width="22"
                height="22"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z" />
                <line x1="18" y1="9" x2="12" y2="15" />
                <line x1="12" y1="9" x2="18" y2="15" />
              </svg>
            </button>
          </div>
        ) : (
          /* List of fixed amount denominations with radio selectors */
          <div className="flex flex-col border border-white/5 rounded-2xl bg-black/25 overflow-hidden divide-y divide-white/5 my-2 max-h-[220px] overflow-y-auto pr-1">
            {fixedSkus.map((item) => {
              const isSelected = localSelectedSku.id === item.id;
              const originalPrice = item.originalPrice || item.faceValue || item.unitAmount || 0;
              const discountedPrice = item.retailPrice ?? item.price ?? 0;
              const faceVal = item.faceValue || item.unitAmount || 0;
              return (
                <div
                  key={item.id}
                  onClick={() => {
                    setLocalSelectedSku(item);
                    setLocalAmount(faceVal);
                    setLocalText(String(faceVal));
                  }}
                  className="flex items-center justify-between p-4 cursor-pointer hover:bg-white/[0.02] active:bg-white/[0.04] transition"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-white text-base font-extrabold">₹{faceVal.toLocaleString("en-IN")}</span>
                    {item.savingsPercent ? (
                      <span className="text-[10px] font-bold text-[var(--win)] bg-[var(--win)]/[0.08] border border-[var(--win)]/10 px-1.5 py-0.5 rounded">
                        {formatPercent(item.savingsPercent)}% OFF
                      </span>
                    ) : null}
                    {discountedPrice < originalPrice && (
                      <span className="text-xs font-semibold text-[var(--win)]">₹{discountedPrice.toLocaleString("en-IN")}</span>
                    )}
                  </div>
                  <div className="relative">
                    {isSelected ? (
                      <div className="w-5 h-5 rounded-full bg-white flex items-center justify-center">
                        <Check className="w-3.5 h-3.5 text-black stroke-[3.5]" />
                      </div>
                    ) : (
                      <div className="w-5 h-5 rounded-full border-2 border-white/20" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Info label */}
        <div className="text-center text-white/40 text-xs font-semibold">
          1 card worth ₹{localAmount.toLocaleString("en-IN")} will be generated
        </div>

        {/* Error message inside keypad sheet if amount out of bounds */}
        {hasError && errorMessage && (
          <div className="text-center text-xs font-bold text-red-400">
            {errorMessage}
          </div>
        )}

        <SlantedButton
          type="button"
          onClick={() => onConfirm(localText, localAmount, localSelectedSku)}
          disabled={hasError || localAmount <= 0}
          className="w-full h-12 uppercase text-xs"
        >
          View discounted price
        </SlantedButton>
      </div>
    </div>
  );
}
