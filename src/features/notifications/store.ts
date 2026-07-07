import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface NotificationToast {
  id: string;
  title: string;
  body: string;
}

interface NotificationState {
  unreadCount: number;
  toast: NotificationToast | null;
  incrementUnreadCount: () => void;
  resetUnreadCount: () => void;
  setUnreadCount: (count: number) => void;
  showToast: (toast: Omit<NotificationToast, "id">) => void;
  dismissToast: () => void;
}

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set) => ({
      unreadCount: 0,
      toast: null,
      incrementUnreadCount: () => set((state) => ({ unreadCount: state.unreadCount + 1 })),
      resetUnreadCount: () => set({ unreadCount: 0 }),
      setUnreadCount: (count) => set({ unreadCount: count }),
      showToast: (toast) =>
        set({
          toast: {
            ...toast,
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          },
        }),
      dismissToast: () => set({ toast: null }),
    }),
    {
      name: "notification-storage",
      partialize: (state) => ({ unreadCount: state.unreadCount }),
    }
  )
);
