"use client";

import { useEffect, useState } from "react";
import { getToken, onMessage } from "firebase/messaging";
import { messaging } from "@/shared/lib/firebase";
import { apiClient } from "@/shared/lib/axios";
import { useAuthStore } from "@/features/auth/store/auth.store";
import { useNotificationStore } from "../store";
import { extractNotificationContent, logFcmToken } from "../utils/fcm.utils";

function showIncomingNotification(title: string, body: string) {
  const store = useNotificationStore.getState();
  store.incrementUnreadCount();

  if (document.hidden) {
    if (Notification.permission === "granted") {
      try {
        new Notification(title, {
          body,
          icon: "/window.svg",
        });
      } catch (err) {
        console.warn("Could not show system notification:", err);
      }
    }
    return;
  }

  store.showToast({ title, body });
}

export const useFcm = () => {
  const [fcmToken, setFcmToken] = useState<string | null>(null);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  useEffect(() => {
    const setupNotifications = async () => {
      try {
        if (typeof window === "undefined" || !("Notification" in window)) {
          console.warn("This browser does not support desktop notifications");
          return;
        }

        const permission = await Notification.requestPermission();
        if (permission !== "granted") {
          console.warn("Notification permission denied");
          return;
        }

        const messagingInstance = await messaging();
        if (!messagingInstance) {
          console.warn("Firebase Messaging not supported or failed to initialize");
          return;
        }

        const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
        if (!vapidKey) {
          console.warn(
            "NEXT_PUBLIC_FIREBASE_VAPID_KEY is missing — FCM token may fail. Add it from Firebase Console → Cloud Messaging."
          );
        }

        const swUrl =
          `/firebase-messaging-sw.js?apiKey=${encodeURIComponent(process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "")}` +
          `&authDomain=${encodeURIComponent(process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "")}` +
          `&projectId=${encodeURIComponent(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "")}` +
          `&storageBucket=${encodeURIComponent(process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "")}` +
          `&messagingSenderId=${encodeURIComponent(process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "")}` +
          `&appId=${encodeURIComponent(process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "")}`;

        const registration = await navigator.serviceWorker.register(swUrl);

        if (!registration.active) {
          await new Promise<void>((resolve) => {
            const worker = registration.installing || registration.waiting;
            if (worker) {
              worker.addEventListener("statechange", (e: Event) => {
                const target = e.target as ServiceWorker | null;
                if (target?.state === "activated" || registration.active) {
                  resolve();
                }
              });
            } else {
              resolve();
            }
          });
        }

        const token = await getToken(messagingInstance, {
          vapidKey: vapidKey || undefined,
          serviceWorkerRegistration: registration,
        });

        if (token) {
          setFcmToken(token);
          localStorage.setItem("fcm_token", token);
          logFcmToken(token);

          if (!isAuthenticated) {
            try {
              await apiClient.post("/v1/guest/device", {
                fcmToken: token,
                deviceId: "web-browser",
                deviceInfo: JSON.stringify({
                  platform: "web",
                  userAgent: navigator.userAgent,
                }),
              });
            } catch (err) {
              console.error("Failed to register guest device FCM token with backend:", err);
            }
          }
        } else {
          const cached = localStorage.getItem("fcm_token");
          if (cached) {
            logFcmToken(cached);
          }
          console.warn("FCM getToken returned empty — check VAPID key and notification permission.");
        }
      } catch (err) {
        console.error("An error occurred while retrieving FCM token:", err);
      }
    };

    if (typeof window !== "undefined") {
      setupNotifications();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    let unsubscribe = () => {};
    const setupForegroundListener = async () => {
      const messagingInstance = await messaging();
      if (!messagingInstance) return;

      unsubscribe = onMessage(messagingInstance, (payload) => {
        console.log("Message received in foreground:", payload);
        const { title, body } = extractNotificationContent(payload);
        showIncomingNotification(title, body);
      });
    };

    setupForegroundListener();
    return () => unsubscribe();
  }, []);

  return fcmToken;
};
