"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Bell,
  Mail,
  Calendar,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  Search,
  Filter,
  CheckCheck,
  RotateCw,
  Clock,
  Send,
  Users,
  Smartphone,
  Radio,
  Tag,
  ChevronRight,
  Eye,
  EyeOff,
  Sparkles,
} from "lucide-react";
import { useAlumniNotifications, type AlumniNotificationItem } from "@/hooks/public/useAlumniNotifications";
import { useWebPushNotifications } from "@/hooks/public/useWebPushNotifications";

function formatDate(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

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

export default function AlumniNotificationsView({
  className = "",
  compact = false,
}: {
  className?: string;
  compact?: boolean;
}) {
  const {
    notifications,
    unreadCount,
    loading,
    error,
    markAsRead,
    toggleRead,
    markAllAsRead,
    refresh,
  } = useAlumniNotifications();
  const { isSupported, permission, enableNotifications, loading: pushLoading } = useWebPushNotifications();

  const [activeTab, setActiveTab] = useState<"ALL" | "UNREAD" | "NOTIFICATION" | "MESSAGE" | "INVITATION">("ALL");
  const [priorityFilter, setPriorityFilter] = useState<"ALL" | "CRITICAL" | "URGENT" | "NORMAL">("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredNotifications = notifications.filter((item) => {
    if (activeTab === "UNREAD" && item.isRead) return false;
    if (activeTab === "NOTIFICATION" && item.type !== "NOTIFICATION") return false;
    if (activeTab === "MESSAGE" && item.type !== "MESSAGE") return false;
    if (activeTab === "INVITATION" && item.type !== "INVITATION") return false;

    if (priorityFilter !== "ALL" && item.priority !== priorityFilter) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = item.title.toLowerCase().includes(q);
      const matchMsg = item.message.toLowerCase().includes(q);
      const matchAudience = item.audienceLabel.toLowerCase().includes(q);
      if (!matchTitle && !matchMsg && !matchAudience) return false;
    }
    return true;
  });

  const criticalCount = notifications.filter((n) => n.priority === "CRITICAL" || n.priority === "URGENT").length;
  const invitationCount = notifications.filter((n) => n.type === "INVITATION").length;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20">
              <Bell className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-black tracking-tight text-white sm:text-2xl">
                Official Announcements &amp; Messages
              </h2>
              <p className="text-xs text-slate-400">
                Direct broadcasts dispatched by IPAM Alumni Administration &amp; Executive Council
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-950/60 px-3 py-1.5 text-xs font-bold text-emerald-300 transition-colors hover:bg-emerald-900/60"
            >
              <CheckCheck className="h-4 w-4" />
              <span>Mark all as read</span>
            </button>
          )}
          <button
            onClick={() => refresh()}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs font-semibold text-slate-300 transition-colors hover:bg-slate-800 disabled:opacity-50"
            title="Refresh messages"
          >
            <RotateCw className={`h-3.5 w-3.5 ${loading ? "animate-spin text-emerald-400" : ""}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Web Push Opt-in Banner */}
      {isSupported && permission !== "granted" && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-950/30 p-4 shadow-sm backdrop-blur-sm">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-500/30">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Enable Real-Time Web Push Notifications</h3>
              <p className="text-xs text-emerald-300/80 mt-0.5">
                Receive instant browser alerts for degree verification approvals, physical ID card shipments, job matches, and campus alerts.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={enableNotifications}
            disabled={pushLoading}
            className="flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-2 text-xs font-bold text-slate-950 shadow-md transition-all hover:bg-emerald-400 hover:shadow-emerald-500/20 disabled:opacity-50 flex-shrink-0"
          >
            <Bell className="h-4 w-4" />
            <span>{pushLoading ? "Enabling Push..." : "Enable Push Notifications"}</span>
          </button>
        </div>
      )}

      {/* Metrics Ribbon (hide in compact mode) */}
      {!compact && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
          <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-3.5 shadow-sm">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
              <span>Total Dispatches</span>
              <Send className="h-4 w-4 text-slate-500" />
            </div>
            <div className="mt-2 text-2xl font-black text-white">{notifications.length}</div>
            <div className="mt-0.5 text-[11px] text-slate-500">From verified admin desk</div>
          </div>

          <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/30 p-3.5 shadow-sm">
            <div className="flex items-center justify-between text-xs font-semibold text-emerald-300">
              <span>Unread</span>
              <Bell className="h-4 w-4 text-emerald-400" />
            </div>
            <div className="mt-2 text-2xl font-black text-emerald-400">{unreadCount}</div>
            <div className="mt-0.5 text-[11px] text-emerald-500/80">Pending your attention</div>
          </div>

          <div className="rounded-xl border border-amber-500/30 bg-amber-950/20 p-3.5 shadow-sm">
            <div className="flex items-center justify-between text-xs font-semibold text-amber-300">
              <span>Urgent Alerts</span>
              <AlertCircle className="h-4 w-4 text-amber-400" />
            </div>
            <div className="mt-2 text-2xl font-black text-amber-300">{criticalCount}</div>
            <div className="mt-0.5 text-[11px] text-amber-500/80">High priority notices</div>
          </div>

          <div className="rounded-xl border border-indigo-500/30 bg-indigo-950/20 p-3.5 shadow-sm">
            <div className="flex items-center justify-between text-xs font-semibold text-indigo-300">
              <span>Event Invites</span>
              <Calendar className="h-4 w-4 text-indigo-400" />
            </div>
            <div className="mt-2 text-2xl font-black text-indigo-300">{invitationCount}</div>
            <div className="mt-0.5 text-[11px] text-indigo-500/80">Galas &amp; webinars</div>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-3 rounded-xl border border-slate-800 bg-slate-900/60 p-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Tabs */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setActiveTab("ALL")}
            className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
              activeTab === "ALL"
                ? "bg-emerald-500 text-slate-950 shadow-sm"
                : "text-slate-300 hover:bg-slate-800"
            }`}
          >
            All ({notifications.length})
          </button>
          <button
            onClick={() => setActiveTab("UNREAD")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
              activeTab === "UNREAD"
                ? "bg-emerald-500 text-slate-950 shadow-sm"
                : "text-slate-300 hover:bg-slate-800"
            }`}
          >
            <span>Unread</span>
            {unreadCount > 0 && (
              <span
                className={`rounded-full px-1.5 py-0.2 text-[10px] font-black ${
                  activeTab === "UNREAD" ? "bg-slate-950 text-emerald-400" : "bg-emerald-500/20 text-emerald-300"
                }`}
              >
                {unreadCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("NOTIFICATION")}
            className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
              activeTab === "NOTIFICATION"
                ? "bg-emerald-500 text-slate-950 shadow-sm"
                : "text-slate-300 hover:bg-slate-800"
            }`}
          >
            Notices
          </button>
          <button
            onClick={() => setActiveTab("MESSAGE")}
            className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
              activeTab === "MESSAGE"
                ? "bg-emerald-500 text-slate-950 shadow-sm"
                : "text-slate-300 hover:bg-slate-800"
            }`}
          >
            Messages
          </button>
          <button
            onClick={() => setActiveTab("INVITATION")}
            className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
              activeTab === "INVITATION"
                ? "bg-emerald-500 text-slate-950 shadow-sm"
                : "text-slate-300 hover:bg-slate-800"
            }`}
          >
            Invitations
          </button>
        </div>

        {/* Search & Priority */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-56">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter messages..."
              className="w-full rounded-lg border border-slate-800 bg-slate-950 py-1.5 pl-8 pr-3 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
            />
          </div>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value as any)}
            className="rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-1.5 text-xs font-semibold text-slate-300 focus:border-emerald-500 focus:outline-none"
          >
            <option value="ALL">All Priorities</option>
            <option value="CRITICAL">Critical</option>
            <option value="URGENT">Urgent</option>
            <option value="NORMAL">Normal</option>
          </select>
        </div>
      </div>

      {/* Messages List */}
      <div className="space-y-3">
        {filteredNotifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-800 bg-slate-900/30 p-12 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-800/80 text-slate-400">
              <CheckCircle2 className="h-7 w-7 text-emerald-400" />
            </div>
            <h3 className="mt-4 text-base font-extrabold text-white">No messages found</h3>
            <p className="mt-1 max-w-sm text-xs text-slate-400">
              {searchQuery || activeTab !== "ALL" || priorityFilter !== "ALL"
                ? "No announcements matched your selected filters. Try clearing your search query or changing filters."
                : "You are completely caught up! Official messages and notices from the administration will appear here."}
            </p>
            {(searchQuery || activeTab !== "ALL" || priorityFilter !== "ALL") && (
              <button
                onClick={() => {
                  setSearchQuery("");
                  setActiveTab("ALL");
                  setPriorityFilter("ALL");
                }}
                className="mt-4 rounded-lg border border-slate-700 bg-slate-800 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-slate-700"
              >
                Clear all filters
              </button>
            )}
          </div>
        ) : (
          filteredNotifications.map((item) => (
            <NotificationCard
              key={item.id}
              item={item}
              onMarkAsRead={() => markAsRead(item.id)}
              onToggleRead={() => toggleRead(item.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}

function NotificationCard({
  item,
  onMarkAsRead,
  onToggleRead,
}: {
  item: AlumniNotificationItem;
  onMarkAsRead: () => void;
  onToggleRead: () => void;
}) {
  const isUrgent = item.priority === "URGENT";
  const isCritical = item.priority === "CRITICAL";

  let borderClass = "border-slate-800 hover:border-slate-700";
  if (!item.isRead) {
    borderClass = "border-emerald-500/40 bg-slate-900/90 shadow-md ring-1 ring-emerald-500/20";
  }
  if (isCritical) {
    borderClass = item.isRead
      ? "border-rose-900/50 hover:border-rose-800"
      : "border-rose-500/60 bg-rose-950/10 ring-1 ring-rose-500/30";
  } else if (isUrgent && !item.isRead) {
    borderClass = "border-amber-500/50 bg-amber-950/10 ring-1 ring-amber-500/20";
  }

  return (
    <div
      className={`group relative rounded-2xl border p-4 sm:p-5 transition-all ${
        item.isRead ? "bg-slate-900/50 opacity-90" : "bg-slate-900"
      } ${borderClass}`}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          {/* Type Icon */}
          <div className="mt-0.5 flex-shrink-0">
            {item.type === "NOTIFICATION" && (
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                  isCritical
                    ? "bg-rose-500/10 text-rose-400 ring-1 ring-rose-500/30"
                    : isUrgent
                    ? "bg-amber-500/10 text-amber-400 ring-1 ring-amber-500/30"
                    : "bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/30"
                }`}
              >
                <Bell className="h-5 w-5" />
              </div>
            )}
            {item.type === "INVITATION" && (
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400 ring-1 ring-indigo-500/30">
                <Calendar className="h-5 w-5" />
              </div>
            )}
            {item.type === "MESSAGE" && (
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-500/10 text-teal-400 ring-1 ring-teal-500/30">
                <Mail className="h-5 w-5" />
              </div>
            )}
          </div>

          {/* Core Content */}
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              {/* Priority badge */}
              {item.priority === "CRITICAL" && (
                <span className="flex items-center gap-1 rounded-md border border-rose-500/40 bg-rose-950/80 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-rose-300">
                  <AlertTriangle className="h-3 w-3 text-rose-400" />
                  Critical
                </span>
              )}
              {item.priority === "URGENT" && (
                <span className="flex items-center gap-1 rounded-md border border-amber-500/40 bg-amber-950/80 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-amber-300">
                  <AlertCircle className="h-3 w-3 text-amber-400" />
                  Urgent
                </span>
              )}
              {item.priority === "NORMAL" && (
                <span className="rounded-md border border-slate-700 bg-slate-800/80 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Notice
                </span>
              )}

              {/* Type pill */}
              <span className="rounded-md border border-emerald-500/20 bg-emerald-950/40 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                {item.type === "NOTIFICATION" ? "Official Notice" : item.type === "INVITATION" ? "Gala & Event Invitation" : "Executive Message"}
              </span>

              {/* Audience */}
              <span className="flex items-center gap-1 text-[11px] font-medium text-slate-400">
                <Users className="h-3 w-3 text-slate-500" />
                <span>{item.audienceLabel}</span>
              </span>

              {/* Unread indicator */}
              {!item.isRead && (
                <span className="flex items-center gap-1 rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-black text-emerald-300">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                  NEW
                </span>
              )}
            </div>

            <h4 className="mt-2 text-base font-extrabold text-white sm:text-lg">
              {item.title}
            </h4>

            <p className="mt-1.5 whitespace-pre-line text-xs leading-relaxed text-slate-300 sm:text-sm">
              {item.message}
            </p>

            {/* Event Details Box if INVITATION */}
            {item.type === "INVITATION" && (item.eventDate || item.eventVenue) && (
              <div className="mt-3.5 rounded-xl border border-indigo-500/20 bg-indigo-950/30 p-3 text-xs text-indigo-200">
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {item.eventDate && (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3.5 w-3.5 text-indigo-400 flex-shrink-0" />
                      <div>
                        <span className="font-semibold text-slate-400">Date: </span>
                        <span className="font-bold text-white">{formatDate(item.eventDate)}</span>
                      </div>
                    </div>
                  )}
                  {item.eventVenue && (
                    <div className="flex items-center gap-2">
                      <Radio className="h-3.5 w-3.5 text-indigo-400 flex-shrink-0" />
                      <div>
                        <span className="font-semibold text-slate-400">Venue: </span>
                        <span className="font-bold text-white">{item.eventVenue}</span>
                      </div>
                    </div>
                  )}
                  {item.rsvpDeadline && (
                    <div className="flex items-center gap-2 sm:col-span-2">
                      <Clock className="h-3.5 w-3.5 text-amber-400 flex-shrink-0" />
                      <div>
                        <span className="font-semibold text-slate-400">RSVP Deadline: </span>
                        <span className="font-bold text-amber-300">{formatDate(item.rsvpDeadline)}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Bottom Meta & Action links */}
            <div className="mt-3.5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-800/80 pt-3">
              <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400">
                <span className="flex items-center gap-1 font-medium">
                  <Clock className="h-3 w-3 text-slate-500" />
                  <span>{timeAgo(item.date)}</span>
                  <span className="text-slate-600">•</span>
                  <span>{formatDate(item.date)}</span>
                </span>

                {item.channels && item.channels.length > 0 && (
                  <span className="flex items-center gap-1 font-semibold text-slate-500">
                    <Send className="h-3 w-3" />
                    <span>Dispatched via {item.channels.join(", ")}</span>
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                {item.actionUrl && (
                  <Link
                    href={item.actionUrl}
                    onClick={onMarkAsRead}
                    className="flex items-center gap-1 rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-bold text-slate-950 transition-all hover:bg-emerald-400 hover:shadow-xs"
                  >
                    <span>Open Action</span>
                    <ExternalLink className="h-3 w-3 text-slate-950" />
                  </Link>
                )}

                <button
                  type="button"
                  onClick={onToggleRead}
                  className="flex items-center gap-1 rounded-lg border border-slate-700/80 bg-slate-800/80 px-2.5 py-1.5 text-xs font-semibold text-slate-300 transition-colors hover:bg-slate-700 hover:text-white"
                  title={item.isRead ? "Mark as unread" : "Mark as read"}
                >
                  {item.isRead ? (
                    <>
                      <EyeOff className="h-3 w-3 text-slate-400" />
                      <span>Mark unread</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                      <span>Mark read</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
