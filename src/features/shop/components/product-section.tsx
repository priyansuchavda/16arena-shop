import { ProductCard } from "./product-card";
import { CardModel } from "@/features/shop/types/shop.types";

export function ProductSection({
  title,
  items,
  id,
}: {
  title: string;
  items: CardModel[];
  id?: string;
}) {
  if (items.length === 0) return null;
  return (
    <section id={id} className="mt-14 scroll-mt-24">
      <div className="mb-5 flex items-end justify-between">
        <div>
          <div className="eyebrow flex items-center gap-2">
            <span className="text-[var(--flame)]">▌</span>
            {items.length} drops
          </div>
          <h2 className="mt-2 text-[24px] font-extrabold tracking-[-0.01em] text-white">{title}</h2>
        </div>
        <span className="font-data inline-flex cursor-pointer items-center gap-1 rounded-[8px] border border-[var(--line)] px-3 py-[7px] text-[12px] font-medium uppercase tracking-[0.08em] text-[var(--muted)] transition-colors hover:border-[var(--flame)]/40 hover:text-[var(--flame)]">
          View all ›
        </span>
      </div>
      <div className="grid grid-cols-1 gap-[18px] sm:grid-cols-2 lg:grid-cols-4">
        {items.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </section>
  );
}
