"use client";

import { useState, useEffect, useMemo } from "react";
import { useBanners } from "@/hooks/admin/useBanners";
import { useAdminSession } from "@/lib/admin/context";
import CreateEditBannerModal from "./CreateEditBannerModal";
import BannerInvoiceModal from "./BannerInvoiceModal";
import AdminBusinessesTable, { type AdminBusinessRow } from "./AdminBusinessesTable";
import { type CommercialBanner, COMMERCIAL_PAGE_OPTIONS } from "@/lib/commercial-banners";

export interface BannerRow extends CommercialBanner {
  invoiceNumber: string | null;
  invoiceStatus: string | null;
  subscriptionCadence: string | null;
}

const INVOICE_STYLES: Record<string, string> = {
  PAID: "bg-secondary/15 text-secondary",
  PENDING: "bg-tertiary/15 text-tertiary",
  OVERDUE: "bg-error/15 text-error",
};

export default function CommercialBannersView({
  banners = [],
  businesses = [],
}: {
  banners: any[];
  businesses?: AdminBusinessRow[];
}) {
  const { can } = useAdminSession();
  const { toggleBanner, deleteBanner, seedDefaultBanners, loading } = useBanners();
  const [activeTab, setActiveTab] = useState<"businesses" | "banners">("banners");
  const [modalBanner, setModalBanner] = useState<CommercialBanner | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [invoiceFor, setInvoiceFor] = useState<any | null>(null);
  const [deleteCandidate, setDeleteCandidate] = useState<CommercialBanner | null>(null);

  const [pageFilter, setPageFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const canWrite = can("COMMERCIAL", "canWrite");
  const canDelete = can("COMMERCIAL", "canDelete");

  const [bannersList, setBannersList] = useState<CommercialBanner[]>(banners);
  const [businessesList, setBusinessesList] = useState<AdminBusinessRow[]>(businesses);

  useEffect(() => {
    setBannersList(banners);
  }, [banners]);

  useEffect(() => {
    setBusinessesList(businesses);
  }, [businesses]);

  const pendingBusinessCount = businessesList.filter((b) => b.status === "PENDING_APPROVAL").length;

  // Filtered banners
  const filteredBanners = useMemo(() => {
    return bannersList.filter((b) => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesQuery =
          b.name.toLowerCase().includes(q) ||
          b.headline.toLowerCase().includes(q) ||
          b.code.toLowerCase().includes(q) ||
          (b.badge && b.badge.toLowerCase().includes(q));
        if (!matchesQuery) return false;
      }

      // Page filter
      if (pageFilter !== "ALL") {
        const matchesPage =
          b.pages.includes("ALL") ||
          b.pages.includes(pageFilter) ||
          b.slot === pageFilter ||
          b.slot.split(",").map((s) => s.trim()).includes(pageFilter);
        if (!matchesPage) return false;
      }

      // Status filter
      if (statusFilter === "ACTIVE" && !b.active) return false;
      if (statusFilter === "PAUSED" && b.active) return false;

      return true;
    });
  }, [bannersList, searchQuery, pageFilter, statusFilter]);

  // Aggregate stats
  const totalImpressions = bannersList.reduce((acc, b) => acc + (b.impressions || 0), 0);
  const totalClicks = bannersList.reduce((acc, b) => acc + (b.clicks || 0), 0);
  const avgCtr =
    totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(1) + "%" : "0.0%";

  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  function showToast(message: string, type: "success" | "error" = "success") {
    setToast({ message, type });
    setTimeout(() => {
      setToast((curr) => (curr?.message === message ? null : curr));
    }, 3500);
  }

  const handleToggle = async (id: string) => {
    const target = bannersList.find((b) => b.id === id);
    if (!target) return;
    const originalActive = target.active;

    // Optimistic toggle
    setBannersList((prev) =>
      prev.map((b) => (b.id === id ? { ...b, active: !originalActive } : b))
    );
    showToast(`Banner "${target.name}" ${!originalActive ? "activated" : "paused"}.`);

    const res = await toggleBanner(id);
    if (!res) {
      // Rollback on failure
      setBannersList((prev) =>
        prev.map((b) => (b.id === id ? { ...b, active: originalActive } : b))
      );
      showToast("Failed to update banner status. Reverted.", "error");
    }
  };

  const handleDelete = async () => {
    if (!deleteCandidate) return;
    const target = deleteCandidate;
    setDeleteCandidate(null);

    // Optimistic removal
    setBannersList((prev) => prev.filter((b) => b.id !== target.id));
    showToast(`Banner "${target.name}" removed.`);

    const res = await deleteBanner(target.id);
    if (!res) {
      // Rollback on failure
      setBannersList((prev) => [...prev, target]);
      showToast("Failed to delete banner. Reverted.", "error");
    }
  };

  const handleSeedDefaults = async () => {
    if (confirm("Populate or reset standard Sierra Leone institutional sponsor banners across all pages?")) {
      const res = await seedDefaultBanners(true);
      if (res) {
        setBannersList(res);
        showToast("Seeded standard institutional commercial banners.");
      } else {
        showToast("Failed to seed default banners.", "error");
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-outline-variant/20 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary text-[28px]">storefront</span>
            <h1 className="font-headline-lg text-on-surface">Commerce, Enterprises &amp; Advertising</h1>
          </div>
          <p className="font-body-default text-on-surface-variant mt-1">
            Manage institutional sponsor banners across pages, review registered alumni businesses, and track commercial engagement.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 rounded-xl bg-surface-container p-1 border border-outline-variant/30 w-fit">
          <button
            type="button"
            onClick={() => setActiveTab("banners")}
            className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all ${
              activeTab === "banners"
                ? "bg-primary-container text-on-primary-container shadow-xs"
                : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high"
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">campaign</span>
            <span>Commercial Banners ({bannersList.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("businesses")}
            className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all ${
              activeTab === "businesses"
                ? "bg-primary-container text-on-primary-container shadow-xs"
                : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high"
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">storefront</span>
            <span>Alumni Enterprises ({businessesList.length})</span>
            {pendingBusinessCount > 0 && (
              <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-tertiary px-1 text-[10px] font-extrabold text-on-tertiary animate-pulse">
                {pendingBusinessCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* TAB 1: COMMERCIAL BANNERS */}
      {activeTab === "banners" && (
        <div className="space-y-6">
          {/* Metrics Ribbon */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="rounded-xl border border-outline-variant/20 bg-surface-container p-4">
              <span className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
                Total Banners
              </span>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-2xl font-black text-on-surface">{bannersList.length}</span>
                <span className="text-xs text-secondary font-bold">
                  {bannersList.filter((b) => b.active).length} Active
                </span>
              </div>
            </div>

            <div className="rounded-xl border border-outline-variant/20 bg-surface-container p-4">
              <span className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
                Pages Covered
              </span>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-2xl font-black text-primary">6</span>
                <span className="text-xs text-on-surface-variant">Public Sections</span>
              </div>
            </div>

            <div className="rounded-xl border border-outline-variant/20 bg-surface-container p-4">
              <span className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
                Total Impressions
              </span>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-2xl font-black text-on-surface font-mono">
                  {totalImpressions.toLocaleString()}
                </span>
              </div>
            </div>

            <div className="rounded-xl border border-outline-variant/20 bg-surface-container p-4">
              <span className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
                Total Clicks
              </span>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-2xl font-black text-tertiary font-mono">
                  {totalClicks.toLocaleString()}
                </span>
              </div>
            </div>

            <div className="col-span-2 sm:col-span-1 rounded-xl border border-outline-variant/20 bg-surface-container p-4">
              <span className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
                Average CTR
              </span>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-2xl font-black text-secondary font-mono">{avgCtr}</span>
                <span className="text-xs text-on-surface-variant">Engagement</span>
              </div>
            </div>
          </div>

          {/* Controls Bar */}
          <div className="flex flex-col gap-3 rounded-2xl border border-outline-variant/20 bg-surface-container p-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Search */}
              <div className="relative min-w-[200px]">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-on-surface-variant">
                  search
                </span>
                <input
                  type="text"
                  placeholder="Search banners or sponsors..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-lg border border-outline-variant/30 bg-surface-container-low pl-9 pr-3 py-1.5 text-xs text-on-surface outline-none focus:border-primary"
                />
              </div>

              {/* Target Page Filter */}
              <select
                value={pageFilter}
                onChange={(e) => setPageFilter(e.target.value)}
                className="rounded-lg border border-outline-variant/30 bg-surface-container-low px-3 py-1.5 text-xs font-semibold text-on-surface outline-none focus:border-primary"
              >
                <option value="ALL">All Placements</option>
                {COMMERCIAL_PAGE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-lg border border-outline-variant/30 bg-surface-container-low px-3 py-1.5 text-xs font-semibold text-on-surface outline-none focus:border-primary"
              >
                <option value="ALL">All Status</option>
                <option value="ACTIVE">Active Only</option>
                <option value="PAUSED">Paused Only</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              {canWrite && (
                <button
                  type="button"
                  onClick={handleSeedDefaults}
                  disabled={loading}
                  className="flex items-center gap-1.5 rounded-lg border border-outline-variant/40 bg-surface-container-low px-3 py-2 text-xs font-bold text-on-surface hover:bg-surface-container-high transition-colors disabled:opacity-50"
                  title="Seed standard Sierra Leone institutional sponsor banners across pages"
                >
                  <span className="material-symbols-outlined text-[16px]">sync</span>
                  <span className="hidden sm:inline">Reset Sample Banners</span>
                </button>
              )}

              {canWrite && (
                <button
                  type="button"
                  onClick={() => {
                    setModalBanner(null);
                    setIsModalOpen(true);
                  }}
                  className="flex items-center gap-1.5 rounded-lg bg-primary-container text-on-primary-container px-4 py-2 text-xs font-bold shadow-xs hover:opacity-90 transition-opacity"
                >
                  <span className="material-symbols-outlined text-[18px]">add</span>
                  <span>New Commercial Banner</span>
                </button>
              )}
            </div>
          </div>

          {/* Banners Table */}
          <div className="rounded-2xl border border-outline-variant/20 bg-surface-container overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="font-table-header uppercase text-on-surface-variant border-b border-outline-variant/20 bg-surface-container-high/30 text-[11px]">
                    <th className="px-4 py-3.5">Banner Creative &amp; Sponsor</th>
                    <th className="px-4 py-3.5">Target Page Placements</th>
                    <th className="px-4 py-3.5">Metrics (Imp / Clicks / CTR)</th>
                    <th className="px-4 py-3.5">Fee &amp; Contract</th>
                    <th className="px-4 py-3.5 text-center">Status</th>
                    <th className="px-4 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/10 text-xs">
                  {filteredBanners.map((b) => (
                    <tr
                      key={b.id}
                      className="hover:bg-surface-container-high/40 transition-colors"
                    >
                      {/* Banner Creative */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="relative h-12 w-20 shrink-0 overflow-hidden rounded-lg bg-slate-900 border border-outline-variant/30">
                            <img
                              src={b.bannerImageUrl}
                              alt={b.headline}
                              className="h-full w-full object-cover"
                            />
                            <div className="absolute top-1 left-1 rounded bg-slate-900/80 px-1 py-0.2 text-[8px] font-bold text-emerald-400">
                              #{b.order}
                            </div>
                          </div>
                          <div className="min-w-0 max-w-xs">
                            <div className="font-bold text-on-surface truncate text-sm">
                              {b.headline}
                            </div>
                            <div className="text-on-surface-variant text-[11px] truncate flex items-center gap-1.5 mt-0.5">
                              <span className="font-medium text-secondary">{b.name}</span>
                              <span>&middot;</span>
                              <span className="text-slate-400 font-mono">{b.code}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Target Pages */}
                      <td className="px-4 py-3.5">
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {b.pages.includes("ALL") ? (
                            <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/15 text-emerald-500 px-2 py-0.5 text-[10px] font-bold border border-emerald-500/30">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                              All Pages (Global)
                            </span>
                          ) : (
                            b.pages.map((p) => (
                              <span
                                key={p}
                                className="inline-flex items-center rounded-md bg-surface-container-high px-2 py-0.5 text-[10px] font-semibold text-on-surface-variant border border-outline-variant/30"
                              >
                                {p === "/" ? "Home (/)" : p}
                              </span>
                            ))
                          )}
                        </div>
                      </td>

                      {/* Metrics */}
                      <td className="px-4 py-3.5 font-mono">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-on-surface">
                            {b.impressions.toLocaleString()}
                          </span>
                          <span className="text-on-surface-variant">/</span>
                          <span className="font-bold text-tertiary">
                            {b.clicks.toLocaleString()}
                          </span>
                          <span className="text-on-surface-variant">/</span>
                          <span className="font-bold text-secondary">{b.ctr}</span>
                        </div>
                      </td>

                      {/* Fee */}
                      <td className="px-4 py-3.5">
                        <div className="font-mono font-bold text-secondary">
                          ${b.monthlyFee}
                          <span className="text-[10px] text-on-surface-variant font-normal">/mo</span>
                        </div>
                        <div className="text-[10px] text-on-surface-variant truncate max-w-[120px]">
                          {b.contract}
                        </div>
                      </td>

                      {/* Status Toggle */}
                      <td className="px-4 py-3.5 text-center">
                        <button
                          type="button"
                          disabled={!canWrite || loading}
                          onClick={() => handleToggle(b.id)}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold transition-all ${
                            b.active
                              ? "bg-secondary/15 text-secondary border border-secondary/30 hover:bg-secondary/25"
                              : "bg-surface-container-high text-on-surface-variant border border-outline-variant/40 hover:bg-surface-container-highest"
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              b.active ? "bg-secondary" : "bg-on-surface-variant"
                            }`}
                          />
                          <span>{b.active ? "Active" : "Paused"}</span>
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3.5 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1">
                          {canWrite && (
                            <button
                              type="button"
                              onClick={() => {
                                setModalBanner(b);
                                setIsModalOpen(true);
                              }}
                              className="flex h-7 w-7 items-center justify-center rounded-lg text-primary hover:bg-primary-container/30 transition-colors"
                              title="Edit Banner"
                            >
                              <span className="material-symbols-outlined text-[18px]">edit</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => setInvoiceFor(b)}
                            className="flex h-7 w-7 items-center justify-center rounded-lg text-tertiary hover:bg-tertiary-container/30 transition-colors"
                            title="View Invoice"
                          >
                            <span className="material-symbols-outlined text-[18px]">receipt</span>
                          </button>

                          {canDelete && (
                            <button
                              type="button"
                              onClick={() => setDeleteCandidate(b)}
                              className="flex h-7 w-7 items-center justify-center rounded-lg text-error hover:bg-error-container/30 transition-colors"
                              title="Delete Banner"
                            >
                              <span className="material-symbols-outlined text-[18px]">delete</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}

                  {filteredBanners.length === 0 && (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-4 py-12 text-center text-on-surface-variant font-body-default"
                      >
                        <div className="flex flex-col items-center justify-center gap-2">
                          <span className="material-symbols-outlined text-4xl text-on-surface-variant/40">
                            campaign
                          </span>
                          <p className="font-bold text-on-surface">No commercial banners found</p>
                          <p className="text-xs text-on-surface-variant max-w-sm">
                            {searchQuery || pageFilter !== "ALL"
                              ? "Try adjusting your search criteria or placement filter."
                              : "Get started by adding your first commercial ad banner or resetting sample presets."}
                          </p>
                          {canWrite && (
                            <button
                              type="button"
                              onClick={() => {
                                setModalBanner(null);
                                setIsModalOpen(true);
                              }}
                              className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-primary-container px-3 py-1.5 text-xs font-bold text-on-primary-container shadow-xs"
                            >
                              <span className="material-symbols-outlined text-[16px]">add</span>
                              <span>Create First Banner</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ALUMNI ENTERPRISES */}
      {activeTab === "businesses" && (
        <AdminBusinessesTable
          businesses={businessesList}
          onBusinessesChange={setBusinessesList}
        />
      )}

      {/* CREATE / EDIT MODAL */}
      {isModalOpen && (
        <CreateEditBannerModal
          banner={modalBanner}
          onClose={() => setIsModalOpen(false)}
          onSaved={(savedBanner) => {
            setBannersList((prev) => {
              const exists = prev.some((b) => b.id === savedBanner.id);
              if (exists) {
                return prev.map((b) => (b.id === savedBanner.id ? { ...b, ...savedBanner } : b));
              } else {
                return [savedBanner, ...prev];
              }
            });
            showToast(`Banner "${savedBanner.headline || savedBanner.name}" saved successfully.`);
          }}
        />
      )}

      {/* INVOICE MODAL */}
      {invoiceFor && (
        <BannerInvoiceModal banner={invoiceFor} onClose={() => setInvoiceFor(null)} />
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-2xl bg-surface-container p-6 shadow-2xl border border-outline-variant/30 space-y-4">
            <div className="flex items-center gap-3 text-error">
              <span className="material-symbols-outlined text-[26px]">warning</span>
              <h3 className="font-headline-sm text-on-surface">Delete Commercial Banner?</h3>
            </div>
            <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed">
              Are you sure you want to delete the sponsor banner{" "}
              <strong className="text-on-surface font-bold">&quot;{deleteCandidate.headline}&quot;</strong>{" "}
              ({deleteCandidate.name})? This will immediately remove it from all assigned page placements.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteCandidate(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-on-surface-variant hover:bg-surface-container-high transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="flex items-center gap-1.5 rounded-xl bg-error px-4 py-2 text-xs font-bold text-on-error shadow-sm hover:opacity-90 transition-opacity"
              >
                <span className="material-symbols-outlined text-[16px]">delete</span>
                <span>Confirm Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification Alert */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 rounded-xl border border-outline-variant/30 bg-surface-container-highest px-4 py-3 text-xs font-bold text-on-surface shadow-2xl animate-in slide-in-from-bottom-5 duration-200">
          <span
            className={`material-symbols-outlined text-[18px] ${
              toast.type === "error" ? "text-error" : "text-secondary"
            }`}
          >
            {toast.type === "error" ? "error" : "check_circle"}
          </span>
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
}
