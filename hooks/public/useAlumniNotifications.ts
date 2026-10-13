"use client";

import { useState, useEffect, useCallback } from "react";
import { useApp } from "@/lib/public/context";

export interface AlumniNotificationItem {
  id: string;
  type: "MESSAGE" | "INVITATION" | "NOTIFICATION";
  title: string;
  message: string;
  channels: string[];
  date: string;
  priority: "NORMAL" | "URGENT" | "CRITICAL";
  audienceLabel: string;
  actionUrl: string | null;
  eventDate: string | null;
  eventVenue: string | null;
  rsvpDeadline: string | null;
  isRead: boolean;
}

export function useAlumniNotifications() {
  const { session } = useApp();
  const [rawNotifications, setRawNotifications] = useState<Omit<AlumniNotificationItem, "isRead">[]>([]);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const storageKey = session?.id ? `ipam_alumni_read_notifs_${session.id}` : null;

  // Load readIds from localStorage
  const loadReadIds = useCallback(() => {
    if (!storageKey || typeof window === "undefined") return;
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed: string[] = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setReadIds(new Set(parsed));
        }
      }
    } catch {
      // ignore JSON parse error
    }
  }, [storageKey]);

  // Fetch notifications from server
  const fetchNotifications = useCallback(async () => {
    if (!session) {
      setRawNotifications([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/alumni/notifications");
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          setRawNotifications([]);
          return;
        }
        setError("Failed to fetch messages.");
        return;
      }
      const json = await res.json();
      const list = json?.data?.notifications || json?.notifications || [];
      setRawNotifications(list);
    } catch {
      setError("Network error fetching messages.");
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    loadReadIds();
    fetchNotifications();
  }, [loadReadIds, fetchNotifications]);

  // Listen for sync event across components in the same window
  useEffect(() => {
    function handleSync() {
      loadReadIds();
    }
    window.addEventListener("ipam-notifications-read-updated", handleSync);
    window.addEventListener("storage", handleSync);
    return () => {
      window.removeEventListener("ipam-notifications-read-updated", handleSync);
      window.removeEventListener("storage", handleSync);
    };
  }, [loadReadIds]);

  const saveReadIds = useCallback(
    (newSet: Set<string>) => {
      setReadIds(newSet);
      if (storageKey && typeof window !== "undefined") {
        try {
          localStorage.setItem(storageKey, JSON.stringify(Array.from(newSet)));
          window.dispatchEvent(new Event("ipam-notifications-read-updated"));
        } catch {
          // ignore storage error
        }
      }
    },
    [storageKey]
  );

  const markAsRead = useCallback(
    (id: string) => {
      setReadIds((prev) => {
        if (prev.has(id)) return prev;
        const next = new Set(prev);
        next.add(id);
        saveReadIds(next);
        return next;
      });
    },
    [saveReadIds]
  );

  const toggleRead = useCallback(
    (id: string) => {
      setReadIds((prev) => {
        const next = new Set(prev);
        if (next.has(id)) {
          next.delete(id);
        } else {
          next.add(id);
        }
        saveReadIds(next);
        return next;
      });
    },
    [saveReadIds]
  );

  const markAllAsRead = useCallback(() => {
    const allIds = new Set(rawNotifications.map((n) => n.id));
    saveReadIds(allIds);
  }, [rawNotifications, saveReadIds]);

  const notifications: AlumniNotificationItem[] = rawNotifications.map((n) => ({
    ...n,
    isRead: readIds.has(n.id),
  }));

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return {
    notifications,
    unreadCount,
    loading,
    error,
    markAsRead,
    toggleRead,
    markAllAsRead,
    refresh: fetchNotifications,
  };
}
