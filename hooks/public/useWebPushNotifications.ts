"use client";

import { useState, useEffect, useCallback } from "react";
import {
  requestWebPushPermission,
  listenToForegroundMessages,
  getFirebaseClientMessaging,
} from "@/lib/firebase-client";

export function useWebPushNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setIsSupported(true);
      setPermission(Notification.permission);
    }
  }, []);

  // Listen to foreground FCM messages
  useEffect(() => {
    let unsubscribe: (() => void) | null = null;

    async function initListener() {
      unsubscribe = await listenToForegroundMessages((payload) => {
        const title = payload.notification?.title || payload.data?.title || "IPAM Notification";
        const body = payload.notification?.body || payload.data?.message || "";

        // Show native notification if allowed
        if (Notification.permission === "granted") {
          try {
            new Notification(title, {
              body,
              icon: payload.notification?.icon || "/images/ipam-logo.png",
            });
          } catch {
            // Service worker handles fallback
          }
        }

        // Notify UI to refresh notifications list
        window.dispatchEvent(new CustomEvent("ipam-new-notification", { detail: payload }));
      });
    }

    if (permission === "granted") {
      initListener();
    }

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [permission]);

  const enableNotifications = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await requestWebPushPermission();
      if (result.permission) {
        setPermission(result.permission);
      }

      if (result.success && result.token) {
        setToken(result.token);
        return { success: true, token: result.token };
      } else {
        setError(result.error || "Failed to enable notifications");
        return { success: false, error: result.error };
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
      return { success: false, error: msg };
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    permission,
    token,
    loading,
    error,
    isSupported,
    enableNotifications,
  };
}

