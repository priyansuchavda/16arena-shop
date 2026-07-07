"use client";

import Link from "next/link";
import { Bell } from "lucide-react";
import { useAuthStore } from "@/features/auth/store/auth.store";
import { useNotificationStore } from "../store";

export function NotificationBell() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const unreadCount = useNotificationStore((state) => state.unreadCount);

  if (!isAuthenticated) return null;

  return (
    <Link
      href="/notifications"
      className="relative flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-full border border-[#a67c52]/65 bg-[#6b4423] text-white/80 shadow-[inset_0_1px_0_rgba(255,200,120,0.08)] transition hover:brightness-110"
      aria-label="Notifications"
    >
      <Bell className="h-[18px] w-[18px]" />
      {unreadCount > 0 && (
        <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--flame)] px-1 font-mono text-[9px] font-bold text-black shadow-md">
          {unreadCount > 99 ? "99+" : unreadCount}
        </span>
      )}
    </Link>
  );
}
