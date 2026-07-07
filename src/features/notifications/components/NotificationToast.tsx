"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Bell, X } from "lucide-react";
import { useNotificationStore } from "../store";

export function NotificationToast() {
  const toast = useNotificationStore((state) => state.toast);
  const dismissToast = useNotificationStore((state) => state.dismissToast);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => dismissToast(), 6000);
    return () => window.clearTimeout(timer);
  }, [toast, dismissToast]);

  if (!toast) return null;

  return (
    <div className="pointer-events-none fixed right-4 top-4 z-[100] w-[min(100vw-2rem,360px)] animate-in fade-in slide-in-from-top-2 duration-300">
      <div className="pointer-events-auto overflow-hidden rounded-2xl border border-[var(--line)] bg-[#141414] shadow-2xl shadow-black/50">
        <div className="flex items-start gap-3 p-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[var(--flame)]/30 bg-[var(--flame)]/10 text-[var(--flame)]">
            <Bell className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-white">{toast.title}</p>
            {toast.body ? (
              <p className="mt-1 line-clamp-3 text-xs leading-relaxed text-[var(--muted)]">
                {toast.body}
              </p>
            ) : null}
            <Link
              href="/notifications"
              onClick={dismissToast}
              className="mt-2 inline-block text-xs font-bold text-[var(--flame)] hover:underline"
            >
              View notifications
            </Link>
          </div>
          <button
            type="button"
            onClick={dismissToast}
            className="shrink-0 rounded-full p-1 text-[var(--muted)] transition hover:bg-white/5 hover:text-white"
            aria-label="Dismiss notification"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
