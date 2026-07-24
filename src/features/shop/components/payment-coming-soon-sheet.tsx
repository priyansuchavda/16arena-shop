"use client";

import { Clock, X } from "lucide-react";
import { SlantedButton } from "@/shared/components/ui/slanted-button";

type PaymentComingSoonSheetProps = {
  open: boolean;
  onClose: () => void;
};

export function PaymentComingSoonSheet({ open, onClose }: PaymentComingSoonSheetProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[90] flex items-end justify-center bg-black/70 p-0 sm:items-center sm:p-4">
      <button
        type="button"
        className="absolute inset-0"
        aria-label="Close"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-md overflow-hidden rounded-t-3xl border border-white/10 bg-[#161616] shadow-2xl sm:rounded-3xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 z-20 rounded-full border border-white/10 bg-white/5 p-1.5 text-white/50 transition hover:bg-white/10 hover:text-white active:scale-95"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex flex-col items-center gap-5 px-6 pt-14 pb-8 text-center">
          <div className="flex h-[120px] w-[120px] items-center justify-center rounded-3xl bg-gradient-to-br from-[#ff973c]/20 to-[#ff6a00]/10 border border-[#ff973c]/20">
            <Clock size={56} strokeWidth={1.5} className="text-[var(--flame)]" />
          </div>

          <div className="flex flex-col gap-2">
            <h2 className="font-heading text-xl font-bold text-white">Payments Coming Soon</h2>
            <p className="max-w-xs text-sm leading-relaxed text-white/60">
              Online checkout is not available yet. We&apos;re working on bringing secure payments
              to the Arena Shop — stay tuned!
            </p>
          </div>

          <SlantedButton
            type="button"
            onClick={onClose}
            className="mt-2 w-full h-12 uppercase text-xs"
          >
            Got it
          </SlantedButton>
        </div>
      </div>
    </div>
  );
}
