"use client";

import {
  useState,
  useEffect,
  useLayoutEffect,
  useRef,
  useCallback,
} from "react";
import Image from "next/image";
import coinImg from "@/assets/png/coin.png";
import { formatInrBody } from "../utils/checkout.utils";

const ODOMETER_DIGIT_H = 32;
const ODOMETER_DIGIT_W = 20;
const ODOMETER_DURATION_MS = 720;
const SUFFIX_COLLAPSE_MS = 220;
const SUFFIX_EXPAND_MS = 680;
const EASE_IN_OUT_CUBIC = "cubic-bezier(0.65, 0, 0.35, 1)";
const EASE_OUT_CUBIC = "cubic-bezier(0.33, 1, 0.68, 1)";

type OdometerCell =
  | { kind: "digit"; from: number; to: number; id: string }
  | { kind: "char"; ch: string; id: string };

/** Build odometer cells: variable int digits, en-IN commas, no leading zeros, ≤2 fraction digits. */
function buildOdometerCells(fromVal: number, toVal: number): OdometerCell[] {
  const fromStr = formatInrBody(fromVal);
  const toStr = formatInrBody(toVal);

  const [fromIntFmt = "0", fromFrac = ""] = fromStr.split(".");
  const [toIntFmt = "0", toFrac = ""] = toStr.split(".");

  const fromIntDigits = fromIntFmt.replace(/\D/g, "").split("").map(Number);
  const toIntDigits = toIntFmt.replace(/\D/g, "").split("").map(Number);
  // Always at least one integer digit (0.5 → 0.5).
  if (toIntDigits.length === 0) toIntDigits.push(0);

  const intLen = toIntDigits.length;
  const fromAligned = Array.from({ length: intLen }, (_, i) => {
    const fromIdx = i - (intLen - fromIntDigits.length);
    return fromIdx >= 0 ? (fromIntDigits[fromIdx] ?? 0) : 0;
  });

  const cells: OdometerCell[] = [];
  let digitIdx = 0;
  for (let i = 0; i < toIntFmt.length; i++) {
    const ch = toIntFmt[i]!;
    if (ch >= "0" && ch <= "9") {
      cells.push({
        kind: "digit",
        from: fromAligned[digitIdx] ?? 0,
        to: toIntDigits[digitIdx] ?? 0,
        // Stable id from the right so length changes don't remount wrong wheels.
        id: `i-${intLen - 1 - digitIdx}`,
      });
      digitIdx++;
    } else {
      cells.push({ kind: "char", ch, id: `sep-${i}-${ch}` });
    }
  }

  if (toFrac.length > 0) {
    cells.push({ kind: "char", ch: ".", id: "dot" });
    const fromFracDigits = fromFrac.split("").map(Number);
    for (let i = 0; i < toFrac.length; i++) {
      cells.push({
        kind: "digit",
        from: fromFracDigits[i] ?? 0,
        to: Number(toFrac[i]) || 0,
        id: `f-${i}`,
      });
    }
  }

  return cells;
}

/** Single digit wheel — rolls vertically from `from` → `to`. */
function OdometerDigit({
  from,
  to,
  animKey,
  duration = ODOMETER_DURATION_MS,
  digitH = ODOMETER_DIGIT_H,
  digitW = ODOMETER_DIGIT_W,
  className = "text-white",
  fontClassName = "text-[32px] font-bold",
}: {
  from: number;
  to: number;
  animKey: number;
  duration?: number;
  digitH?: number;
  digitW?: number;
  className?: string;
  fontClassName?: string;
}) {
  const stripRef = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    const el = stripRef.current;
    if (!el) return;

    // Initial mount: snap to current digit, no animation.
    if (animKey === 0) {
      el.style.transition = "none";
      el.style.transform = `translateY(${-to * digitH}px)`;
      return;
    }

    // Imperative transform so parent re-renders don't clobber the roll.
    el.style.transition = "none";
    el.style.transform = `translateY(${-from * digitH}px)`;
    void el.offsetHeight;
    el.style.transition = `transform ${duration}ms ${EASE_IN_OUT_CUBIC}`;
    el.style.transform = `translateY(${-to * digitH}px)`;
  }, [animKey, from, to, duration, digitH]);

  return (
    <span
      className="relative inline-block overflow-hidden align-bottom"
      style={{ width: digitW, height: digitH }}
    >
      <span
        ref={stripRef}
        className={`absolute left-0 top-0 flex flex-col ${className}`}
      >
        {Array.from({ length: 10 }, (_, d) => (
          <span
            key={d}
            className={`flex shrink-0 items-center justify-center leading-none tabular-nums ${fontClassName}`}
            style={{ width: digitW, height: digitH }}
          >
            {d}
          </span>
        ))}
      </span>
    </span>
  );
}

/**
 * Odometer / slot-machine roll for a numeric amount.
 * Tracks its own previous value so the parent only passes the current number.
 */
export function OdometerNumber({
  value,
  duration = ODOMETER_DURATION_MS,
  className = "text-white",
  digitH = ODOMETER_DIGIT_H,
  digitW = ODOMETER_DIGIT_W,
  fontClassName = "text-[32px] font-bold",
}: {
  value: number;
  duration?: number;
  className?: string;
  digitH?: number;
  digitW?: number;
  fontClassName?: string;
}) {
  const displayRef = useRef(value);
  const [from, setFrom] = useState(value);
  const [to, setTo] = useState(value);
  const [animKey, setAnimKey] = useState(0);

  useEffect(() => {
    if (value === displayRef.current) return;
    setFrom(displayRef.current);
    setTo(value);
    displayRef.current = value;
    setAnimKey((k) => k + 1);
  }, [value]);

  const cells = buildOdometerCells(from, to);

  return (
    <span className="inline-flex items-center tabular-nums" style={{ height: digitH }}>
      {cells.map((cell) => {
        if (cell.kind === "char") {
          return (
            <span
              key={cell.id}
              className={`inline-flex items-end justify-center leading-none ${fontClassName} ${className}`}
              style={{
                width: cell.ch === "," ? Math.max(6, digitW * 0.4) : Math.max(8, digitW / 2),
                height: digitH,
              }}
            >
              {cell.ch}
            </span>
          );
        }
        return (
          <OdometerDigit
            key={cell.id}
            from={cell.from}
            to={cell.to}
            animKey={animKey}
            duration={duration}
            digitH={digitH}
            digitW={digitW}
            className={className}
            fontClassName={fontClassName}
          />
        );
      })}
    </span>
  );
}

function sameCash(a: number, b: number) {
  return Math.round(a * 100) === Math.round(b * 100);
}

/**
 * ₹ + coins row: collapse suffix → roll cash → expand suffix + update coins.
 */
export function PricingSplitAmountRow({
  cash,
  coins,
}: {
  cash: number;
  coins: number;
}) {
  const [shownCash, setShownCash] = useState(cash);
  const [shownCoins, setShownCoins] = useState(coins);
  const [suffixVisible, setSuffixVisible] = useState(coins > 0);

  const suffixMeasureRef = useRef<HTMLDivElement>(null);
  const suffixClipRef = useRef<HTMLDivElement>(null);
  const pendingRef = useRef({ cash, coins });
  const shownRef = useRef({ cash, coins });
  const busyRef = useRef(false);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearTimers = useCallback(() => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  }, []);

  const wait = useCallback((ms: number) => {
    return new Promise<void>((resolve) => {
      const id = setTimeout(resolve, ms);
      timersRef.current.push(id);
    });
  }, []);

  const measureSuffix = useCallback(() => {
    return suffixMeasureRef.current?.scrollWidth ?? 0;
  }, []);

  const setClipWidth = useCallback((width: number, transition: string) => {
    const el = suffixClipRef.current;
    if (!el) return;
    el.style.transition = transition;
    el.style.width = `${Math.max(0, width)}px`;
  }, []);

  // Initial layout: open at natural width when coins are present.
  useEffect(() => {
    const el = suffixClipRef.current;
    if (!el) return;
    if (coins > 0) {
      el.style.width = `${measureSuffix()}px`;
      el.style.transition = "none";
    } else {
      el.style.width = "0px";
      el.style.transition = "none";
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const runSequence = useCallback(async () => {
    if (busyRef.current) return;
    busyRef.current = true;

    try {
      // Drain any updates that arrive mid-flight by looping.
      // eslint-disable-next-line no-constant-condition
      while (true) {
        const target = pendingRef.current;
        const prev = shownRef.current;
        if (sameCash(target.cash, prev.cash) && target.coins === prev.coins) break;

        const hadSuffix = prev.coins > 0;
        const willHaveSuffix = target.coins > 0;

        // --- Collapse (~220ms) ---
        if (hadSuffix) {
          const fullW = measureSuffix();
          setClipWidth(fullW, "none");
          void suffixClipRef.current?.offsetWidth;
          setSuffixVisible(false);
          setClipWidth(0, `width ${SUFFIX_COLLAPSE_MS}ms ${EASE_IN_OUT_CUBIC}`);
          await wait(SUFFIX_COLLAPSE_MS);
        } else {
          setClipWidth(0, "none");
          setSuffixVisible(false);
        }

        // --- Cash rolls (suffix gone from layout) ---
        setShownCash(target.cash);
        shownRef.current = { ...shownRef.current, cash: target.cash };
        await wait(ODOMETER_DURATION_MS);

        // --- Expand (~680ms) + update coins ---
        if (willHaveSuffix) {
          setShownCoins(target.coins);
          shownRef.current = { cash: target.cash, coins: target.coins };

          await wait(32);
          const fullW = measureSuffix();
          setClipWidth(0, "none");
          void suffixClipRef.current?.offsetWidth;

          // 0–55%: width grows
          const widthMs = Math.round(SUFFIX_EXPAND_MS * 0.55);
          setClipWidth(fullW, `width ${widthMs}ms ${EASE_IN_OUT_CUBIC}`);

          // 40–100%: fade + slide in
          const fadeDelay = Math.round(SUFFIX_EXPAND_MS * 0.4);
          const fadeId = setTimeout(() => setSuffixVisible(true), fadeDelay);
          timersRef.current.push(fadeId);

          await wait(SUFFIX_EXPAND_MS);
          setClipWidth(fullW, "none");
        } else {
          shownRef.current = { cash: target.cash, coins: 0 };
          setShownCoins(0);
        }

        if (
          sameCash(pendingRef.current.cash, shownRef.current.cash) &&
          pendingRef.current.coins === shownRef.current.coins
        ) {
          break;
        }
      }
    } finally {
      busyRef.current = false;
    }
  }, [measureSuffix, setClipWidth, wait]);

  useEffect(() => {
    pendingRef.current = { cash, coins };
    if (sameCash(cash, shownRef.current.cash) && coins === shownRef.current.coins) return;
    void runSequence();
  }, [cash, coins, runSequence]);

  useEffect(() => () => clearTimers(), [clearTimers]);

  const fadeMs = Math.round(SUFFIX_EXPAND_MS * 0.6);

  return (
    <div className="flex items-center gap-1.5 font-sans">
      <span className="text-[32px] font-bold text-white tracking-tight leading-none">₹</span>
      <OdometerNumber value={shownCash} />

      {/* Suffix: + · coin icon · coin amount — widthFactor collapse/expand */}
      <div
        ref={suffixClipRef}
        className="overflow-hidden"
        style={{
          width: 0,
          opacity: suffixVisible ? 1 : 0,
          transform: suffixVisible ? "translateX(0)" : "translateX(-10px)",
          transition: suffixVisible
            ? `opacity ${fadeMs}ms ${EASE_OUT_CUBIC}, transform ${fadeMs}ms ${EASE_OUT_CUBIC}`
            : `opacity ${SUFFIX_COLLAPSE_MS}ms ${EASE_IN_OUT_CUBIC}, transform ${SUFFIX_COLLAPSE_MS}ms ${EASE_IN_OUT_CUBIC}`,
          pointerEvents: suffixVisible ? "auto" : "none",
        }}
      >
        <div
          ref={suffixMeasureRef}
          className="flex w-max items-center gap-1.5 whitespace-nowrap pl-1.5"
        >
          <span className="text-xl font-bold text-white leading-none px-0.5">+</span>
          <Image src={coinImg} alt="" width={18} height={18} className="object-contain shrink-0" />
          <span className="text-2xl font-bold text-[#F5A623] leading-none tabular-nums">
            {shownCoins.toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
}
