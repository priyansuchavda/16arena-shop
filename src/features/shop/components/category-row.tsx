import { HudPanel } from "./hud";
import { BoltIcon } from "@/shared/components/icons";
import { rgba } from "../services/product.service";
import { CategoryItem } from "../types/shop.types";

export function CategoryRow({ items }: { items: CategoryItem[] }) {
  return (
    <div className="mt-7 flex flex-wrap gap-3">
      {items.map((c) => (
        <button key={c.label} className="group flex w-[112px] flex-col items-center gap-[10px]">
          <HudPanel
            cut={11}
            border={c.active ? "var(--flame)" : "var(--line)"}
            fill={c.active ? "linear-gradient(150deg,#FF9A3D,#E5550B)" : "var(--carbon)"}
            className="w-full transition-transform group-hover:-translate-y-[3px]"
            innerClassName="relative flex aspect-[1.25/1] items-center justify-center"
          >
            {c.badge && (
              <span className="font-data absolute right-[6px] top-[6px] rounded-[4px] bg-black/40 px-[5px] py-[2px] text-[9px] font-bold uppercase tracking-[0.06em] text-[var(--coin)]">
                {c.badge}
              </span>
            )}
            {c.active ? (
              <BoltIcon size={26} className="text-white" />
            ) : (
              <span
                className="h-[26px] w-[26px] transition-transform group-hover:scale-110"
                style={{
                  background: rgba(c.color, 0.95),
                  clipPath:
                    "polygon(5px 0,100% 0,100% calc(100% - 5px),calc(100% - 5px) 100%,0 100%,0 5px)",
                }}
              />
            )}
          </HudPanel>
          <span className="flex flex-col items-center gap-[2px]">
            <span
              className="font-data max-w-[108px] truncate text-[11px] font-medium uppercase tracking-[0.08em]"
              style={{ color: c.active ? "#fff" : "var(--muted)" }}
            >
              {c.label}
            </span>
            {c.count != null && (
              <span className="font-data text-[10px] text-[var(--faint)]">{c.count} items</span>
            )}
          </span>
        </button>
      ))}
    </div>
  );
}
