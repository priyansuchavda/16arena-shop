"use client";

import { MobileCategoryStrip } from "./mobile-category-strip";
import { ArenaLogo } from "@/shared/components/arena-logo";
import { WalletCoinChip } from "./wallet-coin-chip";
import { ProfileChip } from "./profile-chip";
import { SearchIcon } from "@/shared/components/icons";
import { CategoryItem, ApiProduct } from "@/features/shop/types/shop.types";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { X, ChevronRight } from "lucide-react";
import { shopApi } from "../services/shop-api";
import { useUserSummary, useAuthStore } from "@/features/auth";
import { AuthModal } from "./auth-modal";
import { RegisterModal } from "./register-modal";

interface SearchItem {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  categoryName: string;
  discountText: string;
}

function ShopTopBar({
  walletBalance,
  onSelectAll,
  searchQuery,
  onSearchChange,
}: {
  walletBalance: number;
  onSelectAll?: () => void;
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
}) {
  const { data: userSummary } = useUserSummary();
  const coins = userSummary?.arenaCoins ?? walletBalance;
  const router = useRouter();

  const [localQuery, setLocalQuery] = useState(searchQuery ?? "");
  const [searchResults, setSearchResults] = useState<SearchItem[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [isDropdownVisible, setIsDropdownVisible] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setLocalQuery(searchQuery ?? "");
  }, [searchQuery]);

  // Click outside detection
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownVisible(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Escape key detection
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsDropdownVisible(false);
        inputRef.current?.blur();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  // Debounced search logic for live & static products
  useEffect(() => {
    if (onSearchChange) {
      return;
    }

    const trimmed = localQuery.trim();
    if (!trimmed) {
      setSearchResults([]);
      setSearchLoading(false);
      return;
    }

    setSearchLoading(true);
    const delayDebounceFn = setTimeout(async () => {
      try {
        const liveProducts = await shopApi.searchProducts(trimmed);

        const combined: SearchItem[] = [];
        const seenSlugs = new Set<string>();

        // Add live items
        liveProducts.forEach((p) => {
          const save = Math.round(p.savingsPercent ?? p.maxSavingsPercent ?? 0);
          const discountText = save > 0 
            ? `${save}% off` 
            : p.cashbackPercent 
              ? `${p.cashbackPercent}% cashback` 
              : "";
          seenSlugs.add(p.slug);
          combined.push({
            id: p.id,
            name: p.brandName || p.name,
            slug: p.slug,
            logoUrl: p.logoUrl || p.heroImageUrl,
            categoryName: p.categoryName || "Gift Card",
            discountText,
          });
        });

        setSearchResults(combined);
      } catch (err) {
        console.error("Search error", err);
      } finally {
        setSearchLoading(false);
      }
    }, 150); // Responsive 150ms debounce

    return () => clearTimeout(delayDebounceFn);
  }, [localQuery]);

  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setLocalQuery(val);
    setIsDropdownVisible(true);
    if (onSearchChange) {
      onSearchChange(val);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsDropdownVisible(false);
    inputRef.current?.blur();
    
    if (onSearchChange) {
      // Already on page with search change handler (catalog page)
      return;
    }
    if (localQuery.trim()) {
      router.push(`/shop?q=${encodeURIComponent(localQuery.trim())}`);
    } else {
      router.push("/");
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setLocalQuery("");
    setSearchResults([]);
    setIsDropdownVisible(false);
    if (onSearchChange) {
      onSearchChange("");
    }
    inputRef.current?.focus();
  };

  const handleItemClick = (slug: string) => {
    setIsDropdownVisible(false);
    setLocalQuery("");
    router.push(`/shop/${slug}`);
  };

  const getInitialsGradient = (name: string) => {
    const hash = name.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const colors = [
      ["from-[#FF7A1A]", "to-[#7a3408]"],
      ["from-[#2874F0]", "to-[#123a85]"],
      ["from-[#1DB954]", "to-[#0c5226]"],
      ["from-[#E23744]", "to-[#7a141d]"],
      ["from-[#7c3aed]", "to-[#3a1a78]"],
      ["from-[#0ea5e9]", "to-[#075985]"],
      ["from-[#f59e0b]", "to-[#7c5208]"],
      ["from-[#ec4899]", "to-[#7a1f4d]"],
    ];
    const pair = colors[hash % colors.length];
    return `bg-gradient-to-br ${pair[0]} ${pair[1]}`;
  };

  return (
    <div
      className="sticky top-0 z-40 shrink-0 px-5 pb-7 pt-5 lg:px-10 lg:pt-7"
      style={{
        background:
          "linear-gradient(to bottom, var(--void) 0%, var(--void) 34%, color-mix(in srgb, var(--void) 92%, transparent) 55%, color-mix(in srgb, var(--void) 62%, transparent) 73%, color-mix(in srgb, var(--void) 26%, transparent) 89%, transparent 100%)",
      }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 backdrop-blur-md"
        style={{
          WebkitMaskImage:
            "linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0.98) 30%, rgba(0,0,0,0.84) 52%, rgba(0,0,0,0.52) 70%, rgba(0,0,0,0.22) 86%, rgba(0,0,0,0) 100%)",
          maskImage:
            "linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0.98) 30%, rgba(0,0,0,0.84) 52%, rgba(0,0,0,0.52) 70%, rgba(0,0,0,0.22) 86%, rgba(0,0,0,0) 100%)",
        }}
      />
      <div className="relative z-10 shop-content-width flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Logo and Mobile Header Row */}
        <div className="flex w-full lg:w-auto items-center justify-between lg:flex-1 shrink-0">
          <ArenaLogo className="shrink-0 cursor-pointer" height={28} onClick={onSelectAll} />
          
          {/* Mobile Right Section: Coins & Profile */}
          <div className="flex lg:hidden items-center gap-2.5 shrink-0">
            <WalletCoinChip balance={coins} />
            <ProfileChip />
          </div>
        </div>

        {/* Middle Section: Centered Search Bar */}
        <div ref={dropdownRef} className="relative w-full lg:max-w-[600px] lg:mx-0">
          <form onSubmit={handleSearchSubmit}>
            <label className="flex h-[52px] w-full items-center gap-3 rounded-[10px] border border-[var(--line)] bg-[var(--surface)] px-4 transition-colors hover:border-white focus-within:border-white focus-within:ring-1 focus-within:ring-white/15 cursor-text">
              <SearchIcon className="shrink-0 text-[var(--faint)]" />
              <input
                ref={inputRef}
                placeholder="Search for brands, categories & more....."
                value={localQuery}
                onChange={handleQueryChange}
                onFocus={() => setIsDropdownVisible(true)}
                className="min-w-0 flex-1 border-none bg-transparent text-sm text-[var(--ink)] placeholder:text-[var(--faint)]"
                style={{ outline: "none", boxShadow: "none" }}
              />
              {localQuery && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="shrink-0 rounded-full p-1 text-[var(--faint)] hover:text-white hover:bg-white/10 transition-colors"
                >
                  <X size={16} />
                </button>
              )}
            </label>
          </form>

          {/* Autocomplete Dropdown */}
          {!onSearchChange && isDropdownVisible && localQuery.trim().length >= 1 && (
            <div className="absolute top-[56px] left-0 w-full bg-[#121212] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50 max-h-[360px] overflow-y-auto backdrop-blur-md animate-fade-in">
              {searchLoading && searchResults.length === 0 ? (
                <div className="p-4 text-center text-sm text-white/40 flex items-center justify-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                  Searching...
                </div>
              ) : searchResults.length > 0 ? (
                searchResults.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleItemClick(item.slug)}
                    className="flex items-center justify-between p-3 hover:bg-white/5 cursor-pointer border-b border-white/5 last:border-b-0 transition-all duration-150"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 overflow-hidden border border-white/5 bg-[#222]">
                        {item.logoUrl ? (
                          <img src={item.logoUrl} alt={item.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className={`w-full h-full flex items-center justify-center text-white text-sm font-extrabold ${getInitialsGradient(item.name)}`}>
                            {item.name.charAt(0)}
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-white line-clamp-1">{item.name}</span>
                        {item.discountText && (
                          <span className="text-[11px] text-[#25C26E] font-extrabold mt-0.5">{item.discountText}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 text-[9px] font-extrabold rounded-full bg-white/10 text-white/60 uppercase tracking-wider">
                        {item.categoryName}
                      </span>
                      <ChevronRight size={14} className="text-white/40" />
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-4 text-center text-sm text-white/40">
                  No matching brands found
                </div>
              )}
            </div>
          )}
        </div>

        {/* Desktop Right Section: Coins, Profile */}
        <div className="hidden lg:flex lg:flex-1 justify-end items-center gap-2.5 shrink-0">
          <WalletCoinChip balance={coins} />
          <ProfileChip />
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
      <div
        className={["relative flex min-w-0 flex-1 flex-col overflow-x-clip", categoryMode && "shop-category-column"]
          .filter(Boolean)
          .join(" ")}
      >
        <ShopTopBar
          walletBalance={walletBalance}
          onSelectAll={onSelectAll}
          searchQuery={searchQuery}
          onSearchChange={onSearchChange}
        />

        <div
          className={["flex-1 pb-16", !categoryMode && "pt-4 lg:pt-6"].filter(Boolean).join(" ")}
        >
          {!hideSidebar && (
            <div
              className={[
                "shop-content-width px-5 py-1.5 lg:px-10",
                categoryMode ? "lg:hidden" : "hidden",
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
      <RegisterModal />
    </div>
  );
}
