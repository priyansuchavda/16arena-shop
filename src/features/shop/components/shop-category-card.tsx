"use client";

import type { CSSProperties, ReactNode } from "react";

const REF_W = 80;

export type ShopCategoryCardProps = {
  label: string;
  icon: ReactNode;
  selected?: boolean;
  variant?: "category" | "viewAll";
  width?: number;
  height?: number;
  onClick?: () => void;
  className?: string;
  "aria-expanded"?: boolean;
  "aria-label"?: string;
};

export function ShopCategoryCard({
  label,
  icon,
  selected = false,
  variant = "category",
  width = 81,
  height = 80,
  onClick,
  className = "",
  "aria-expanded": ariaExpanded,
  "aria-label": ariaLabel,
}: ShopCategoryCardProps) {
  const s = width / REF_W;
  const isViewAll = variant === "viewAll";

  const backW = width * 0.65;
  const backH = width * (11 / REF_W);
  const thinW = width * (44 / REF_W);
  const thinH = width * (3 / REF_W);

  const ellipseColor = selected ? "#FF973C" : undefined;
  const backColor = ellipseColor ?? "#B5B5B5";
  const thinColor = ellipseColor ?? "#DDDDDD";

  const outerStyle: CSSProperties = {
    width,
    height,
    borderRadius: 9 * s,
    background: selected
      ? "radial-gradient(circle at 50% 68%, rgba(255,106,0,0.6) 0%, #6B3018 52%, #3A1A0A 100%)"
      : "rgba(255,255,255,0.03)",
  };

  return (
    <button
      type="button"
      onClick={onClick}
      aria-expanded={ariaExpanded}
      aria-label={ariaLabel}
      className={[
        "group relative flex shrink-0 flex-col overflow-hidden border text-center transition-all duration-200 active:scale-95",
        isViewAll ? "justify-between" : "",
        selected ? "border-[#FF973C] shadow-[0_4px_12px_rgba(255,151,60,0.15)]" : "border-white/10 hover:brightness-110",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      style={outerStyle}
    >
      {isViewAll ? (
        <>
          <div className="relative flex flex-1 items-center justify-center pt-1.5">
            <span className="transition-transform duration-200 group-hover:scale-105">{icon}</span>
          </div>
          <div className="w-full bg-transparent py-1 text-[11px] font-bold tracking-wide text-white">
            {label}
          </div>
        </>
      ) : (
        <>
      {/* Icon area — clip ellipses here */}
      <div className="relative min-h-0 flex-1 overflow-hidden">
        {/* Back big ellipse (multi-pass blur) */}
        <div
          className="pointer-events-none absolute left-1/2"
          style={{
            width: backW,
            height: backH + 10 * s * 3,
            bottom: 0,
            transform: `translateX(-50%) translateY(${3 * s}px)`,
          }}
          aria-hidden
        >
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              bottom: 0,
              height: backH,
              borderRadius: "50%",
              background: backColor,
              filter: `blur(${8 * s}px)`,
              opacity: 0.9,
            }}
          />
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              bottom: 0,
              height: backH,
              borderRadius: "50%",
              background: backColor,
              filter: `blur(${14 * s}px)`,
              opacity: 0.5,
            }}
          />
        </div>

        {/* Thin divider ellipse */}
        <div
          className="pointer-events-none absolute left-1/2"
          style={{
            width: thinW,
            height: thinH,
            bottom: 0,
            transform: `translateX(-50%) translateY(${1 * s}px)`,
            borderRadius: "50%",
            background: thinColor,
            filter: `blur(${5 * s}px)`,
          }}
          aria-hidden
        />

        {/* Icon */}
        <div className="absolute inset-0 z-10 flex items-end justify-center pb-[1px]">
          <span className="transition-transform duration-200 group-hover:scale-105">{icon}</span>
        </div>
      </div>

      {/* Bottom label container */}
      <div
        style={{
          background: selected ? "transparent" : "rgba(255,255,255,0.03)",
          padding: `${3 * s}px ${2 * s}px ${4 * s}px`,
        }}
      >
        <p
          className="truncate text-center font-semibold text-white"
          style={{
            fontSize:
              label.length > 10 ? Math.max(7.5 * s, 7) : 9 * s,
            lineHeight: 1.2,
            letterSpacing: label.length > 10 ? "-0.02em" : "0.04em",
          }}
        >
          {label}
        </p>
      </div>
        </>
      )}
    </button>
  );
}
