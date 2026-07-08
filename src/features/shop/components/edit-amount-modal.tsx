"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { X, Check } from "lucide-react";
import type { ShopProductDetail, ShopSku, ShopAmountRestrictions } from "../types/shop.types";
import { gradientFor } from "../utils/mappers";

function rgba(hex: string, opacity: number) {
  if (!hex || hex.length < 7) return `rgba(255, 255, 255, ${opacity})`;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
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

  useEffect(() => {
    if (open) {
      setLocalText(initialAmountText);
      const num = parseFloat(initialAmountText);
      setLocalAmount(Number.isNaN(num) ? 0 : num);
      setLocalSelectedSku(sku);
    }
  }, [open, initialAmountText, sku]);

  if (!open) return null;

  const g = gradientFor(product.brandName ?? product.name);

  // Check validations (only relevant for flexible mode)
  let hasError = false;
  let errorMessage = "";

  if (isFlexibleSelection && amountRestrictions) {
    if (localAmount < amountRestrictions.minVoucherAmount || localAmount > amountRestrictions.maxVoucherAmount) {
      hasError = true;
      errorMessage = `Amount must be between ₹${amountRestrictions.minVoucherAmount} and ₹${amountRestrictions.maxVoucherAmount}`;
    }
  }

  const handleKeypadPress = (key: string) => {
    let current = localText;
    if (key === "clear") {
      current = "";
    } else if (key === "backspace") {
      current = current.slice(0, -1);
    } else {
      const maxLength = amountRestrictions ? String(amountRestrictions.maxVoucherAmount).length : 7;
      if (current.length >= maxLength) {
        return;
      }
      if (current === "0" || current === "") {
        current = key;
      } else {
        current = current + key;
      }
    }
    
    setLocalText(current);
    const num = parseFloat(current);
    if (!Number.isNaN(num)) {
      setLocalAmount(num);
    } else {
      setLocalAmount(0);
    }
  };

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
          className="relative w-full max-w-[560px] aspect-[1.85/1] rounded-[14px] overflow-hidden border border-white/10 p-6 flex flex-col justify-between shadow-2xl mx-auto select-none"
          style={{
            background: `linear-gradient(135deg, ${g.accent} 0%, ${g.accent2} 100%)`,
            boxShadow: `0 20px 50px -15px ${rgba(g.accent, 0.4)}, inset 0 1px 0 rgba(255,255,255,0.15)`,
          }}
        >
          {(localSelectedSku.savingsPercent ?? product.savingsPercent ?? 5) > 0 && (
            <div className="absolute top-0 left-1/2 -translate-x-1/2 bg-[#25C26E] text-white text-[12.5px] font-extrabold px-6 py-2 rounded-b-[6px] shadow-sm z-10 whitespace-nowrap">
              {localSelectedSku.savingsPercent ?? product.savingsPercent ?? 5}% off with Arena Coins
            </div>
          )}
          <div className="flex justify-between items-start"></div>

          <div className="mx-auto flex flex-col items-center justify-center bg-white/10 backdrop-blur-md border border-white/15 rounded-[16px] px-5 py-3 shadow-[0_8px_32px_0_rgba(0,0,0,0.15)]">
            <span className="text-white/80 text-[10px] font-bold uppercase tracking-[0.08em] mb-1">
              1 Card worth
            </span>
            <span className="text-white text-3xl font-black leading-none tabular-nums">
              ₹{localAmount.toLocaleString("en-IN")}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {product.logoUrl && (
              <div className="relative w-8 h-8 rounded-full overflow-hidden border border-white/15 bg-black/10">
                <Image src={product.logoUrl} alt="" fill className="object-cover" />
              </div>
            )}
            <span className="text-xs font-bold uppercase tracking-[0.05em] text-white/90">
              {product.brandName ?? product.name}
            </span>
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
                        {item.savingsPercent}% OFF
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

        {/* View Discounted Price Action Button */}
        <button
          type="button"
          onClick={() => onConfirm(localText, localAmount, localSelectedSku)}
          disabled={hasError || localAmount <= 0}
          className="w-full h-12 bg-gradient-to-r from-[var(--flame)] via-[var(--flame-deep)] to-[var(--flame)] hover:brightness-105 text-black text-sm font-extrabold uppercase tracking-wider rounded-xl active:scale-[0.98] transition shadow-[0_12px_24px_-10px_rgba(255,68,0,0.4)] disabled:opacity-40"
        >
          View discounted price
        </button>
      </div>
    </div>
  );
}
