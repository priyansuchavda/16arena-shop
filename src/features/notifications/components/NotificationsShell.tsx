"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Bell,
  CheckCircle2,
  Wallet,
  Trophy,
  UserPlus,
  PlayCircle,
  Loader2,
  ShoppingBag,
  Package,
} from "lucide-react";
import {
  useNotifications,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
} from "../hooks/useNotifications";
import { NotificationModel } from "../api";
import { useNotificationStore } from "../store";
import { ShopAccountShell } from "@/features/shop/components/shop-account-shell";

function groupNotifications(notifications: NotificationModel[]) {
  const today: NotificationModel[] = [];
  const yesterday: NotificationModel[] = [];
  const older: NotificationModel[] = [];

  const todayStr = new Date().toDateString();
  const yesterdayStr = new Date(Date.now() - 86400000).toDateString();

  for (const n of notifications) {
    const d = new Date(n.sentDate);
    const dStr = d.toDateString();
    if (dStr === todayStr) {
      today.push(n);
    } else if (dStr === yesterdayStr) {
      yesterday.push(n);
    } else {
      older.push(n);
    }
  }

  return { today, yesterday, older };
}

function formatTimestamp(dateStr: string) {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = Math.abs(now.getTime() - date.getTime());

  if (date.toDateString() === now.toDateString()) {
    const minutes = Math.floor(diffMs / 60000);
    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  }

  const yesterdayStr = new Date(now.getTime() - 86400000).toDateString();
  if (date.toDateString() === yesterdayStr) {
    return "Yesterday";
  }

  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays < 7) {
    return `${diffDays} days ago`;
  }

  return date.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

function getNotificationIcon(typeStr: string) {
  const type = typeStr.toLowerCase();
  if (type.includes("shop") || type.includes("order")) return ShoppingBag;
  if (type.includes("wallet") || type.includes("coin")) return Wallet;
  if (type.includes("tournament") || type.includes("scrim")) return Trophy;
  if (type.includes("team")) return UserPlus;
  if (type.includes("pool") || type.includes("play")) return PlayCircle;
  if (type.includes("delivery") || type.includes("voucher")) return Package;
  return Bell;
}

function parsePayload(payload?: string): Record<string, unknown> | null {
  if (!payload) return null;
  try {
    return JSON.parse(payload) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export function NotificationsShell() {
  const router = useRouter();
  const resetUnreadCount = useNotificationStore((state) => state.resetUnreadCount);

  const [page, setPage] = useState(1);
  const [allNotifications, setAllNotifications] = useState<NotificationModel[]>([]);

  useEffect(() => {
    resetUnreadCount();
    return () => resetUnreadCount();
  }, [resetUnreadCount]);

  const { data, isLoading, isFetching } = useNotifications(page, 20);
  const markReadMutation = useMarkNotificationRead();
  const markAllReadMutation = useMarkAllNotificationsRead();

  useEffect(() => {
    if (data?.notifications) {
      if (page === 1) {
        setAllNotifications(data.notifications);
      } else {
        setAllNotifications((prev) => {
          const ids = new Set(prev.map((n) => n.notificationId));
          const uniques = data.notifications.filter((n) => !ids.has(n.notificationId));
          return [...prev, ...uniques];
        });
      }
    }
  }, [data, page]);

  const handleMarkAllRead = () => {
    markAllReadMutation.mutate();
    setAllNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const handleNotificationClick = (n: NotificationModel) => {
    if (!n.isRead) {
      markReadMutation.mutate(n.notificationId);
      setAllNotifications((prev) =>
        prev.map((item) =>
          item.notificationId === n.notificationId ? { ...item, isRead: true } : item
        )
      );
    }

    const type = n.notificationType?.toLowerCase() || "";
    const payload = parsePayload(n.payload);
    const orderId =
      (payload?.orderId as string | undefined) ||
      (payload?.shopOrderId as string | undefined) ||
      (payload?.id as string | undefined);

    if ((type.includes("shop") || type.includes("order")) && orderId) {
      router.push(`/orders/${orderId}`);
      return;
    }

    if (type.includes("shop") || type.includes("order")) {
      router.push("/orders");
      return;
    }

    if (type.includes("wallet")) {
      router.push("/");
      return;
    }

    if (type.includes("tournament") && n.tournamentId) {
      router.push("/");
      return;
    }
  };

  const filteredNotifications = allNotifications;

  const { today, yesterday, older } = groupNotifications(filteredNotifications);
  const hasMore = data ? page < data.totalPages : false;

  const renderNotificationGroup = (title: string, list: NotificationModel[]) => {
    if (list.length === 0) return null;
    return (
      <div className="space-y-4">
        <h3 className="pl-1 text-sm font-heading font-semibold uppercase tracking-widest text-[var(--muted)]">
          {title}
        </h3>
        <div className="divide-y divide-[var(--line)] overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--surface)]">
          {list.map((n) => {
            const Icon = getNotificationIcon(n.notificationType || "");
            return (
              <div
                key={n.notificationId}
                onClick={() => handleNotificationClick(n)}
                className={`flex cursor-pointer items-start gap-4 p-4 transition-all hover:bg-white/[0.04] ${
                  !n.isRead ? "bg-[var(--flame)]/[0.03]" : ""
                }`}
              >
                <div
                  className={`relative shrink-0 rounded-xl border p-2.5 ${
                    !n.isRead
                      ? "border-[var(--flame)]/30 bg-[var(--flame)]/10 text-[var(--flame)]"
                      : "border-[var(--line)] bg-white/5 text-[var(--muted)]"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  {!n.isRead && (
                    <span className="absolute right-1.5 top-1.5 h-2 w-2 animate-pulse rounded-full bg-[var(--flame)]" />
                  )}
                </div>

                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-start justify-between gap-4">
                    <p
                      className={`truncate text-sm font-bold leading-snug ${
                        !n.isRead ? "text-white" : "text-[var(--ink)]"
                      }`}
                    >
                      {n.notificationTitle}
                    </p>
                    <span className="shrink-0 font-mono text-[10px] text-[var(--faint)]">
                      {formatTimestamp(n.sentDate)}
                    </span>
                  </div>
                  <p className="break-words text-xs leading-relaxed text-[var(--muted)]">
                    {n.notificationDescription}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <ShopAccountShell>
      <div className="mb-8 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="rounded-full border border-[var(--line)] p-2 transition hover:bg-white/5"
          >
            <ArrowLeft className="h-5 w-5 text-white" />
          </Link>
          <div>
            <h1 className="font-heading text-2xl font-bold leading-none text-white">Notifications</h1>
            <p className="mt-1.5 text-xs text-[var(--muted)]">
              Stay updated with shop orders and announcements
            </p>
          </div>
        </div>

        {allNotifications.some((n) => !n.isRead) && (
          <button
            type="button"
            onClick={handleMarkAllRead}
            className="flex shrink-0 cursor-pointer items-center gap-1.5 rounded-xl border border-[var(--line)] bg-[var(--surface)] px-4 py-2 text-xs font-bold text-white transition hover:bg-white/5 active:scale-95"
          >
            <CheckCircle2 className="h-4 w-4 text-[var(--flame)]" />
            Mark all read
          </button>
        )}
      </div>

      {isLoading && page === 1 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-[var(--line)] bg-[var(--surface)] py-24 text-center">
          <Loader2 className="mb-4 h-8 w-8 animate-spin text-[var(--flame)]" />
          <p className="text-sm text-[var(--muted)]">Loading notifications...</p>
        </div>
      ) : filteredNotifications.length === 0 ? (
        <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] px-6 py-16 text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-[var(--flame)]/20 bg-[var(--flame)]/10">
            <Bell className="h-8 w-8 text-[var(--flame)]" />
          </div>
          <h2 className="font-heading text-lg font-bold text-white">No notifications yet</h2>
          <p className="mx-auto mt-2 max-w-sm text-sm text-[var(--muted)]">
            Order updates, delivery alerts, and announcements will appear here.
          </p>
          <Link
            href="/"
            className="mt-6 inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-[#ff973c] to-[#ff6a00] px-6 py-2.5 text-xs font-bold text-black transition active:scale-95"
          >
            Browse Store
          </Link>
        </div>
      ) : (
        <div className="space-y-8">
          {renderNotificationGroup("Today", today)}
          {renderNotificationGroup("Yesterday", yesterday)}
          {renderNotificationGroup("Older", older)}

          {hasMore && !isFetching && (
            <div className="mt-8 flex justify-center">
              <button
                type="button"
                onClick={() => setPage((p) => p + 1)}
                className="flex cursor-pointer items-center gap-2 rounded-xl border border-[var(--line)] bg-[var(--surface)] px-6 py-2.5 text-xs font-bold text-white transition hover:bg-white/5 active:scale-95"
              >
                Load More Notifications
              </button>
            </div>
          )}

          {isFetching && (
            <div className="mt-8 flex justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-[var(--flame)]" />
            </div>
          )}
        </div>
      )}
    </ShopAccountShell>
  );
}
