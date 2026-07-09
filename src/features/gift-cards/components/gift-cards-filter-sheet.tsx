"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { SlantedButton } from "@/shared/components/ui/slanted-button";
import {
  DEFAULT_GIFT_CARD_FILTERS,
  STATUS_OPTIONS,
  TIME_PERIOD_OPTIONS,
  type GiftCardFilters,
  type GiftCardStatusFilter,
  type TimePeriodFilter,
} from "../utils/gift-card-filters";

type GiftCardsFilterSheetProps = {
  open: boolean;
  onClose: () => void;
  categories: string[];
  filters: GiftCardFilters;
  onApply: (filters: GiftCardFilters) => void;
  statusCounts: { active: number; expired: number };
};

export function GiftCardsFilterSheet({
  open,
  onClose,
  categories,
  filters,
  onApply,
  statusCounts,
}: GiftCardsFilterSheetProps) {
  const [draft, setDraft] = useState<GiftCardFilters>(filters);

  useEffect(() => {
    if (open) setDraft(filters);
  }, [open, filters]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  const toggleCategory = (category: string) => {
    setDraft((prev) => {
      const selected = prev.categories.includes(category);
      return {
        ...prev,
        categories: selected
          ? prev.categories.filter((c) => c !== category)
          : [...prev.categories, category],
      };
    });
  };

  const handleReset = () => {
    setDraft({
      ...DEFAULT_GIFT_CARD_FILTERS,
      searchQuery: filters.searchQuery,
    });
  };

  const handleApply = () => {
    onApply(draft);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[150] flex items-center justify-center bg-black/75 p-4 backdrop-blur-[4px] animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="flex h-[min(85vh,640px)] w-full max-w-[480px] flex-col overflow-hidden rounded-[20px] border border-white/10 bg-[#2C2C2C] p-6 shadow-2xl animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex shrink-0 items-center justify-between gap-3">
          <h2 className="font-heading text-base font-extrabold text-white">Filters</h2>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleReset}
              className="text-sm font-bold text-[var(--flame)] transition hover:opacity-80"
            >
              Reset
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-white/10 bg-white/5 p-1.5 text-white/50 transition hover:bg-white/10 hover:text-white active:scale-95"
              aria-label="Close filters"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="shop-popover-scroll min-h-0 flex-1 overflow-y-auto pr-2">
          <div className="pb-2">
          <p className="mb-3 text-sm font-bold text-white">Status</p>
          <div className="mb-6 flex flex-col">
            {STATUS_OPTIONS.map((option) => {
              const selected = draft.status === option.value;
              const count =
                option.value === "active" ? statusCounts.active : statusCounts.expired;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() =>
                    setDraft((prev) => ({
                      ...prev,
                      status: option.value as GiftCardStatusFilter,
                    }))
                  }
                  className="flex items-center justify-between border-b border-white/5 py-3.5 text-left transition hover:bg-white/[0.02]"
                >
                  <span
                    className={`text-sm ${
                      selected ? "font-bold text-white" : "font-medium text-white/50"
                    }`}
                  >
                    {option.label} - {count}
                  </span>
                  <span
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                      selected ? "border-[var(--flame)]" : "border-white/20"
                    }`}
                  >
                    {selected && <span className="h-2.5 w-2.5 rounded-full bg-[var(--flame)]" />}
                  </span>
                </button>
              );
            })}
          </div>

          <p className="mb-3 text-sm font-bold text-white">Time period</p>
          <div className="mb-6 flex flex-col">
            {TIME_PERIOD_OPTIONS.map((option) => {
              const selected = draft.timePeriod === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() =>
                    setDraft((prev) => ({ ...prev, timePeriod: option.value as TimePeriodFilter }))
                  }
                  className="flex items-center justify-between border-b border-white/5 py-3.5 text-left transition hover:bg-white/[0.02]"
                >
                  <span
                    className={`text-sm ${
                      selected ? "font-bold text-white" : "font-medium text-white/50"
                    }`}
                  >
                    {option.label}
                  </span>
                  <span
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                      selected ? "border-[var(--flame)]" : "border-white/20"
                    }`}
                  >
                    {selected && <span className="h-2.5 w-2.5 rounded-full bg-[var(--flame)]" />}
                  </span>
                </button>
              );
            })}
          </div>

          {categories.length > 0 && (
            <>
              <p className="mb-3 text-sm font-bold text-white">Category</p>
              <div className="flex flex-wrap gap-2 pb-4">
                {categories.map((category) => {
                  const selected = draft.categories.includes(category);
                  return (
                    <button
                      key={category}
                      type="button"
                      onClick={() => toggleCategory(category)}
                      className={`rounded-full border px-3.5 py-2 text-xs font-semibold transition ${
                        selected
                          ? "border-[var(--flame)] bg-[var(--flame)]/10 text-white"
                          : "border-white/10 bg-white/[0.03] text-white/80 hover:border-white/20"
                      }`}
                    >
                      {category}
                    </button>
                  );
                })}
              </div>
            </>
          )}
          </div>
        </div>

        <div className="mt-4 shrink-0 border-t border-white/5 bg-[#2C2C2C] pt-5">
          <SlantedButton
            type="button"
            onClick={handleApply}
            className="w-full h-12 uppercase text-xs"
          >
            Apply Filters
          </SlantedButton>
        </div>
      </div>
    </div>
  );
}
