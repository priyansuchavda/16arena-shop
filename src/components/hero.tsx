import Link from "next/link";
import { ArenaCoin } from "./arena-coin";
import { HudPanel, CornerTicks } from "./hud";
import { ChevronRightIcon } from "./icons";

export function Hero() {
  return (
    <HudPanel
      cut={20}
      border="var(--line-2)"
      fill="var(--carbon)"
      className="relative"
      innerClassName="relative min-h-[360px] overflow-hidden"
    >
      {/* Ambient: drifting tactical grid + flame core + ice rim + scanline sheen */}
      <div className="tac-grid absolute inset-0 opacity-50 [animation:ar-drift_22s_linear_infinite]" />
      <div className="absolute -right-[6%] top-1/2 h-[460px] w-[460px] -translate-y-1/2 rounded-full bg-[radial-gradient(circle_at_50%_50%,rgba(255,90,0,0.4),rgba(255,90,0,0)_62%)] blur-[2px]" />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--flame)]/70 to-transparent" />
      <CornerTicks color="var(--flame)" size={13} />

      <div className="relative grid items-center gap-8 p-9 sm:p-11 lg:grid-cols-[1.05fr_0.95fr]">
        {/* Thesis */}
        <div>
          <div className="ar-rise eyebrow flex items-center gap-[9px]" style={{ animationDelay: "40ms" }}>
            <span className="ar-pulse h-[7px] w-[7px] rounded-full bg-[var(--flame)] shadow-[0_0_8px_var(--flame)]" />
            Season 04 · Bonus Drop
          </div>
          <h1
            className="ar-rise mt-4 text-[44px] font-extrabold leading-[0.98] tracking-[-0.03em] text-white sm:text-[52px]"
            style={{ animationDelay: "100ms" }}
          >
            Top up.
            <br />
            Pay half.
            <br />
            <span className="bg-gradient-to-r from-[var(--coin)] to-[var(--flame)] bg-clip-text text-transparent">
              Keep the coins.
            </span>
          </h1>
          <p
            className="ar-rise mt-5 max-w-[420px] text-[15px] leading-[1.55] text-[var(--muted)]"
            style={{ animationDelay: "160ms" }}
          >
            Buy game credits and brand vouchers at up to 50% off — settle part in
            cash, part in Arena Coins, and earn coins back on every order.
          </p>

          <div className="ar-rise mt-7 flex flex-wrap items-center gap-3" style={{ animationDelay: "220ms" }}>
            <Link
              href="#top-deals"
              className="inline-flex h-[46px] items-center gap-2 rounded-[11px] bg-gradient-to-br from-[var(--coin)] via-[var(--flame)] to-[var(--flame-deep)] px-6 text-[15px] font-bold text-[#1c1304] shadow-[0_14px_30px_-10px_rgba(255,90,0,0.8)] transition hover:brightness-105 active:translate-y-px"
            >
              Browse drops
              <ChevronRightIcon />
            </Link>
            <button className="inline-flex h-[46px] items-center gap-2 rounded-[11px] border border-[var(--line-2)] bg-white/[0.03] px-5 text-[15px] font-semibold text-[var(--ink)] transition hover:border-[var(--ice)]/50 hover:bg-white/[0.06]">
              How coins work
            </button>
          </div>

          <div
            className="ar-rise font-data mt-7 flex flex-wrap gap-x-6 gap-y-2 text-[11px] uppercase tracking-[0.14em] text-[var(--faint)]"
            style={{ animationDelay: "280ms" }}
          >
            <span><span className="text-[var(--win)]">50%</span> off retail</span>
            <span><span className="text-[var(--ice)]">Instant</span> delivery</span>
            <span><span className="text-[var(--coin)]">2%</span> coins back</span>
          </div>
        </div>

        {/* Split-pay HUD module — the mechanic, shown live */}
        <div className="ar-rise" style={{ animationDelay: "340ms" }}>
          <HudPanel cut={14} border="var(--line-2)" fill="rgba(255,255,255,0.02)" className="relative">
            <div className="p-6 backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <span className="eyebrow">BGMI · 1,000 UC</span>
                <span className="font-data rounded-[5px] bg-[var(--win)]/[0.14] px-2 py-[3px] text-[11px] font-bold text-[var(--win)]">
                  −50%
                </span>
              </div>

              <div className="mt-4 flex items-end gap-3">
                <span className="text-[40px] font-extrabold leading-none tabular-nums text-white">₹500</span>
                <span className="mb-1 text-lg text-[var(--faint)]">+</span>
                <span className="mb-[2px]">
                  <ArenaCoin value={1000} size={26} />
                </span>
              </div>
              <div className="mt-1 text-xs text-[var(--faint)]">
                <span className="text-[var(--faint)] line-through">₹1,000</span> retail
              </div>

              {/* Coin-coverage meter */}
              <div className="mt-6">
                <div className="font-data mb-2 flex justify-between text-[11px] uppercase tracking-[0.12em] text-[var(--muted)]">
                  <span>Coins cover</span>
                  <span className="text-[var(--coin)]">50%</span>
                </div>
                <div className="h-[10px] overflow-hidden rounded-full bg-white/[0.06]">
                  <div
                    className="ar-meter h-full rounded-full bg-gradient-to-r from-[var(--coin)] to-[var(--flame)]"
                    style={{ ["--fill" as string]: "0.5", width: "100%" }}
                  />
                </div>
              </div>

              <div className="mt-5 flex items-center justify-between border-t border-[var(--line)] pt-4">
                <span className="text-[13px] text-[var(--muted)]">You earn back</span>
                <ArenaCoin value={20} size={15} />
              </div>
            </div>
          </HudPanel>
        </div>
      </div>
    </HudPanel>
  );
}
