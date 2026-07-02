"use client";

import type { CategoryItem } from "@/lib/api";
import { CategoryNavIcon } from "@/components/category-nav-icon";

/** Icon column width — aligns under the "16" mark in the logo. */
const ICON_COL = 46;

type ShopSidebarProps = {
  items: CategoryItem[];
  onSelectCategory?: (slug: string) => void;
};

export function ShopSidebar({ items, onSelectCategory }: ShopSidebarProps) {
  return (
    <aside className="flex flex-1 flex-col items-start gap-0.5 overflow-x-visible overflow-y-auto pb-6 pl-9">
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
              c.active
                ? "ring-1 ring-[var(--flame)] shadow-[0_0_14px_rgba(254,131,33,0.4)]"
                : "",
            ].join(" ")}
          >
            <span className="shop-sidebar-category-icon">
              <CategoryNavIcon slug={c.slug} label={c.label} active={c.active} size={40} />
            </span>
          </span>

          <span className="shop-sidebar-category-label w-max max-w-[120px] text-center text-[10px] font-medium uppercase leading-[1.25] tracking-[0.03em] text-white">
            {c.label}
            <span className="shop-sidebar-category-beam" aria-hidden />
          </span>
        </button>
      ))}
    </aside>
  );
}
