import Link from "next/link";
import { SearchIcon, UserIcon } from "./icons";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-[var(--line)] bg-[var(--void)]/90 backdrop-blur-xl">
      <div className="mx-auto flex max-w-[1280px] items-center gap-5 px-5 py-3.5 lg:px-8">
        <Link href="/" className="shrink-0">
          <span className="font-heading text-[22px] font-extrabold tracking-[0.06em] text-white">16ARENA</span>
        </Link>

        <label className="mx-auto flex h-[46px] w-full max-w-[560px] items-center gap-3 rounded-[10px] border border-[var(--line)] bg-[var(--surface)] px-4 transition-colors focus-within:border-[var(--flame)]/45">
          <SearchIcon className="shrink-0 text-[var(--faint)]" />
          <input
            placeholder="Search for a brand or gift card"
            className="flex-1 border-none bg-transparent text-sm text-[var(--ink)] placeholder:text-[var(--faint)]"
            style={{ outline: "none", boxShadow: "none" }}
          />
        </label>

        <Link
          href="/login"
          className="shop-pill inline-flex h-[42px] shrink-0 items-center gap-2 bg-[var(--flame)] px-5 text-sm font-bold text-[#0c0c0c] transition hover:brightness-110"
        >
          <UserIcon size={16} />
          <span className="hidden sm:inline">Get Started</span>
        </Link>
      </div>
    </header>
  );
}
