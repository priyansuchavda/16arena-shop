import type { MessagePayload } from "firebase/messaging";

export function extractNotificationContent(payload: MessagePayload) {
  const data = payload.data || {};
  return {
    title:
      payload.notification?.title ||
      data.title ||
      data.notificationTitle ||
      "New Notification",
    body:
      payload.notification?.body ||
      data.body ||
      data.message ||
      data.notificationDescription ||
      "",
  };
}

export function logFcmToken(token: string) {
  console.log("========== FCM TOKEN ==========");
  console.log(token);
  console.log("===============================");
  if (typeof window !== "undefined") {
    (window as Window & { __FCM_TOKEN__?: string }).__FCM_TOKEN__ = token;
  }
}
