"use client";

import { ShopSidebar } from "./shop-sidebar";
import { MobileCategoryStrip } from "./mobile-category-strip";
import { ArenaLogo } from "@/shared/components/arena-logo";
import { WalletCoinChip } from "./wallet-coin-chip";
import { ProfileChip } from "./profile-chip";
import { SearchIcon } from "@/shared/components/icons";
import { CategoryItem } from "@/features/shop/types/shop.types";

import { useUserSummary, useAuthStore } from "@/features/auth";
import { AuthModal } from "./auth-modal";

function TopBar({
  walletBalance,
  searchQuery,
  onSearchChange,
}: {
  walletBalance: number;
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
}) {
  const { data: userSummary } = useUserSummary();
  const coins = userSummary?.arenaCoins ?? walletBalance;

  return (
    <div className="flex w-full min-w-0 items-center gap-4">
      <label className="shop-pill flex h-[52px] min-w-0 flex-1 items-center gap-3 border border-[var(--line)] bg-[var(--surface)] px-4 transition-colors hover:border-white focus-within:border-white focus-within:ring-1 focus-within:ring-white/15 lg:w-[800px] lg:max-w-[800px] lg:flex-none">
        <SearchIcon className="shrink-0 text-[var(--faint)]" />
        <input
          placeholder="Search for a brand or gift card"
          value={searchQuery ?? ""}
          onChange={(e) => onSearchChange?.(e.target.value)}
          className="min-w-0 flex-1 border-none bg-transparent text-sm text-[var(--ink)] placeholder:text-[var(--faint)]"
          style={{ outline: "none", boxShadow: "none" }}
        />
      </label>

      <div className="hidden flex-1 lg:block" aria-hidden />

      <div className="flex shrink-0 items-center gap-2.5">
        <WalletCoinChip balance={coins} />
        <ProfileChip />
      </div>
    </div>
  );
}

function ShopTopBar({
  walletBalance,
  onSelectAll,
  categoryMode = false,
  searchQuery,
  onSearchChange,
}: {
  walletBalance: number;
  onSelectAll?: () => void;
  categoryMode?: boolean;
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
}) {
  return (
    <div
      className={[
        "sticky top-0 z-40 shrink-0 px-5 pb-2 pt-5 lg:px-10 lg:pt-7",
        categoryMode ? "bg-transparent" : "bg-transparent backdrop-blur-[2px]",
      ].join(" ")}
    >
      <div className="shop-content-width flex items-center gap-4">
        <ArenaLogo className="shrink-0 lg:hidden" height={28} onClick={onSelectAll} />
        <div className="min-w-0 flex-1">
          <TopBar
            walletBalance={walletBalance}
            searchQuery={searchQuery}
            onSearchChange={onSearchChange}
          />
        </div>
      </div>
    </div>
  );
}

export function ShopLayout({
  categories,
  children,
  walletBalance = 0,
  categoryMode = false,
  hideSidebar = false,
  onSelectCategory,
  onSelectAll,
  searchQuery,
  onSearchChange,
}: {
  categories: CategoryItem[];
  children: React.ReactNode;
  walletBalance?: number;
  categoryMode?: boolean;
  hideSidebar?: boolean;
  onSelectCategory?: (slug: string) => void;
  onSelectAll?: () => void;
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
}) {
  const isAuthModalOpen = useAuthStore((state) => state.isAuthModalOpen);
  const closeAuthModal = useAuthStore((state) => state.closeAuthModal);

  return (
    <div className="flex min-h-screen">
      <aside className="sticky top-0 hidden h-screen w-[200px] shrink-0 flex-col pl-5 pr-4 pt-7 lg:flex">
        <div className="mb-2 mt-1.5 shrink-0">
          <ArenaLogo height={30} onClick={onSelectAll} />
        </div>
        {!hideSidebar && <ShopSidebar items={categories} onSelectCategory={onSelectCategory} />}
      </aside>

      <div
        className={["relative flex min-w-0 flex-1 flex-col overflow-x-clip", categoryMode && "shop-category-column"]
          .filter(Boolean)
          .join(" ")}
      >
        <ShopTopBar
          walletBalance={walletBalance}
          onSelectAll={onSelectAll}
          categoryMode={categoryMode}
          searchQuery={searchQuery}
          onSearchChange={onSearchChange}
        />

        <div
          className={["flex-1 pb-16", !categoryMode && "pt-4 lg:pt-6"].filter(Boolean).join(" ")}
        >
          {!hideSidebar && (
            <div
              className={[
                "shop-content-width px-5 lg:px-10",
                categoryMode && "lg:hidden",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              <MobileCategoryStrip items={categories} onSelectCategory={onSelectCategory} />
            </div>
          )}

          {categoryMode ? (
            children
          ) : (
            <div className="px-5 lg:px-10">
              <main className="shop-content-width">{children}</main>
            </div>
          )}
        </div>
      </div>
      <AuthModal isOpen={isAuthModalOpen} onClose={closeAuthModal} />
    </div>
  );
}
