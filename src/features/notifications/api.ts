import { apiClient } from "@/shared/lib/axios";

export interface NotificationModel {
  notificationId: string;
  notificationTitle: string;
  notificationDescription: string;
  sentDate: string;
  isRead: boolean;
  notificationType: string;
  notificationIcon?: string;
  tournamentId?: string;
  payload?: string;
}

export interface PaginatedNotifications {
  notifications: NotificationModel[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
}

export const notificationsApi = {
  fetchNotifications: async (page = 1, pageSize = 20): Promise<PaginatedNotifications> => {
    const { data } = await apiClient.get(`/v1/Notification?PageNumber=${page}&PageSize=${pageSize}`);
    const result = data?.data || data || {};
    return {
      notifications: result.notifications || [],
      totalCount: result.totalCount || 0,
      pageNumber: result.pageNumber || page,
      pageSize: result.pageSize || pageSize,
      totalPages: result.totalPages || 1,
    };
  },

  markAsRead: async (notificationId: string): Promise<void> => {
    await apiClient.patch(`/v1/Notification/read/${notificationId}`, null);
  },

  markAllAsRead: async (): Promise<void> => {
    await apiClient.patch("/v1/Notification/read-all", null);
  },
};
