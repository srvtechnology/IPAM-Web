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

const STATUS_BADGES: Record<string, { label: string; className: string }> = {
  APPROVED: {
    label: "Approved",
    className: "bg-secondary/15 text-secondary border border-secondary/30",
  },
  PENDING_APPROVAL: {
    label: "Pending Review",
    className: "bg-tertiary/15 text-tertiary border border-tertiary/30",
  },
  REJECTED: {
    label: "Rejected",
    className: "bg-error/15 text-error border border-error/30",
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

  const [businesses, setBusinesses] = useState<AdminBusinessRow[]>(initialBusinesses);
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [feedbackBanner, setFeedbackBanner] = useState<{
    type: "success" | "info";
    message: string;
  } | null>(null);

  // Sync state when props change from server layout / parent
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
    };
  }, [businesses]);

  const filteredBusinesses = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return businesses.filter((b) => {
      if (filterStatus !== "ALL" && b.status !== filterStatus) return false;
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
        (b.user?.email?.toLowerCase() || "").includes(q) ||
        (b.user?.profile?.name?.toLowerCase() || "").includes(q)
      );
    });
  }, [businesses, filterStatus, searchQuery]);

  async function handleApprove(id: string) {
    setActionLoadingId(id);
    try {
      const res = await fetch(`/api/admin/businesses/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "APPROVED", rejectionReason: null }),
      });
      if (res.ok) {
        updateBusinesses((prev) =>
          prev.map((b) => (b.id === id ? { ...b, status: "APPROVED", rejectionReason: null } : b))
        );
        setFeedbackBanner({
          type: "success",
          message: "Enterprise listing approved and published live.",
        });
        router.refresh();
      }
    } finally {
      setActionLoadingId(null);
    }
  }

  async function handleConfirmReject() {
    if (!rejectingId) return;
    setActionLoadingId(rejectingId);
    try {
      const res = await fetch(`/api/admin/businesses/${rejectingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "REJECTED", rejectionReason: rejectReason.trim() }),
      });
      if (res.ok) {
        updateBusinesses((prev) =>
          prev.map((b) =>
            b.id === rejectingId
              ? { ...b, status: "REJECTED", rejectionReason: rejectReason.trim() }
              : b
          )
        );
        setRejectingId(null);
        setRejectReason("");
        setFeedbackBanner({
          type: "info",
          message: "Enterprise listing rejected with feedback note.",
        });
        router.refresh();
      }
    } finally {
      setActionLoadingId(null);
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Are you sure you want to delete the business listing "${name}"?`)) return;
    setActionLoadingId(id);
    try {
      const res = await fetch(`/api/admin/businesses/${id}`, { method: "DELETE" });
      if (res.ok) {
        updateBusinesses((prev) => prev.filter((b) => b.id !== id));
        setFeedbackBanner({
          type: "info",
          message: `Enterprise listing "${name}" deleted.`,
        });
        router.refresh();
      }
    } finally {
      setActionLoadingId(null);
    }
  }

  return (
    <div className="space-y-4">
      {/* Feedback Banner */}
      {feedbackBanner && (
        <div
          className={`flex items-center justify-between rounded-xl border p-3.5 text-xs font-bold transition-all ${
            feedbackBanner.type === "success"
              ? "border-secondary/40 bg-secondary/10 text-secondary"
              : "border-primary/40 bg-primary/10 text-primary"
          }`}
        >
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">
              {feedbackBanner.type === "success" ? "check_circle" : "info"}
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
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-outline-variant/20 bg-surface-container p-3.5">
          <div className="font-table-header uppercase text-on-surface-variant">Total Listed</div>
          <div className="mt-1 text-2xl font-bold font-headline-md text-on-surface">{counts.total}</div>
        </div>
        <div className="rounded-xl border border-tertiary/30 bg-tertiary/10 p-3.5">
          <div className="font-table-header uppercase text-tertiary">Pending Review</div>
          <div className="mt-1 text-2xl font-bold font-headline-md text-tertiary">{counts.pending}</div>
        </div>
        <div className="rounded-xl border border-secondary/30 bg-secondary/10 p-3.5">
          <div className="font-table-header uppercase text-secondary">Approved &amp; Live</div>
          <div className="mt-1 text-2xl font-bold font-headline-md text-secondary">{counts.approved}</div>
        </div>
        <div className="rounded-xl border border-error/30 bg-error/10 p-3.5">
          <div className="font-table-header uppercase text-error">Changes Requested</div>
          <div className="mt-1 text-2xl font-bold font-headline-md text-error">{counts.rejected}</div>
        </div>
      </div>

      {/* Action / Search Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          {["ALL", "PENDING_APPROVAL", "APPROVED", "REJECTED"].map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                filterStatus === st
                  ? "bg-primary-container text-on-primary-container shadow-xs"
                  : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"
              }`}
            >
              {st === "ALL" && `All (${counts.total})`}
              {st === "PENDING_APPROVAL" && `Pending (${counts.pending})`}
              {st === "APPROVED" && `Approved (${counts.approved})`}
              {st === "REJECTED" && `Rejected (${counts.rejected})`}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-64">
            <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-[18px] text-on-surface-variant">
              search
            </span>
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search enterprises..."
              className="w-full rounded-lg border border-outline-variant/30 bg-surface-container py-1.5 pl-8 pr-7 text-xs text-on-surface focus:outline-primary"
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

          {canWrite && (
            <button
              type="button"
              onClick={() => setCreateModalOpen(true)}
              className="flex items-center gap-1.5 whitespace-nowrap rounded-lg bg-primary-container px-3.5 py-1.5 font-body-medium text-on-primary-container hover:opacity-90 transition-opacity"
            >
              <span className="material-symbols-outlined text-[18px]">add_business</span>
              <span>Add Business</span>
            </button>
          )}
        </div>
      </div>

      {/* Businesses Table */}
      <div className="overflow-hidden overflow-x-auto rounded-xl border border-outline-variant/20 bg-surface-container">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-outline-variant/20 font-table-header uppercase text-on-surface-variant">
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
              };

              return (
                <tr
                  key={b.id}
                  className="border-b border-outline-variant/10 last:border-0 hover:bg-surface-container-high/50 transition-colors"
                >
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
                            className="absolute left-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-secondary text-on-secondary shadow-xs"
                          >
                            <span className="material-symbols-outlined text-[10px]">star</span>
                          </span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="font-body-medium font-bold text-on-surface truncate">{b.name}</div>
                        {b.tagline && (
                          <div className="font-body-compact text-on-surface-variant truncate max-w-xs text-[11px]">
                            {b.tagline}
                          </div>
                        )}
                        <div className="text-[10px] text-on-surface-variant/80">Class {b.classYear}</div>
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
                        <span className="text-on-surface-variant">
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
                    <div className="text-[11px] text-on-surface-variant mt-0.5">{b.location}</div>
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
                      {canWrite && (
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
                <td colSpan={5} className="py-12 text-center text-on-surface-variant font-body-default">
                  <span className="material-symbols-outlined text-[36px] block mb-2 opacity-60">search_off</span>
                  <p className="font-bold text-on-surface">No alumni businesses found matching the selected filter.</p>
                  {(searchQuery || filterStatus !== "ALL") && (
                    <div className="mt-3">
                      <button
                        type="button"
                        onClick={() => {
                          setSearchQuery("");
                          setFilterStatus("ALL");
                        }}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-surface-container-high px-3.5 py-1.5 text-xs font-bold text-primary hover:bg-surface-container-highest transition-colors shadow-xs"
                      >
                        <span className="material-symbols-outlined text-[16px]">restart_alt</span>
                        <span>Reset Filters &amp; Show All ({businesses.length})</span>
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Reject Modal */}
      {rejectingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-outline-variant/30 bg-surface-container p-6 text-on-surface shadow-2xl">
            <h3 className="text-base font-bold font-headline-md text-error flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px]">cancel</span>
              Reject Business Listing
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
            // 1. Immediately reset search and filter to ALL so the user immediately sees the newly created business!
            setSearchQuery("");
            setFilterStatus("ALL");

            // 2. Prepend created business immediately to state with normalized shape
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

            // 3. Sync from backend API
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
