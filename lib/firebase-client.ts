"use client";

import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import {
  getMessaging,
  getToken,
  onMessage,
  isSupported,
  type Messaging,
  type MessagePayload,
} from "firebase/messaging";

export interface FirebaseClientConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

export const firebaseConfig: FirebaseClientConfig = {
  apiKey:
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY ||
    "AIzaSyBiLw4ytLwtNmhjhDixxd2yGq8qo5UAf0I",
  authDomain:
    process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ||
    "auratrade-p93c.firebaseapp.com",
  projectId:
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "auratrade-p93c",
  storageBucket:
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ||
    "auratrade-p93c.firebasestorage.app",
  messagingSenderId:
    process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "570831339769",
  appId:
    process.env.NEXT_PUBLIC_FIREBASE_APP_ID ||
    "1:570831339769:web:594df89ce062124522e228",
};

/**
 * Returns or initializes the client-side Firebase app instance.
 */
export function getFirebaseClientApp(): FirebaseApp | null {
  if (typeof window === "undefined") return null;

  try {
    if (getApps().length > 0) {
      return getApp();
    }
    return initializeApp(firebaseConfig);
  } catch (err) {
    console.error("[Firebase Client] Initialization error:", err);
    return null;
  }
}

/**
 * Retrieves the client-side Firebase Messaging instance if supported by the browser.
 */
export async function getFirebaseClientMessaging(): Promise<Messaging | null> {
  if (typeof window === "undefined") return null;

  try {
    const supported = await isSupported();
    if (!supported) {
      console.warn("[Firebase Client] Web messaging is not supported in this browser environment.");
      return null;
    }

    const app = getFirebaseClientApp();
    if (!app) return null;

    return getMessaging(app);
  } catch (err) {
    console.error("[Firebase Client] Error accessing messaging:", err);
    return null;
  }
}

/**
 * Requests Notification permission, registers the service worker,
 * and fetches the FCM device token. Automatically registers the token with the IPAM backend.
 */
export async function requestWebPushPermission(options?: {
  vapidKey?: string;
}): Promise<{
  success: boolean;
  token?: string;
  permission?: NotificationPermission;
  error?: string;
}> {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return { success: false, error: "Notifications are not supported in this browser" };
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      return { success: false, permission, error: "Notification permission was not granted" };
    }

    const messaging = await getFirebaseClientMessaging();
    if (!messaging) {
      return { success: false, permission, error: "Firebase messaging is unavailable" };
    }

    // Register Firebase Messaging Service Worker
    let swRegistration: ServiceWorkerRegistration | undefined;
    if ("serviceWorker" in navigator) {
      try {
        swRegistration = await navigator.serviceWorker.register("/firebase-messaging-sw.js", {
          scope: "/",
        });
      } catch (swErr) {
        console.warn("[Firebase Client] Service worker registration warning:", swErr);
      }
    }

    const token = await getToken(messaging, {
      serviceWorkerRegistration: swRegistration,
      vapidKey: options?.vapidKey,
    });

    if (!token) {
      return { success: false, permission, error: "Failed to generate FCM web push token" };
    }

    // Register token with backend IPAM server
    try {
      const res = await fetch("/api/notifications/register-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          platform: "WEB",
          deviceName: typeof navigator !== "undefined" ? navigator.userAgent : "Web Browser",
        }),
      });

      if (!res.ok) {
        console.warn("[Firebase Client] Backend token registration returned status:", res.status);
      }
    } catch (regErr) {
      console.warn("[Firebase Client] Error sending token to server:", regErr);
    }

    return {
      success: true,
      token,
      permission,
    };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error("[Firebase Client] Permission/Token error:", err);
    return { success: false, error: errorMsg };
  }
}

/**
 * Attaches a listener for foreground FCM push messages.
 */
export async function listenToForegroundMessages(
  callback: (payload: MessagePayload) => void
): Promise<(() => void) | null> {
  const messaging = await getFirebaseClientMessaging();
  if (!messaging) return null;

  try {
    const unsubscribe = onMessage(messaging, (payload) => {
      console.log("[Firebase Client] Foreground push message received:", payload);
      callback(payload);
    });
    return unsubscribe;
  } catch (err) {
    console.error("[Firebase Client] Error attaching foreground message listener:", err);
    return null;
  }
}

