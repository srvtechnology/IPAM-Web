"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
  Bell,
  CheckCheck,
  Calendar,
  Mail,
  AlertCircle,
  AlertTriangle,
  ExternalLink,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { useAlumniNotifications } from "@/hooks/public/useAlumniNotifications";

function timeAgo(iso: string) {
  try {
    const d = new Date(iso);
    const now = new Date();
    const diffSec = Math.floor((now.getTime() - d.getTime()) / 1000);
    if (diffSec < 60) return "Just now";
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 30) return `${diffDays}d ago`;
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  } catch {
    return "";
  }
}

export default function HeaderNotificationBell() {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useAlumniNotifications();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  const recentNotifications = notifications.slice(0, 5);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-slate-700/80 bg-slate-800/80 text-slate-300 transition-colors hover:border-slate-600 hover:bg-slate-800 hover:text-white"
        aria-label="Admin notifications and messages"
        title="Admin Announcements & Messages"
      >
        <Bell className="h-4.5 w-4.5" />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-emerald-500 px-1 text-[10px] font-black leading-none text-slate-950 shadow-sm ring-2 ring-slate-950">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-80 sm:w-96 rounded-2xl border border-slate-800 bg-slate-900 p-2 shadow-2xl backdrop-blur-xl">
          {/* Top heading */}
          <div className="flex items-center justify-between border-b border-slate-800/80 px-3 py-2.5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-extrabold uppercase tracking-wider text-white">
                Admin Broadcasts
              </span>
              {unreadCount > 0 && (
                <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                  {unreadCount} unread
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={() => markAllAsRead()}
                className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 hover:underline"
              >
                <CheckCheck className="h-3 w-3" />
                <span>Mark read</span>
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-80 divide-y divide-slate-800/60 overflow-y-auto py-1">
            {notifications.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                <Bell className="mx-auto h-6 w-6 text-slate-600 mb-2" />
                <p>No announcements dispatched yet.</p>
              </div>
            ) : (
              recentNotifications.map((n) => {
                const isUrgent = n.priority === "URGENT" || n.priority === "CRITICAL";
                return (
                  <div
                    key={n.id}
                    onClick={() => markAsRead(n.id)}
                    className={`group cursor-pointer p-3 transition-colors hover:bg-slate-800/60 rounded-xl ${
                      !n.isRead ? "bg-slate-800/30" : ""
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <div className="mt-0.5 flex-shrink-0">
                        {n.type === "NOTIFICATION" && (
                          <div
                            className={`flex h-7 w-7 items-center justify-center rounded-lg ${
                              isUrgent
                                ? "bg-amber-500/10 text-amber-400 ring-1 ring-amber-500/30"
                                : "bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20"
                            }`}
                          >
                            <Bell className="h-3.5 w-3.5" />
                          </div>
                        )}
                        {n.type === "INVITATION" && (
                          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400 ring-1 ring-indigo-500/20">
                            <Calendar className="h-3.5 w-3.5" />
                          </div>
                        )}
                        {n.type === "MESSAGE" && (
                          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-teal-500/10 text-teal-400 ring-1 ring-teal-500/20">
                            <Mail className="h-3.5 w-3.5" />
                          </div>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <p className={`truncate text-xs font-bold ${!n.isRead ? "text-white" : "text-slate-300"}`}>
                            {n.title}
                          </p>
                          {!n.isRead && (
                            <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-emerald-400" />
                          )}
                        </div>

                        <p className="mt-0.5 line-clamp-2 text-[11px] leading-relaxed text-slate-400">
                          {n.message}
                        </p>

                        <div className="mt-1.5 flex items-center justify-between text-[10px] text-slate-500">
                          <span>{timeAgo(n.date)}</span>
                          <span className="font-semibold text-emerald-400/80">
                            {n.type === "NOTIFICATION" ? "Notice" : n.type === "INVITATION" ? "Invite" : "Message"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer View All */}
          <div className="border-t border-slate-800/80 p-2">
            <Link
              href="/profile?tab=notifications"
              onClick={() => setOpen(false)}
              className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-slate-800/80 py-2 text-center text-xs font-bold text-emerald-300 transition-colors hover:bg-emerald-950/60 hover:text-emerald-200"
            >
              <span>View All Official Announcements ({notifications.length})</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
