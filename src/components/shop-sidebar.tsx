"use client";

import { useEffect, useRef, useState } from "react";
import type { CategoryItem } from "@/lib/api";
import { CategoryNavIcon } from "@/components/category-nav-icon";

/** Icon column width — aligns under the "16" mark in the logo. */
const ICON_COL = 46;

type ShopSidebarProps = {
  items: CategoryItem[];
  onSelectCategory?: (slug: string) => void;
};

export function ShopSidebar({ items, onSelectCategory }: ShopSidebarProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeRect, setActiveRect] = useState<{ top: number; height: number } | null>(null);
  const [containerHeight, setContainerHeight] = useState(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const update = () => {
      setContainerHeight(container.scrollHeight);
      const activeEl = container.querySelector(".is-active") as HTMLElement;
      if (activeEl) {
        setActiveRect({
          top: activeEl.offsetTop,
          height: activeEl.offsetHeight,
        });
      } else {
        setActiveRect(null);
      }
    };

    update();
    const timer = setTimeout(update, 50); // wait for layout settle
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("resize", update);
      clearTimeout(timer);
    };
  }, [items]);

  const strokeColor = "var(--flame)";

  const activeIndex = items.findIndex((c) => c.active);
  const isFirst = activeIndex === 0;
  const isLast = activeIndex === items.length - 1;

  const H_LEAD = 24; // length of vertical lead-in/lead-out line
  const X_LEFT = 18;
  const X_RIGHT = 105;
  const R = 14;

  let pathD = "";
  if (activeRect) {
    const topPath = isFirst
      ? `M ${X_LEFT} ${activeRect.top} L ${X_RIGHT - R} ${activeRect.top}`
      : `M ${X_LEFT} ${activeRect.top - H_LEAD}
         L ${X_LEFT} ${activeRect.top - R}
         Q ${X_LEFT} ${activeRect.top} ${X_LEFT + R} ${activeRect.top}
         L ${X_RIGHT - R} ${activeRect.top}`;

    const midPath = `
      Q ${X_RIGHT} ${activeRect.top} ${X_RIGHT} ${activeRect.top + R}
      L ${X_RIGHT} ${activeRect.top + activeRect.height - R}
      Q ${X_RIGHT} ${activeRect.top + activeRect.height} ${X_RIGHT - R} ${activeRect.top + activeRect.height}`;

    const bottomPath = isLast
      ? `L ${X_LEFT} ${activeRect.top + activeRect.height}`
      : `L ${X_LEFT + R} ${activeRect.top + activeRect.height}
         Q ${X_LEFT} ${activeRect.top + activeRect.height} ${X_LEFT} ${activeRect.top + activeRect.height + R}
         L ${X_LEFT} ${activeRect.top + activeRect.height + H_LEAD}`;

    pathD = `${topPath}${midPath}${bottomPath}`;
  }

  const y1 = activeRect ? (isFirst ? activeRect.top : activeRect.top - H_LEAD) : 0;
  const y2 = activeRect ? (isLast ? activeRect.top + activeRect.height : activeRect.top + activeRect.height + H_LEAD) : 0;

  return (
    <aside
      ref={containerRef}
      className="relative flex flex-1 flex-col items-start gap-0.5 overflow-x-visible overflow-y-auto pt-6 pb-6 pl-9 w-full"
    >
      {/* Curved active indicator line */}
      {activeRect && (
        <svg
          className="absolute left-0 top-0 pointer-events-none"
          style={{
            width: "100%",
            height: containerHeight || "100%",
          }}
        >
          <defs>
            <linearGradient
              id="active-line-gradient"
              x1="0"
              y1={y1}
              x2="0"
              y2={y2}
              gradientUnits="userSpaceOnUse"
            >
              <stop offset="0%" stopColor={strokeColor} stopOpacity="0" />
              <stop offset="20%" stopColor={strokeColor} stopOpacity="1" />
              <stop offset="80%" stopColor={strokeColor} stopOpacity="1" />
              <stop offset="100%" stopColor={strokeColor} stopOpacity="0" />
            </linearGradient>
            <filter id="neon-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          {/* Soft background glow */}
          <path
            d={pathD}
            fill="none"
            stroke="url(#active-line-gradient)"
            strokeWidth={5}
            className="transition-all duration-300 ease-in-out opacity-25"
            filter="url(#neon-glow)"
          />
          {/* Sharp foreground line */}
          <path
            d={pathD}
            fill="none"
            stroke="url(#active-line-gradient)"
            strokeWidth={1.5}
            className="transition-all duration-300 ease-in-out opacity-85"
          />
        </svg>
      )}

      {items.map((c) => (
        <button
          key={c.slug}
          type="button"
          onClick={() => onSelectCategory?.(c.slug)}
          className={[
            "shop-sidebar-category group flex flex-col items-center gap-1.5 py-2.5",
            c.active ? "is-active" : "",
          ].join(" ")}
          style={{ width: ICON_COL }}
        >
          <span className="shop-sidebar-category-glow" aria-hidden />
          <span className="shop-sidebar-category-sparkle shop-sidebar-category-sparkle-a" aria-hidden />
          <span className="shop-sidebar-category-sparkle shop-sidebar-category-sparkle-b" aria-hidden />
          <span className="shop-sidebar-category-sparkle shop-sidebar-category-sparkle-c" aria-hidden />

          <span
            className={[
              "relative z-[1] flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-lg",
            ].join(" ")}
          >
            <span className="shop-sidebar-category-icon">
              <CategoryNavIcon slug={c.slug} label={c.label} active={c.active} size={40} />
            </span>
          </span>

          <span className="shop-sidebar-category-label w-max max-w-[120px] text-center text-[10px] font-medium leading-[1.25] tracking-[0.03em] text-white">
            {c.label}
            <span className="shop-sidebar-category-beam" aria-hidden />
          </span>
        </button>
      ))}
    </aside>
  );
}
