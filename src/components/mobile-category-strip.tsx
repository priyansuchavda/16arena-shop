"use client";

import type { CategoryItem } from "@/lib/api";
import { CategoryNavIcon } from "@/components/category-nav-icon";

type MobileCategoryStripProps = {
  items: CategoryItem[];
  onSelectCategory?: (slug: string) => void;
};

export function MobileCategoryStrip({ items, onSelectCategory }: MobileCategoryStripProps) {
  return (
    <div className="shop-scroll -mx-1 mb-6 flex gap-4 overflow-x-auto px-1 lg:hidden">
      {items.map((c) => (
        <button
          key={c.slug}
          type="button"
          onClick={() => onSelectCategory?.(c.slug)}
          className="flex shrink-0 flex-col items-center gap-1.5"
        >
          <span
            className={[
              "flex h-9 w-9 items-center justify-center rounded-lg",
              c.active
                ? "ring-1 ring-[var(--flame)] shadow-[0_0_12px_rgba(254,131,33,0.35)]"
                : "",
            ].join(" ")}
          >
            <CategoryNavIcon slug={c.slug} label={c.label} active={c.active} size={30} />
          </span>
          <span
            className="max-w-[64px] truncate text-[10px] font-medium uppercase tracking-[0.04em]"
            style={{ color: c.active ? "#fff" : "var(--muted)" }}
          >
            {c.label}
          </span>
        </button>
      ))}
    </div>
  );
}
