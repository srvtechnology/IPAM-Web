"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAdminSession } from "@/lib/admin/context";
import AdminCreateEditBusinessModal from "./AdminCreateEditBusinessModal";

export interface AdminBusinessRow {
  id: string;
  name: string;
  founders: string;
  classYear: string;
  category: string;
  industry: string;
  tagline: string | null;
  description: string;
  website: string;
  location: string;
  contactEmail: string;
  contactPhone: string | null;
  image: string | null;
  bannerImage: string | null;
  logo: string | null;
  featured: boolean;
  status: string;
  submittedByType: string;
  rejectionReason: string | null;
  userId: string | null;
  services?: string[] | null;
  createdAt: string;
  user?: {
    email: string;
    profile?: {
      name: string;
      avatar: string | null;
    } | null;
  } | null;
}

const STATUS_BADGES: Record<string, { label: string; className: string; icon: string }> = {
  APPROVED: {
    label: "Approved",
    className: "bg-secondary/15 text-secondary border border-secondary/30",
    icon: "verified",
  },
  PENDING_APPROVAL: {
    label: "Pending Review",
    className: "bg-tertiary/15 text-tertiary border border-tertiary/30 animate-pulse",
    icon: "hourglass_top",
  },
  REJECTED: {
    label: "Needs Revision",
    className: "bg-error/15 text-error border border-error/30",
    icon: "warning",
  },
};

export default function AdminBusinessesTable({
  businesses: initialBusinesses,
  onBusinessesChange,
}: {
  businesses: AdminBusinessRow[];
  onBusinessesChange?: (businesses: AdminBusinessRow[]) => void;
}) {
  const router = useRouter();
  const { can } = useAdminSession();
  const canWrite = can("COMMERCIAL", "canWrite");
  const canDelete = can("COMMERCIAL", "canDelete");

  const [businesses, setBusinesses] = useState<AdminBusinessRow[]>(initialBusinesses);
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [featuredOnly, setFeaturedOnly] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<"newest" | "name" | "classYear" | "pendingFirst">("pendingFirst");
  const [searchQuery, setSearchQuery] = useState("");

  const [feedbackBanner, setFeedbackBanner] = useState<{
    type: "success" | "info" | "error";
    message: string;
  } | null>(null);

  // Sync state when props change
  useEffect(() => {
    setBusinesses(initialBusinesses);
  }, [initialBusinesses]);

  const updateBusinesses = useCallback(
    (updater: AdminBusinessRow[] | ((prev: AdminBusinessRow[]) => AdminBusinessRow[])) => {
      setBusinesses((prev) => {
        const next = typeof updater === "function" ? updater(prev) : updater;
        onBusinessesChange?.(next);
        return next;
      });
    },
    [onBusinessesChange]
  );

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editingBusiness, setEditingBusiness] = useState<AdminBusinessRow | null>(null);

  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const counts = useMemo(() => {
    return {
      total: businesses.length,
      pending: businesses.filter((b) => b.status === "PENDING_APPROVAL").length,
      approved: businesses.filter((b) => b.status === "APPROVED").length,
      rejected: businesses.filter((b) => b.status === "REJECTED").length,
      featured: businesses.filter((b) => b.featured).length,
    };
  }, [businesses]);

  // Dynamic category options derived from current businesses
  const availableCategories = useMemo(() => {
    const set = new Set<string>();
    businesses.forEach((b) => {
      if (b.category?.trim()) set.add(b.category.trim());
    });
    return Array.from(set).sort();
  }, [businesses]);

  const filteredBusinesses = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    let list = businesses.filter((b) => {
      if (filterStatus !== "ALL" && b.status !== filterStatus) return false;
      if (categoryFilter !== "ALL" && b.category !== categoryFilter) return false;
      if (featuredOnly && !b.featured) return false;

      if (!q) return true;
      return (
        (b.name?.toLowerCase() || "").includes(q) ||
        (b.founders?.toLowerCase() || "").includes(q) ||
        (b.category?.toLowerCase() || "").includes(q) ||
        (b.industry?.toLowerCase() || "").includes(q) ||
        (b.location?.toLowerCase() || "").includes(q) ||
        (b.contactEmail?.toLowerCase() || "").includes(q) ||
        (b.tagline?.toLowerCase() || "").includes(q) ||
        (b.description?.toLowerCase() || "").includes(q) ||
        (b.website?.toLowerCase() || "").includes(q) ||
        (Array.isArray(b.services) && b.services.some((s) => s.toLowerCase().includes(q))) ||
        (b.user?.email?.toLowerCase() || "").includes(q) ||
        (b.user?.profile?.name?.toLowerCase() || "").includes(q)
      );
    });

    // Sort
    return [...list].sort((a, b) => {
      if (sortBy === "pendingFirst") {
        if (a.status === "PENDING_APPROVAL" && b.status !== "PENDING_APPROVAL") return -1;
        if (b.status === "PENDING_APPROVAL" && a.status !== "PENDING_APPROVAL") return 1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      if (sortBy === "name") {
        return a.name.localeCompare(b.name);
      }
      if (sortBy === "classYear") {
        return (b.classYear || "").localeCompare(a.classYear || "");
      }
      // default: newest
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [businesses, filterStatus, categoryFilter, featuredOnly, searchQuery, sortBy]);

  // Toggle Featured status with optimistic update & rollback
  async function handleToggleFeatured(id: string, currentFeatured: boolean) {
    if (!canWrite) return;
    const target = businesses.find((b) => b.id === id);
    if (!target) return;

    const nextFeatured = !currentFeatured;

    // 1. Optimistic update
    updateBusinesses((prev) =>
      prev.map((b) => (b.id === id ? { ...b, featured: nextFeatured } : b))
    );
    setFeedbackBanner({
      type: "success",
      message: `"${target.name}" is now ${nextFeatured ? "pinned as Featured" : "unpinned from Featured"}.`,
    });

    setActionLoadingId(id);
    try {
      const res = await fetch(`/api/admin/businesses/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ featured: nextFeatured }),
      });

      if (!res.ok) {
        // Rollback
        updateBusinesses((prev) =>
          prev.map((b) => (b.id === id ? { ...b, featured: currentFeatured } : b))
        );
        setFeedbackBanner({
          type: "error",
          message: `Failed to update featured status for "${target.name}". Reverted.`,
        });
      } else {
        router.refresh();
      }
    } catch {
      // Rollback
      updateBusinesses((prev) =>
        prev.map((b) => (b.id === id ? { ...b, featured: currentFeatured } : b))
      );
      setFeedbackBanner({
        type: "error",
        message: `Network error updating "${target.name}". Reverted.`,
      });
    } finally {
      setActionLoadingId(null);
    }
  }

  async function handleApprove(id: string) {
    const target = businesses.find((b) => b.id === id);
    setActionLoadingId(id);

    // Optimistic update
    updateBusinesses((prev) =>
      prev.map((b) => (b.id === id ? { ...b, status: "APPROVED", rejectionReason: null } : b))
    );
    setFeedbackBanner({
      type: "success",
      message: `"${target?.name || "Enterprise"}" listing approved and published live.`,
    });

    try {
      const res = await fetch(`/api/admin/businesses/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "APPROVED", rejectionReason: null }),
      });
      if (!res.ok) {
        // Revert
        updateBusinesses((prev) =>
          prev.map((b) => (b.id === id ? { ...b, status: target?.status || "PENDING_APPROVAL" } : b))
        );
        setFeedbackBanner({
          type: "error",
          message: "Failed to approve business listing. Reverted.",
        });
      } else {
        router.refresh();
      }
    } catch {
      updateBusinesses((prev) =>
        prev.map((b) => (b.id === id ? { ...b, status: target?.status || "PENDING_APPROVAL" } : b))
      );
      setFeedbackBanner({
        type: "error",
        message: "Network error approving listing. Reverted.",
      });
    } finally {
      setActionLoadingId(null);
    }
  }

  async function handleConfirmReject() {
    if (!rejectingId) return;
    const target = businesses.find((b) => b.id === rejectingId);
    const reasonText = rejectReason.trim();

    setActionLoadingId(rejectingId);
    setRejectingId(null);
    setRejectReason("");

    // Optimistic update
    updateBusinesses((prev) =>
      prev.map((b) =>
        b.id === target?.id
          ? { ...b, status: "REJECTED", rejectionReason: reasonText || null }
          : b
      )
    );
    setFeedbackBanner({
      type: "info",
      message: `Listing "${target?.name || "Enterprise"}" marked as needing revision.`,
    });

    try {
      const res = await fetch(`/api/admin/businesses/${target?.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "REJECTED", rejectionReason: reasonText }),
      });
      if (!res.ok) {
        updateBusinesses((prev) =>
          prev.map((b) => (b.id === target?.id ? { ...b, status: target.status, rejectionReason: target.rejectionReason } : b))
        );
        setFeedbackBanner({
          type: "error",
          message: "Failed to reject business listing. Reverted.",
        });
      } else {
        router.refresh();
      }
    } catch {
      if (target) {
        updateBusinesses((prev) =>
          prev.map((b) => (b.id === target.id ? { ...b, status: target.status, rejectionReason: target.rejectionReason } : b))
        );
      }
      setFeedbackBanner({
        type: "error",
        message: "Network error updating business listing.",
      });
    } finally {
      setActionLoadingId(null);
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Are you sure you want to delete the business listing "${name}"? This action cannot be undone.`)) return;

    const target = businesses.find((b) => b.id === id);
    setActionLoadingId(id);

    // Optimistic remove
    updateBusinesses((prev) => prev.filter((b) => b.id !== id));
    setFeedbackBanner({
      type: "info",
      message: `Enterprise listing "${name}" deleted.`,
    });

    try {
      const res = await fetch(`/api/admin/businesses/${id}`, { method: "DELETE" });
      if (!res.ok) {
        if (target) updateBusinesses((prev) => [target, ...prev]);
        setFeedbackBanner({
          type: "error",
          message: `Failed to delete "${name}". Reverted.`,
        });
      } else {
        router.refresh();
      }
    } catch {
      if (target) updateBusinesses((prev) => [target, ...prev]);
      setFeedbackBanner({
        type: "error",
        message: `Network error deleting "${name}". Reverted.`,
      });
    } finally {
      setActionLoadingId(null);
    }
  }

  return (
    <div className="space-y-5">
      {/* Feedback Banner */}
      {feedbackBanner && (
        <div
          className={`flex items-center justify-between rounded-xl border p-3.5 text-xs font-bold transition-all shadow-sm animate-in fade-in duration-150 ${
            feedbackBanner.type === "success"
              ? "border-secondary/40 bg-secondary/10 text-secondary"
              : feedbackBanner.type === "error"
              ? "border-error/40 bg-error/10 text-error"
              : "border-primary/40 bg-primary/10 text-primary"
          }`}
        >
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">
              {feedbackBanner.type === "success"
                ? "check_circle"
                : feedbackBanner.type === "error"
                ? "error"
                : "info"}
            </span>
            <span>{feedbackBanner.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedbackBanner(null)}
            className="text-on-surface-variant hover:text-on-surface p-1 rounded-md"
          >
            <span className="material-symbols-outlined text-[16px]">close</span>
          </button>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <div className="rounded-xl border border-outline-variant/20 bg-surface-container p-3.5">
          <div className="font-table-header uppercase text-on-surface-variant text-[11px]">Total Listed</div>
          <div className="mt-1 text-2xl font-bold font-headline-md text-on-surface">{counts.total}</div>
        </div>
        <div className="rounded-xl border border-tertiary/30 bg-tertiary/10 p-3.5 relative overflow-hidden">
          <div className="font-table-header uppercase text-tertiary text-[11px] flex items-center justify-between">
            <span>Pending Review</span>
            {counts.pending > 0 && <span className="h-2 w-2 rounded-full bg-tertiary animate-ping" />}
          </div>
          <div className="mt-1 text-2xl font-bold font-headline-md text-tertiary">{counts.pending}</div>
        </div>
        <div className="rounded-xl border border-secondary/30 bg-secondary/10 p-3.5">
          <div className="font-table-header uppercase text-secondary text-[11px]">Approved &amp; Live</div>
          <div className="mt-1 text-2xl font-bold font-headline-md text-secondary">{counts.approved}</div>
        </div>
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3.5">
          <div className="font-table-header uppercase text-amber-500 text-[11px]">Featured Highlights</div>
          <div className="mt-1 text-2xl font-bold font-headline-md text-amber-500">{counts.featured}</div>
        </div>
        <div className="rounded-xl border border-error/30 bg-error/10 p-3.5">
          <div className="font-table-header uppercase text-error text-[11px]">Changes Requested</div>
          <div className="mt-1 text-2xl font-bold font-headline-md text-error">{counts.rejected}</div>
        </div>
      </div>

      {/* Action / Search / Filter Header */}
      <div className="rounded-2xl border border-outline-variant/20 bg-surface-container p-4 space-y-3.5">
        {/* Top row: Status pills + View Mode Switch */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: "ALL", label: "All", count: counts.total },
              { id: "PENDING_APPROVAL", label: "Pending Review", count: counts.pending, alert: counts.pending > 0 },
              { id: "APPROVED", label: "Approved", count: counts.approved },
              { id: "REJECTED", label: "Needs Revision", count: counts.rejected },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilterStatus(tab.id)}
                className={`relative flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                  filterStatus === tab.id
                    ? "bg-primary-container text-on-primary-container shadow-xs"
                    : "bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest hover:text-on-surface"
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`rounded-full px-1.5 py-0.2 text-[10px] font-extrabold ${
                    filterStatus === tab.id
                      ? "bg-on-primary-container/20 text-on-primary-container"
                      : "bg-surface-container text-on-surface-variant"
                  }`}
                >
                  {tab.count}
                </span>
                {tab.alert && filterStatus !== tab.id && (
                  <span className="h-2 w-2 rounded-full bg-tertiary animate-pulse" />
                )}
              </button>
            ))}

            <button
              type="button"
              onClick={() => setFeaturedOnly((prev) => !prev)}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all border ${
                featuredOnly
                  ? "bg-amber-500/20 text-amber-400 border-amber-500/50 shadow-xs"
                  : "border-outline-variant/30 text-on-surface-variant hover:bg-surface-container-high"
              }`}
            >
              <span className="material-symbols-outlined text-[16px] text-amber-400">star</span>
              <span>Featured Only ({counts.featured})</span>
            </button>
          </div>

          {/* View mode toggle (Cards vs Table) */}
          <div className="flex items-center gap-2">
            <div className="flex items-center rounded-lg border border-outline-variant/30 bg-surface-container-low p-0.5">
              <button
                type="button"
                onClick={() => setViewMode("cards")}
                title="Visual Cards Grid"
                className={`flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-bold transition-all ${
                  viewMode === "cards"
                    ? "bg-surface-container-highest text-primary shadow-xs"
                    : "text-on-surface-variant hover:text-on-surface"
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">grid_view</span>
                <span className="hidden sm:inline">Cards</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode("table")}
                title="Dense Data Table"
                className={`flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-bold transition-all ${
                  viewMode === "table"
                    ? "bg-surface-container-highest text-primary shadow-xs"
                    : "text-on-surface-variant hover:text-on-surface"
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">table_rows</span>
                <span className="hidden sm:inline">Table</span>
              </button>
            </div>

            {canWrite && (
              <button
                type="button"
                onClick={() => setCreateModalOpen(true)}
                className="flex items-center gap-1.5 whitespace-nowrap rounded-lg bg-primary-container px-3.5 py-1.5 text-xs font-bold text-on-primary-container hover:opacity-90 transition-opacity shadow-xs"
              >
                <span className="material-symbols-outlined text-[16px]">add_business</span>
                <span>Add Enterprise</span>
              </button>
            )}
          </div>
        </div>

        {/* Second row: Search + Category filter + Sort options */}
        <div className="flex flex-col gap-2.5 pt-2 border-t border-outline-variant/10 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 sm:max-w-md">
            <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-[18px] text-on-surface-variant">
              search
            </span>
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by enterprise name, founder, services, sector, location..."
              className="w-full rounded-lg border border-outline-variant/30 bg-surface-container-low py-1.5 pl-8 pr-7 text-xs text-on-surface focus:outline-primary placeholder:text-on-surface-variant/60"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface p-0.5"
                title="Clear search"
              >
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Category Dropdown */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="rounded-lg border border-outline-variant/30 bg-surface-container-low px-2.5 py-1.5 text-xs font-semibold text-on-surface outline-none focus:border-primary"
            >
              <option value="ALL">All Categories ({businesses.length})</option>
              {availableCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat} ({businesses.filter((b) => b.category === cat).length})
                </option>
              ))}
            </select>

            {/* Sort Dropdown */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="rounded-lg border border-outline-variant/30 bg-surface-container-low px-2.5 py-1.5 text-xs font-semibold text-on-surface outline-none focus:border-primary"
            >
              <option value="pendingFirst">Sort: Pending Review First</option>
              <option value="newest">Sort: Newest Listed</option>
              <option value="name">Sort: Name (A-Z)</option>
              <option value="classYear">Sort: Class Year</option>
            </select>
          </div>
        </div>
      </div>

      {/* VIEW MODE 1: VISUAL CARDS GRID */}
      {viewMode === "cards" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredBusinesses.map((b) => {
            const banner = b.bannerImage || b.image;
            const badge = STATUS_BADGES[b.status] ?? {
              label: b.status,
              className: "bg-surface-container-high text-on-surface",
              icon: "info",
            };
            const services = Array.isArray(b.services) ? b.services : [];

            return (
              <div
                key={b.id}
                className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-outline-variant/20 bg-surface-container hover:border-outline-variant/40 hover:shadow-lg transition-all"
              >
                {/* Card Top: Banner Creative + Badges + Featured Star Toggle */}
                <div className="relative h-36 w-full overflow-hidden bg-gradient-to-br from-slate-800 to-slate-950">
                  {banner ? (
                    <img
                      src={banner}
                      alt={b.name}
                      className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="flex h-full w-full flex-col items-center justify-center text-slate-500">
                      <span className="material-symbols-outlined text-[36px] opacity-40">storefront</span>
                      <span className="text-[11px] font-semibold opacity-60">Alumni Enterprise</span>
                    </div>
                  )}

                  {/* Gradient Overlay for contrast */}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent" />

                  {/* Status Badge Top Left */}
                  <div className="absolute left-3 top-3">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold backdrop-blur-xs ${badge.className}`}
                    >
                      <span className="material-symbols-outlined text-[13px]">{badge.icon}</span>
                      <span>{badge.label}</span>
                    </span>
                  </div>

                  {/* Featured Golden Star Toggle Button Top Right */}
                  <div className="absolute right-3 top-3">
                    <button
                      type="button"
                      disabled={!canWrite || actionLoadingId === b.id}
                      onClick={() => handleToggleFeatured(b.id, b.featured)}
                      title={b.featured ? "Featured on Home & Directory (Click to Unpin)" : "Click to Pin as Featured"}
                      className={`flex h-8 w-8 items-center justify-center rounded-full transition-all shadow-md ${
                        b.featured
                          ? "bg-amber-500 text-white shadow-amber-500/30 scale-105 hover:bg-amber-600"
                          : "bg-slate-900/70 text-slate-300 hover:text-amber-400 hover:bg-slate-900/90 backdrop-blur-xs"
                      }`}
                    >
                      <span
                        className={`material-symbols-outlined text-[18px] ${
                          b.featured ? "font-fill" : ""
                        }`}
                      >
                        star
                      </span>
                    </button>
                  </div>

                  {/* Logo overlay bottom left */}
                  <div className="absolute left-4 -bottom-4 z-10 flex h-14 w-14 items-center justify-center rounded-xl border-2 border-surface-container bg-surface-container-highest shadow-md overflow-hidden">
                    {b.logo ? (
                      <img src={b.logo} alt={b.name} className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-sm font-bold text-primary">
                        {b.name.substring(0, 2).toUpperCase()}
                      </span>
                    )}
                  </div>
                </div>

                {/* Card Body */}
                <div className="flex-1 p-4 pt-6 space-y-3">
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-bold font-headline-sm text-on-surface text-base line-clamp-1 group-hover:text-primary transition-colors">
                        {b.name}
                      </h3>
                      {b.classYear && (
                        <span className="shrink-0 rounded bg-surface-container-high px-1.5 py-0.5 text-[10px] font-mono font-bold text-on-surface-variant">
                          &apos;{b.classYear.slice(-2)}
                        </span>
                      )}
                    </div>
                    {b.tagline ? (
                      <p className="font-body-compact text-on-surface-variant text-xs line-clamp-2 mt-1">
                        {b.tagline}
                      </p>
                    ) : (
                      <p className="font-body-compact text-on-surface-variant/70 text-xs line-clamp-2 mt-1">
                        {b.description}
                      </p>
                    )}
                  </div>

                  {/* Founder & Submitter */}
                  <div className="flex items-center justify-between text-[11px] border-t border-outline-variant/10 pt-2.5">
                    <div className="flex items-center gap-1.5 text-on-surface truncate">
                      <span className="material-symbols-outlined text-[15px] text-primary">person</span>
                      <span className="font-semibold truncate">{b.founders}</span>
                    </div>

                    {b.submittedByType === "ADMIN" ? (
                      <span className="shrink-0 rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold text-primary">
                        Verified Admin
                      </span>
                    ) : (
                      <span className="shrink-0 text-on-surface-variant text-[10px]">
                        Alumni Contributed
                      </span>
                    )}
                  </div>

                  {/* Category & Location Badges */}
                  <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                    <span className="rounded-md bg-surface-container-high px-2 py-0.5 font-semibold text-on-surface">
                      {b.category}
                    </span>
                    {b.industry && b.industry !== b.category && (
                      <span className="rounded-md bg-surface-container-high/60 px-2 py-0.5 text-on-surface-variant">
                        {b.industry}
                      </span>
                    )}
                    <span className="flex items-center gap-0.5 text-on-surface-variant">
                      <span className="material-symbols-outlined text-[13px]">location_on</span>
                      <span>{b.location}</span>
                    </span>
                  </div>

                  {/* Services pills */}
                  {services.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {services.slice(0, 3).map((svc, idx) => (
                        <span
                          key={idx}
                          className="rounded bg-surface-container-lowest px-1.5 py-0.5 text-[9px] font-medium text-on-surface-variant border border-outline-variant/20"
                        >
                          {svc}
                        </span>
                      ))}
                      {services.length > 3 && (
                        <span className="rounded bg-surface-container-lowest px-1 py-0.5 text-[9px] text-on-surface-variant/70">
                          +{services.length - 3} more
                        </span>
                      )}
                    </div>
                  )}

                  {/* Rejection Note if Rejected */}
                  {b.status === "REJECTED" && b.rejectionReason && (
                    <div className="rounded-lg bg-error/10 border border-error/20 p-2 text-[11px] text-error">
                      <span className="font-bold">Feedback: </span>
                      {b.rejectionReason}
                    </div>
                  )}
                </div>

                {/* Card Action Bar */}
                <div className="border-t border-outline-variant/15 bg-surface-container-high/30 p-3 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1">
                    {/* Public Profile Link */}
                    <Link
                      href={`/businesses/${b.id}`}
                      target="_blank"
                      title="View Public Profile"
                      className="flex h-7 items-center gap-1 rounded-lg px-2 text-xs font-semibold text-primary hover:bg-primary-container/20 transition-colors"
                    >
                      <span className="material-symbols-outlined text-[15px]">open_in_new</span>
                      <span>Public</span>
                    </Link>

                    {b.website && (
                      <a
                        href={b.website.startsWith("http") ? b.website : `https://${b.website}`}
                        target="_blank"
                        rel="noreferrer"
                        title={b.website}
                        className="flex h-7 w-7 items-center justify-center rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest transition-colors"
                      >
                        <span className="material-symbols-outlined text-[16px]">language</span>
                      </a>
                    )}
                  </div>

                  {/* Approval / Reject / Edit / Delete buttons */}
                  <div className="flex items-center gap-1.5">
                    {canWrite && b.status === "PENDING_APPROVAL" ? (
                      <>
                        <button
                          type="button"
                          disabled={actionLoadingId === b.id}
                          onClick={() => handleApprove(b.id)}
                          className="flex items-center gap-1 rounded-lg bg-secondary px-2.5 py-1 text-xs font-bold text-on-secondary shadow-xs hover:opacity-90 transition-opacity disabled:opacity-50"
                        >
                          <span className="material-symbols-outlined text-[14px]">check</span>
                          <span>Approve</span>
                        </button>
                        <button
                          type="button"
                          disabled={actionLoadingId === b.id}
                          onClick={() => {
                            setRejectingId(b.id);
                            setRejectReason("");
                          }}
                          className="flex items-center gap-1 rounded-lg bg-error/15 px-2.5 py-1 text-xs font-bold text-error hover:bg-error/25 transition-colors disabled:opacity-50"
                        >
                          <span className="material-symbols-outlined text-[14px]">close</span>
                          <span>Reject</span>
                        </button>
                      </>
                    ) : (
                      <>
                        {canWrite && (
                          <button
                            type="button"
                            title="Edit Listing"
                            onClick={() => setEditingBusiness(b)}
                            className="flex h-7 w-7 items-center justify-center rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest transition-colors"
                          >
                            <span className="material-symbols-outlined text-[17px]">edit</span>
                          </button>
                        )}
                        {canDelete && (
                          <button
                            type="button"
                            title="Delete Listing"
                            disabled={actionLoadingId === b.id}
                            onClick={() => handleDelete(b.id, b.name)}
                            className="flex h-7 w-7 items-center justify-center rounded-lg text-error hover:bg-error/15 transition-colors disabled:opacity-50"
                          >
                            <span className="material-symbols-outlined text-[17px]">delete</span>
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {filteredBusinesses.length === 0 && (
            <div className="col-span-full py-16 text-center text-on-surface-variant font-body-default rounded-2xl border border-dashed border-outline-variant/30 bg-surface-container p-6">
              <span className="material-symbols-outlined text-[42px] block mb-2 opacity-50">search_off</span>
              <p className="font-bold text-base text-on-surface">No alumni enterprises match your filters</p>
              <p className="text-xs text-on-surface-variant mt-1">
                Try widening your search terms or clearing your status and category filters.
              </p>
              <div className="mt-4 flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    setFilterStatus("ALL");
                    setCategoryFilter("ALL");
                    setFeaturedOnly(false);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-surface-container-high px-4 py-2 text-xs font-bold text-primary hover:bg-surface-container-highest transition-colors shadow-xs"
                >
                  <span className="material-symbols-outlined text-[16px]">restart_alt</span>
                  <span>Reset All Filters</span>
                </button>
                {canWrite && (
                  <button
                    type="button"
                    onClick={() => setCreateModalOpen(true)}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-primary-container px-4 py-2 text-xs font-bold text-on-primary-container shadow-xs hover:opacity-90"
                  >
                    <span className="material-symbols-outlined text-[16px]">add_business</span>
                    <span>Add New Enterprise</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* VIEW MODE 2: DENSE DATA TABLE */}
      {viewMode === "table" && (
        <div className="overflow-hidden overflow-x-auto rounded-xl border border-outline-variant/20 bg-surface-container shadow-xs">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-outline-variant/20 font-table-header uppercase text-on-surface-variant text-[11px] bg-surface-container-high/40">
                <th className="px-3 py-3 text-center">Featured</th>
                <th className="px-4 py-3">Business &amp; Banner</th>
                <th className="px-4 py-3">Founder / Submitter</th>
                <th className="px-4 py-3">Category &amp; Sector</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredBusinesses.map((b) => {
                const banner = b.bannerImage || b.image;
                const badge = STATUS_BADGES[b.status] ?? {
                  label: b.status,
                  className: "bg-surface-container-high text-on-surface",
                  icon: "info",
                };

                return (
                  <tr
                    key={b.id}
                    className="border-b border-outline-variant/10 last:border-0 hover:bg-surface-container-high/50 transition-colors"
                  >
                    {/* Featured Star Toggle */}
                    <td className="px-3 py-3 text-center">
                      <button
                        type="button"
                        disabled={!canWrite || actionLoadingId === b.id}
                        onClick={() => handleToggleFeatured(b.id, b.featured)}
                        title={b.featured ? "Featured on Home & Directory (Click to Unpin)" : "Click to Pin as Featured"}
                        className={`inline-flex h-7 w-7 items-center justify-center rounded-full transition-all ${
                          b.featured
                            ? "bg-amber-500/20 text-amber-500 hover:bg-amber-500/30"
                            : "text-on-surface-variant/40 hover:text-amber-500 hover:bg-surface-container-high"
                        }`}
                      >
                        <span className="material-symbols-outlined text-[18px]">
                          {b.featured ? "star" : "star_outline"}
                        </span>
                      </button>
                    </td>

                    {/* Business & Banner Thumbnail */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="relative h-12 w-20 shrink-0 overflow-hidden rounded-lg border border-outline-variant/20 bg-surface-container-highest">
                          {banner ? (
                            <img src={banner} alt={b.name} className="h-full w-full object-cover" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-on-surface-variant">
                              <span className="material-symbols-outlined text-[20px]">storefront</span>
                            </div>
                          )}
                          {b.featured && (
                            <span
                              title="Featured"
                              className="absolute left-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-white shadow-xs"
                            >
                              <span className="material-symbols-outlined text-[10px]">star</span>
                            </span>
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="font-body-medium font-bold text-on-surface truncate flex items-center gap-1.5">
                            <span>{b.name}</span>
                            {b.classYear && (
                              <span className="text-[10px] text-on-surface-variant font-mono">
                                &apos;{b.classYear.slice(-2)}
                              </span>
                            )}
                          </div>
                          {b.tagline && (
                            <div className="font-body-compact text-on-surface-variant truncate max-w-xs text-[11px]">
                              {b.tagline}
                            </div>
                          )}
                          <div className="text-[10px] text-on-surface-variant/80">{b.location}</div>
                        </div>
                      </div>
                    </td>

                    {/* Founder & Submitter */}
                    <td className="px-4 py-3">
                      <div className="font-body-medium text-on-surface">{b.founders}</div>
                      <div className="text-[11px]">
                        {b.submittedByType === "ADMIN" ? (
                          <span className="inline-flex items-center gap-1 rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold text-primary">
                            <span className="material-symbols-outlined text-[11px]">shield</span> Admin Listing
                          </span>
                        ) : (
                          <span className="text-on-surface-variant text-[11px]">
                            Alumni: {b.user?.profile?.name || b.user?.email || "Submitted"}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Category & Location */}
                    <td className="px-4 py-3">
                      <div className="inline-block rounded-md bg-surface-container-high px-2 py-0.5 font-body-compact text-[11px] font-semibold text-on-surface">
                        {b.category}
                      </div>
                      {b.industry && b.industry !== b.category && (
                        <div className="text-[10px] text-on-surface-variant mt-0.5">{b.industry}</div>
                      )}
                    </td>

                    {/* Status Badge */}
                    <td className="px-4 py-3">
                      <span className={`px-2.5 py-0.5 rounded-full font-body-compact text-[11px] font-bold ${badge.className}`}>
                        {badge.label}
                      </span>
                      {b.rejectionReason && (
                        <div className="text-[10px] text-error mt-0.5 max-w-xs truncate" title={b.rejectionReason}>
                          Note: {b.rejectionReason}
                        </div>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* One-click Approval */}
                        {canWrite && b.status === "PENDING_APPROVAL" && (
                          <>
                            <button
                              type="button"
                              title="Approve Business Listing"
                              disabled={actionLoadingId === b.id}
                              onClick={() => handleApprove(b.id)}
                              className="flex items-center gap-1 rounded-lg bg-secondary/15 px-2.5 py-1 text-xs font-bold text-secondary hover:bg-secondary/25 transition-colors disabled:opacity-50"
                            >
                              <span className="material-symbols-outlined text-[16px]">check_circle</span>
                              <span>Approve</span>
                            </button>

                            <button
                              type="button"
                              title="Reject Business Listing"
                              disabled={actionLoadingId === b.id}
                              onClick={() => {
                                setRejectingId(b.id);
                                setRejectReason("");
                              }}
                              className="flex items-center gap-1 rounded-lg bg-error/15 px-2.5 py-1 text-xs font-bold text-error hover:bg-error/25 transition-colors disabled:opacity-50"
                            >
                              <span className="material-symbols-outlined text-[16px]">cancel</span>
                              <span>Reject</span>
                            </button>
                          </>
                        )}

                        {/* Edit Button */}
                        {canWrite && (
                          <button
                            type="button"
                            title="Edit Listing"
                            onClick={() => setEditingBusiness(b)}
                            className="rounded-lg p-1.5 text-on-surface-variant hover:bg-surface-container-high transition-colors"
                          >
                            <span className="material-symbols-outlined text-[18px]">edit</span>
                          </button>
                        )}

                        {/* View Link */}
                        <Link
                          href={`/businesses/${b.id}`}
                          target="_blank"
                          title="View Public Profile"
                          className="rounded-lg p-1.5 text-on-surface-variant hover:bg-surface-container-high transition-colors"
                        >
                          <span className="material-symbols-outlined text-[18px]">open_in_new</span>
                        </Link>

                        {/* Delete Button */}
                        {canDelete && (
                          <button
                            type="button"
                            title="Delete Listing"
                            disabled={actionLoadingId === b.id}
                            onClick={() => handleDelete(b.id, b.name)}
                            className="rounded-lg p-1.5 text-error hover:bg-error/15 transition-colors disabled:opacity-50"
                          >
                            <span className="material-symbols-outlined text-[18px]">delete</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredBusinesses.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-on-surface-variant font-body-default">
                    <span className="material-symbols-outlined text-[36px] block mb-2 opacity-60">search_off</span>
                    <p className="font-bold text-on-surface">No alumni businesses found matching the selected filter.</p>
                    <div className="mt-3">
                      <button
                        type="button"
                        onClick={() => {
                          setSearchQuery("");
                          setFilterStatus("ALL");
                          setCategoryFilter("ALL");
                          setFeaturedOnly(false);
                        }}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-surface-container-high px-3.5 py-1.5 text-xs font-bold text-primary hover:bg-surface-container-highest transition-colors shadow-xs"
                      >
                        <span className="material-symbols-outlined text-[16px]">restart_alt</span>
                        <span>Reset Filters &amp; Show All ({businesses.length})</span>
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Reject Modal */}
      {rejectingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-outline-variant/30 bg-surface-container p-6 text-on-surface shadow-2xl">
            <h3 className="text-base font-bold font-headline-md text-error flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px]">cancel</span>
              Request Revisions for Listing
            </h3>
            <p className="mt-1 font-body-compact text-on-surface-variant text-xs">
              Provide feedback explaining what information or criteria need to be updated before this listing can be approved.
            </p>

            <textarea
              rows={3}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g. Please upload an official logo and provide verifiable alumni founder details..."
              className="mt-3 w-full rounded-lg border border-outline-variant/30 bg-surface-container-high p-3 text-xs text-on-surface focus:outline-primary"
            />

            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setRejectingId(null)}
                className="rounded-lg border border-outline-variant/30 px-3 py-1.5 text-xs font-bold text-on-surface-variant hover:bg-surface-container-high"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actionLoadingId === rejectingId}
                onClick={handleConfirmReject}
                className="rounded-lg bg-error px-4 py-1.5 text-xs font-bold text-on-error hover:opacity-90"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {createModalOpen && (
        <AdminCreateEditBusinessModal
          mode="create"
          onClose={() => setCreateModalOpen(false)}
          onSuccess={(created) => {
            setSearchQuery("");
            setFilterStatus("ALL");
            setCategoryFilter("ALL");

            if (created && created.id) {
              const row: AdminBusinessRow = {
                id: created.id,
                name: created.name,
                founders: created.founders,
                classYear: String(created.classYear || ""),
                category: created.category,
                industry: created.industry,
                tagline: created.tagline ?? null,
                description: created.description,
                website: created.website,
                location: created.location,
                contactEmail: created.contactEmail,
                contactPhone: created.contactPhone ?? null,
                image: created.image ?? null,
                bannerImage: created.bannerImage ?? null,
                logo: created.logo ?? null,
                featured: Boolean(created.featured),
                status: created.status ?? "APPROVED",
                submittedByType: created.submittedByType ?? "ADMIN",
                rejectionReason: created.rejectionReason ?? null,
                userId: created.userId ?? null,
                services: Array.isArray(created.services) ? created.services : null,
                createdAt: typeof created.createdAt === "string" ? created.createdAt : new Date().toISOString(),
                user: created.user ?? null,
              };
              updateBusinesses((prev) => [row, ...prev.filter((b) => b.id !== row.id)]);
            }

            fetch("/api/admin/businesses")
              .then((r) => r.json())
              .then((d) => {
                if (Array.isArray(d.data?.businesses)) {
                  updateBusinesses(d.data.businesses);
                }
              })
              .catch(() => {});

            router.refresh();

            setFeedbackBanner({
              type: "success",
              message: `"${created?.name || "Enterprise"}" has been successfully added to Alumni Enterprises.`,
            });
          }}
        />
      )}

      {/* Edit Modal */}
      {editingBusiness && (
        <AdminCreateEditBusinessModal
          mode="edit"
          initialData={editingBusiness}
          onClose={() => setEditingBusiness(null)}
          onSuccess={(updated) => {
            if (updated && updated.id) {
              updateBusinesses((prev) =>
                prev.map((b) => (b.id === updated.id ? { ...b, ...updated } : b))
              );
            }
            fetch("/api/admin/businesses")
              .then((r) => r.json())
              .then((d) => {
                if (Array.isArray(d.data?.businesses)) {
                  updateBusinesses(d.data.businesses);
                }
              })
              .catch(() => {});
            router.refresh();

            setFeedbackBanner({
              type: "success",
              message: `"${updated?.name || "Enterprise"}" was updated successfully.`,
            });
          }}
        />
      )}
    </div>
  );
}
