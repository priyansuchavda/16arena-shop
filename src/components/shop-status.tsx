import { SHOP_API_BASE } from "@/lib/api";

export function ShopStatus({ live }: { live: boolean }) {
  const host = SHOP_API_BASE.replace(/^https?:\/\//, "").replace(/\/api.*$/, "");
  return (
    <div className="mb-6 flex items-center gap-[9px]">
      <span
        className="ar-pulse h-[7px] w-[7px] rounded-full"
        style={{
          background: live ? "var(--win)" : "var(--coin)",
          boxShadow: `0 0 8px ${live ? "var(--win)" : "var(--coin)"}`,
        }}
      />
      <span className="eyebrow">
        {live ? `Live · ${host}` : "Sample data · API unreachable"}
      </span>
    </div>
  );
}
