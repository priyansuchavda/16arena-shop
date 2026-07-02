import Link from "next/link";
import { ArenaCoin } from "./arena-coin";
import { BellIcon, CartIcon, ChevronDownIcon, SearchIcon } from "./icons";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-[var(--line)] bg-[var(--void)]/85 backdrop-blur-xl">
      <div className="mx-auto flex max-w-[1240px] items-center gap-4 px-6 py-3">
        <Link href="/" className="group flex shrink-0 items-center gap-[10px]">
          <span
            className="font-heading flex h-[34px] w-[34px] items-center justify-center text-sm font-extrabold text-[#1c1304] shadow-[0_5px_18px_-5px_rgba(255,122,0,0.8)] transition-transform group-hover:scale-105"
            style={{
              background: "linear-gradient(140deg,#FF9A3D,#FF4400)",
              clipPath: "polygon(7px 0,100% 0,100% calc(100% - 7px),calc(100% - 7px) 100%,0 100%,0 7px)",
            }}
          >
            16
          </span>
          <span className="font-heading text-lg font-extrabold tracking-[0.04em] text-white">
            ARENA
          </span>
        </Link>

        <label className="flex h-[42px] max-w-[520px] flex-1 items-center gap-[10px] rounded-[11px] border border-[var(--line)] bg-[var(--carbon)] px-[14px] transition-colors focus-within:border-[var(--ice)]/50">
          <SearchIcon className="text-[var(--faint)]" />
          <input
            placeholder="Search brands, games, drops…"
            className="flex-1 border-none bg-transparent text-sm text-[var(--ink)] outline-none placeholder:text-[var(--faint)]"
          />
          <kbd className="font-data hidden rounded-[5px] border border-[var(--line)] px-[6px] py-[2px] text-[10px] text-[var(--faint)] sm:block">
            /
          </kbd>
        </label>

        <div className="flex-1" />

        <div className="flex h-10 shrink-0 items-center gap-2 rounded-[11px] border border-[var(--coin)]/30 bg-gradient-to-br from-[var(--coin)]/[0.14] to-[var(--flame)]/[0.05] px-[13px]">
          <ArenaCoin value={2500} size={17} />
        </div>

        <button
          aria-label="Cart"
          className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-[11px] border border-[var(--line)] bg-[var(--carbon)] text-[var(--muted)] transition-colors hover:border-[var(--flame)]/50 hover:text-white"
        >
          <CartIcon />
        </button>

        <button
          aria-label="Notifications"
          className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-[11px] border border-[var(--line)] bg-[var(--carbon)] text-[var(--muted)] transition-colors hover:border-[var(--flame)]/50 hover:text-white"
        >
          <BellIcon />
          <span className="absolute right-[10px] top-[9px] h-[6px] w-[6px] rounded-full bg-[var(--flame)] shadow-[0_0_6px_var(--flame)]" />
        </button>

        <button className="flex shrink-0 items-center gap-[9px] rounded-[11px] border border-[var(--line)] bg-[var(--carbon)] py-1 pl-1 pr-[10px] transition-colors hover:border-[var(--flame)]/50">
          <span className="font-heading flex h-[30px] w-[30px] items-center justify-center rounded-[8px] bg-gradient-to-br from-[#FF9A3D] to-[#C8410E] text-xs font-extrabold text-white">
            DH
          </span>
          <span className="flex flex-col items-start leading-none">
            <span className="text-[13px] font-bold text-[var(--ink)]">DHRUV46</span>
            <span className="font-data text-[10px] text-[var(--faint)]">Diamond III</span>
          </span>
          <ChevronDownIcon className="ml-1 text-[var(--faint)]" />
        </button>
      </div>
    </header>
  );
}
