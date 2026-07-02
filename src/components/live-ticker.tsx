import { tickerItems } from "@/lib/products";

export function LiveTicker() {
  // Doubled so the -50% marquee loops seamlessly.
  const items = [...tickerItems, ...tickerItems];
  return (
    <div className="border-b border-[var(--line)] bg-[var(--void)]/70">
      <div className="mx-auto flex max-w-[1240px] items-center gap-3 px-6">
        <span className="flex shrink-0 items-center gap-[7px] py-2 pr-3">
          <span className="ar-pulse h-[7px] w-[7px] rounded-full bg-[var(--win)] shadow-[0_0_8px_var(--win)]" />
          <span className="eyebrow text-[var(--win)]">Live</span>
        </span>
        <div className="relative flex-1 overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_6%,#000_94%,transparent)]">
          <div className="ar-marquee flex w-max gap-8 py-2 whitespace-nowrap will-change-transform">
            {items.map((t, i) => (
              <span key={i} className="font-data flex items-center gap-2 text-xs text-[var(--muted)]">
                <span className="text-[var(--flame)]">▸</span>
                {t}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
