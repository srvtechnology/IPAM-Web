"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { normalizeActivityPhotos, type AlumniActivityItem } from "@/lib/validation/activities";
import CreateEditActivityModal from "./CreateEditActivityModal";

function normalizeActivityItem(item: AlumniActivityItem): AlumniActivityItem {
  return {
    ...item,
    photos: normalizeActivityPhotos(item.photos),
  };
}

export default function ActivitiesManagementView({
  initialActivities = [],
}: {
  initialActivities?: AlumniActivityItem[];
}) {
  const router = useRouter();
  const [activities, setActivities] = useState<AlumniActivityItem[]>(() =>
    initialActivities.map(normalizeActivityItem)
  );
  const [loading, setLoading] = useState(initialActivities.length === 0);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<"ALL" | "CURRENT" | "PREVIOUS">("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<AlumniActivityItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AlumniActivityItem | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    setActivities(initialActivities.map(normalizeActivityItem));
  }, [initialActivities]);

  function showToast(message: string, type: "success" | "error" = "success") {
    setToast({ message, type });
    setTimeout(() => {
      setToast((curr) => (curr?.message === message ? null : curr));
    }, 3500);
  }

  const fetchActivities = useCallback(async (options?: { silent?: boolean }) => {
    const silent = Boolean(options?.silent);
    if (silent) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setLoadError(null);

    try {
      const res = await fetch("/api/admin/activities", {
        cache: "no-store",
        headers: { "Cache-Control": "no-cache" },
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json || !Array.isArray(json.data)) {
        const msg = json?.error || `Failed to load activities (HTTP ${res.status})`;
        setLoadError(msg);
        if (!silent) showToast(msg, "error");
        return;
      }
      setActivities((json.data as AlumniActivityItem[]).map(normalizeActivityItem));
    } catch {
      const msg = "Network error while loading activities";
      setLoadError(msg);
      if (!silent) showToast(msg, "error");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchActivities({ silent: initialActivities.length > 0 });
  }, [fetchActivities, initialActivities.length]);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return activities.filter((item) => {
      if (filterStatus !== "ALL" && item.status !== filterStatus) return false;
      if (!q) return true;
      return (
        item.title.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        (item.location && item.location.toLowerCase().includes(q)) ||
        (item.category && item.category.toLowerCase().includes(q))
      );
    });
  }, [activities, filterStatus, searchQuery]);

  const currentCount = activities.filter((a) => a.status === "CURRENT").length;
  const previousCount = activities.filter((a) => a.status === "PREVIOUS").length;
  const totalPhotos = activities.reduce((sum, a) => sum + a.photos.length, 0);

  function handleSaved(savedRaw: AlumniActivityItem) {
    const saved = normalizeActivityItem(savedRaw);
    setActivities((prev) => {
      const exists = prev.some((a) => a.id === saved.id);
      if (exists) {
        return prev.map((a) => (a.id === saved.id ? saved : a));
      }
      return [saved, ...prev];
    });

    // Clear active search/status filters if they would hide the newly saved activity
    setSearchQuery("");
    if (filterStatus !== "ALL" && filterStatus !== saved.status) {
      setFilterStatus("ALL");
    }

    setModalOpen(false);
    setEditingActivity(null);
    showToast(`Activity "${saved.title}" saved successfully.`);

    // Re-sync ordering with DB and invalidate Next.js router cache
    void fetchActivities({ silent: true });
    router.refresh();
  }

  async function handleConfirmDelete() {
    if (!deleteTarget) return;
    const target = deleteTarget;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/activities/${target.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error || "Delete failed");
      }
      setActivities((prev) => prev.filter((a) => a.id !== target.id));
      showToast(`Deleted activity "${target.title}".`);
      setDeleteTarget(null);
      void fetchActivities({ silent: true });
      router.refresh();
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Failed to delete activity", "error");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-6">
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 rounded-xl px-4 py-3 text-xs font-bold shadow-xl ${
            toast.type === "error"
              ? "bg-rose-600 text-white"
              : "bg-emerald-600 text-white"
          }`}
        >
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-primary text-[24px]">photo_library</span>
            <h1 className="font-headline-lg text-on-surface">Activities &amp; Photo Gallery Desk</h1>
          </div>
          <p className="mt-1 text-xs text-on-surface-variant">
            Publish, edit, and curate current and previous IPAM alumni event galleries with multiple photos and descriptions.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => fetchActivities({ silent: activities.length > 0 })}
            disabled={loading || refreshing}
            className="flex items-center gap-1.5 rounded-xl border border-outline-variant/50 bg-surface-container-lowest px-3 py-2 text-xs font-bold text-on-surface hover:bg-surface-container-high disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-[16px]">refresh</span>
            <span>{refreshing ? "Syncing..." : "Refresh"}</span>
          </button>
          <Link
            href="/activities"
            target="_blank"
            className="flex items-center gap-1.5 rounded-xl border border-outline-variant/50 bg-surface-container-lowest px-3.5 py-2 text-xs font-bold text-on-surface hover:bg-surface-container-high"
          >
            <span className="material-symbols-outlined text-[16px]">open_in_new</span>
            <span>View Public Gallery</span>
          </Link>
          <button
            type="button"
            onClick={() => {
              setEditingActivity(null);
              setModalOpen(true);
            }}
            className="flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-on-primary shadow-sm hover:opacity-90"
          >
            <span className="material-symbols-outlined text-[18px]">add_circle</span>
            <span>Add Activity</span>
          </button>
        </div>
      </div>

      {loadError && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-rose-300 bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-700">
          <span>{loadError}</span>
          <button
            type="button"
            onClick={() => fetchActivities()}
            className="rounded-lg bg-rose-600 px-3 py-1 text-[11px] font-bold text-white hover:bg-rose-700"
          >
            Retry
          </button>
        </div>
      )}

      {/* Stats Row */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-4">
          <p className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">Total Activities</p>
          <p className="mt-1 text-2xl font-black text-on-surface">{activities.length}</p>
        </div>
        <div className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-4">
          <p className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">Current Events</p>
          <p className="mt-1 text-2xl font-black text-emerald-600">{currentCount}</p>
        </div>
        <div className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-4">
          <p className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">Previous Archives</p>
          <p className="mt-1 text-2xl font-black text-on-surface">{previousCount}</p>
        </div>
        <div className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-4">
          <p className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">Total Photos</p>
          <p className="mt-1 text-2xl font-black text-primary">{totalPhotos}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          {(["ALL", "CURRENT", "PREVIOUS"] as const).map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setFilterStatus(st)}
              className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition-colors ${
                filterStatus === st
                  ? "bg-primary text-on-primary"
                  : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high"
              }`}
            >
              {st === "ALL" ? "All" : st === "CURRENT" ? "Current Events" : "Previous Events"}
            </button>
          ))}
        </div>

        <input
          type="search"
          name="activity_filter_query"
          autoComplete="off"
          disabled={modalOpen}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search title, description, or location..."
          className="w-full rounded-xl border border-outline-variant/40 bg-surface-container-low px-3.5 py-2 text-xs text-on-surface focus:border-primary focus:outline-none disabled:opacity-60 sm:w-72"
        />
      </div>

      {/* Activities List */}
      {loading ? (
        <div className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-12 text-center text-xs text-on-surface-variant">
          Loading activity galleries...
        </div>
      ) : filtered.length === 0 && activities.length > 0 ? (
        <div className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-12 text-center space-y-3">
          <p className="text-sm font-bold text-on-surface">No activities match your current search or filter</p>
          <p className="text-xs text-on-surface-variant">
            {activities.length} activity gallery item(s) exist in the database.
          </p>
          <button
            type="button"
            onClick={() => {
              setFilterStatus("ALL");
              setSearchQuery("");
            }}
            className="rounded-xl bg-primary px-4 py-2 text-xs font-bold text-on-primary hover:opacity-90"
          >
            Clear Filters &amp; Show All
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-12 text-center">
          <p className="text-sm font-bold text-on-surface">No activity galleries found</p>
          <p className="mt-1 text-xs text-on-surface-variant">
            Click &ldquo;Add Activity&rdquo; to publish a new gallery with multiple photos and details.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((item) => {
            const cover = item.photos[0] || "/images/alumni_gala_event_1788454750646.jpg";
            return (
              <div
                key={item.id}
                className="flex flex-col justify-between overflow-hidden rounded-2xl border border-outline-variant/30 bg-surface-container-lowest shadow-xs"
              >
                <div>
                  <div className="relative aspect-[16/9] w-full bg-slate-900">
                    <img src={cover} alt={item.title} className="h-full w-full object-cover" />
                    <span
                      className={`absolute left-3 top-3 rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase ${
                        item.status === "CURRENT"
                          ? "bg-emerald-600 text-white"
                          : "bg-slate-900/85 text-slate-200"
                      }`}
                    >
                      {item.status}
                    </span>
                    <span className="absolute bottom-2.5 right-2.5 rounded-full bg-slate-950/80 px-2.5 py-0.5 text-[11px] font-bold text-white">
                      {item.photos.length} Photos
                    </span>
                  </div>

                  {/* Mini strip */}
                  {item.photos.length > 1 && (
                    <div className="flex gap-1 border-b border-outline-variant/20 bg-surface-container-low p-1.5">
                      {item.photos.slice(0, 5).map((p, idx) => (
                        <img
                          key={idx}
                          src={p}
                          alt=""
                          className="h-9 w-12 rounded object-cover"
                        />
                      ))}
                    </div>
                  )}

                  <div className="space-y-2 p-4">
                    <div className="flex items-center justify-between gap-2 text-[11px] text-on-surface-variant">
                      <span className="font-bold text-primary">{item.category || "Activity"}</span>
                      <span>{item.displayDate || "No date"}</span>
                    </div>
                    <h3 className="line-clamp-2 text-sm font-extrabold text-on-surface">{item.title}</h3>
                    <p className="line-clamp-3 text-xs text-on-surface-variant">{item.description}</p>
                    {item.location && (
                      <p className="truncate text-[11px] font-medium text-on-surface-variant">
                        Location: {item.location}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 border-t border-outline-variant/20 bg-surface-container-low/50 p-3">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingActivity(item);
                      setModalOpen(true);
                    }}
                    className="flex flex-1 items-center justify-center gap-1 rounded-xl border border-outline-variant/50 bg-surface-container-lowest py-2 text-xs font-bold text-on-surface hover:bg-surface-container-high"
                  >
                    <span className="material-symbols-outlined text-[15px]">edit</span>
                    <span>Edit</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(item)}
                    className="flex items-center justify-center gap-1 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700 hover:bg-rose-100"
                  >
                    <span className="material-symbols-outlined text-[15px]">delete</span>
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit Modal */}
      {modalOpen && (
        <CreateEditActivityModal
          key={editingActivity?.id ?? "new"}
          activity={editingActivity}
          onClose={() => {
            setModalOpen(false);
            setEditingActivity(null);
          }}
          onSaved={handleSaved}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-xs"
          onClick={() => setDeleteTarget(null)}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-outline-variant/40 bg-surface-container-lowest p-6 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-base font-black text-on-surface">Delete Activity Gallery?</h3>
            <p className="text-xs text-on-surface-variant">
              Are you sure you want to permanently delete <strong>{deleteTarget.title}</strong> and its{" "}
              {deleteTarget.photos.length} photo(s)? This cannot be undone.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="rounded-xl border border-outline-variant/50 px-4 py-2 text-xs font-bold text-on-surface"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={handleConfirmDelete}
                className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white hover:bg-rose-700 disabled:opacity-50"
              >
                {deleting ? "Deleting..." : "Confirm Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
