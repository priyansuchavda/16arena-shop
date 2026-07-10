"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import { X } from "lucide-react";
import coinImg from "@/assets/png/coin.png";
import { SlantedButton } from "@/shared/components/ui/slanted-button";

type EditCoinsModalProps = {
  open: boolean;
  onClose: () => void;
  maxCoins: number;
  initialCoins: number;
  /** INR value of one Arena Coin (e.g. 0.01 = 100 coins per ₹1). */
  coinToInrRate: number;
  onConfirm: (coins: number) => void;
};

export function EditCoinsModal({
  open,
  onClose,
  maxCoins,
  initialCoins,
  coinToInrRate,
  onConfirm,
}: EditCoinsModalProps) {
  const [localText, setLocalText] = useState(String(initialCoins));
  const [localCoins, setLocalCoins] = useState(initialCoins);
  const localTextRef = useRef(localText);
  const localCoinsRef = useRef(localCoins);

  useEffect(() => {
    localTextRef.current = localText;
  }, [localText]);

  useEffect(() => {
    localCoinsRef.current = localCoins;
  }, [localCoins]);

  useEffect(() => {
    if (open) {
      const next = String(initialCoins);
      setLocalText(next);
      localTextRef.current = next;
      setLocalCoins(initialCoins);
      localCoinsRef.current = initialCoins;
    }
  }, [open, initialCoins]);

  const applyText = useCallback((current: string) => {
    setLocalText(current);
    localTextRef.current = current;
    const num = parseInt(current, 10);
    const nextCoins = Number.isNaN(num) ? 0 : num;
    setLocalCoins(nextCoins);
    localCoinsRef.current = nextCoins;
  }, []);

  const handleKeypadPress = useCallback(
    (key: string) => {
      let current = localTextRef.current;
      if (key === "clear") {
        current = "";
      } else if (key === "backspace") {
        current = current.slice(0, -1);
      } else {
        const maxLength = Math.max(7, String(maxCoins).length);
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
    [maxCoins, applyText]
  );

  const hasError = localCoins > maxCoins;
  const inrOff = localCoins * (coinToInrRate > 0 ? coinToInrRate : 0.01);

  const footerMessage = (() => {
    if (hasError) {
      return `You can use up to ${maxCoins.toLocaleString()} Arena Coins here`;
    }
    if (localText !== "" && localCoins > 0) {
      return `${localCoins.toLocaleString()} Arena Coins = ₹${inrOff.toLocaleString("en-IN", {
        maximumFractionDigits: 2,
        minimumFractionDigits: 2,
      })} off`;
    }
    if (localText === "0" || localCoins === 0) {
      return "Pay the full amount without Arena Coins";
    }
    return `Use up to ${maxCoins.toLocaleString()} Arena Coins`;
  })();

  // Physical keyboard support while the modal is open.
  useEffect(() => {
    if (!open) return;

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
        const coins = localCoinsRef.current;
        if (coins <= maxCoins) onConfirm(coins);
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
  }, [open, maxCoins, onClose, onConfirm, handleKeypadPress]);

  if (!open) return null;

  const handleUseMax = () => {
    setLocalCoins(maxCoins);
    setLocalText(String(maxCoins));
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
        {/* Header */}
        <div className="flex items-center justify-between">
          <span className="text-white text-base font-extrabold">Arena Coins to use</span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleUseMax}
              className="text-[11px] bg-white/5 border border-white/10 px-3 py-1.5 rounded-[8px] text-white/90 font-bold hover:bg-white/10 active:scale-95 transition"
            >
              Use max
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-full bg-white/5 border border-white/10 text-white/50 hover:text-white hover:bg-white/10 active:scale-95 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Display Center Area */}
        <div className="flex flex-col items-center justify-center gap-1.5 py-2 select-none">
          <div className="flex items-center gap-2">
            <Image src={coinImg} alt="Arena Coin" width={32} height={32} />
            <span className="text-4xl font-extrabold text-[#F5A623] tabular-nums flex items-center">
              {localCoins.toLocaleString()}
              <span
                className="inline-block w-[2px] h-10 bg-[#F5A623] ml-1"
                style={{ animation: "blink-caret 1s step-end infinite" }}
              />
            </span>
          </div>
          <span
            className={`text-xs font-semibold ${
              hasError ? "text-red-400" : "text-white/40"
            }`}
          >
            {footerMessage}
          </span>
        </div>

        {/* Custom Numeric Keypad */}
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

        <SlantedButton
          type="button"
          onClick={() => onConfirm(localCoins)}
          disabled={hasError || localText === ""}
          className="w-full h-12 uppercase text-xs"
        >
          Apply
        </SlantedButton>
      </div>
    </div>
  );
}
