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
      className="relative flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-white transition hover:brightness-110"
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
