export function SiteFooter() {
  const links = ["Help", "Wallet", "Terms", "Privacy"];
  return (
    <footer className="mt-8 border-t border-[var(--line)]">
      <div className="mx-auto flex max-w-[1240px] flex-wrap items-center justify-between gap-4 px-6 py-7">
        <div className="flex items-center gap-4">
          <span className="font-heading text-sm font-extrabold tracking-[0.04em] text-white">
            16ARENA
          </span>
          <span className="font-data flex items-center gap-[7px] text-[11px] uppercase tracking-[0.12em] text-[var(--muted)]">
            <span className="ar-pulse h-[6px] w-[6px] rounded-full bg-[var(--win)] shadow-[0_0_6px_var(--win)]" />
            All systems operational
          </span>
        </div>

        <div className="flex items-center gap-5">
          {links.map((l) => (
            <span
              key={l}
              className="font-data cursor-pointer text-[12px] uppercase tracking-[0.08em] text-[var(--muted)] transition-colors hover:text-[var(--ink)]"
            >
              {l}
            </span>
          ))}
        </div>
      </div>
      <div className="mx-auto max-w-[1240px] px-6 pb-7">
        <span className="font-data text-[11px] text-[var(--faint)]">
          © 2026 16Arena · The esports rewards marketplace
        </span>
      </div>
    </footer>
  );
}
