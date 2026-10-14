"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
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

export default function CommercialBannersView({
  banners = [],
  businesses = [],
}: {
  banners: any[];
  businesses?: AdminBusinessRow[];
}) {
  const { can } = useAdminSession();
  const { toggleBanner, deleteBanner, seedDefaultBanners, loading } = useBanners();
  const [activeTab, setActiveTab] = useState<"banners" | "businesses">("banners");
  const [bannerViewMode, setBannerViewMode] = useState<"cards" | "table">("cards");

  const [modalBanner, setModalBanner] = useState<CommercialBanner | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [invoiceFor, setInvoiceFor] = useState<any | null>(null);
  const [deleteCandidate, setDeleteCandidate] = useState<CommercialBanner | null>(null);

  const [pageFilter, setPageFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [sortBy, setSortBy] = useState<"order" | "impressions" | "clicks" | "ctr" | "fee" | "name">("order");
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

  // Filtered and sorted banners
  const filteredBanners = useMemo(() => {
    let list = bannersList.filter((b) => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesQuery =
          b.name.toLowerCase().includes(q) ||
          b.headline.toLowerCase().includes(q) ||
          b.code.toLowerCase().includes(q) ||
          (b.badge && b.badge.toLowerCase().includes(q)) ||
          b.pages.some((p) => p.toLowerCase().includes(q));
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

    // Sort
    return [...list].sort((a, b) => {
      if (sortBy === "impressions") return (b.impressions || 0) - (a.impressions || 0);
      if (sortBy === "clicks") return (b.clicks || 0) - (a.clicks || 0);
      if (sortBy === "ctr") {
        const ctrA = parseFloat(a.ctr) || 0;
        const ctrB = parseFloat(b.ctr) || 0;
        return ctrB - ctrA;
      }
      if (sortBy === "fee") {
        const feeA = parseFloat(a.monthlyFee) || 0;
        const feeB = parseFloat(b.monthlyFee) || 0;
        return feeB - feeA;
      }
      if (sortBy === "name") return a.name.localeCompare(b.name);
      // default: order
      return (a.order || 0) - (b.order || 0);
    });
  }, [bannersList, searchQuery, pageFilter, statusFilter, sortBy]);

  // Aggregate stats
  const totalImpressions = bannersList.reduce((acc, b) => acc + (b.impressions || 0), 0);
  const totalClicks = bannersList.reduce((acc, b) => acc + (b.clicks || 0), 0);
  const avgCtr =
    totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(1) + "%" : "0.0%";
  const activeCount = bannersList.filter((b) => b.active).length;

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
    const nextActive = !originalActive;

    // Optimistic toggle
    setBannersList((prev) =>
      prev.map((b) => (b.id === id ? { ...b, active: nextActive } : b))
    );
    showToast(`Banner "${target.name}" ${nextActive ? "activated" : "paused"}.`);

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
            <span className="material-symbols-outlined text-secondary text-[30px]">storefront</span>
            <h1 className="font-headline-lg text-on-surface">Commerce, Enterprises &amp; Advertising</h1>
          </div>
          <p className="font-body-default text-on-surface-variant mt-1 text-sm">
            Manage institutional sponsor banners across pages, review registered alumni businesses, and track commercial engagement.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 rounded-xl bg-surface-container p-1 border border-outline-variant/30 w-fit">
          <button
            type="button"
            onClick={() => setActiveTab("banners")}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition-all ${
              activeTab === "banners"
                ? "bg-primary-container text-on-primary-container shadow-xs"
                : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high"
            }`}
          >
            <span className="material-symbols-outlined text-[17px]">campaign</span>
            <span>Commercial Banners</span>
            <span className="rounded-full bg-surface-container-highest px-1.5 py-0.2 text-[10px] font-bold">
              {bannersList.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("businesses")}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition-all ${
              activeTab === "businesses"
                ? "bg-primary-container text-on-primary-container shadow-xs"
                : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high"
            }`}
          >
            <span className="material-symbols-outlined text-[17px]">storefront</span>
            <span>Alumni Enterprises</span>
            <span className="rounded-full bg-surface-container-highest px-1.5 py-0.2 text-[10px] font-bold">
              {businessesList.length}
            </span>
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
        <div className="space-y-5">
          {/* Metrics Ribbon */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="rounded-xl border border-outline-variant/20 bg-surface-container p-4">
              <span className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
                Total Banners
              </span>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-2xl font-black text-on-surface">{bannersList.length}</span>
                <span className="text-xs text-secondary font-bold">
                  {activeCount} Active
                </span>
              </div>
            </div>

            <div className="rounded-xl border border-outline-variant/20 bg-surface-container p-4">
              <span className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
                Pages Covered
              </span>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-2xl font-black text-primary">6</span>
                <span className="text-xs text-on-surface-variant">Live Portals</span>
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
                <span className="text-xs text-on-surface-variant">Rate</span>
              </div>
            </div>
          </div>

          {/* Controls Bar */}
          <div className="flex flex-col gap-3 rounded-2xl border border-outline-variant/20 bg-surface-container p-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Search */}
              <div className="relative min-w-[220px]">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-on-surface-variant">
                  search
                </span>
                <input
                  type="text"
                  placeholder="Search banners, sponsors, codes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-lg border border-outline-variant/30 bg-surface-container-low pl-9 pr-7 py-1.5 text-xs text-on-surface outline-none focus:border-primary"
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
                <option value="ACTIVE">Active Only ({activeCount})</option>
                <option value="PAUSED">Paused Only ({bannersList.length - activeCount})</option>
              </select>

              {/* Sort Filter */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="rounded-lg border border-outline-variant/30 bg-surface-container-low px-3 py-1.5 text-xs font-semibold text-on-surface outline-none focus:border-primary"
              >
                <option value="order">Sort: Priority Order (#1 first)</option>
                <option value="impressions">Sort: Highest Impressions</option>
                <option value="clicks">Sort: Most Clicks</option>
                <option value="ctr">Sort: Best CTR %</option>
                <option value="fee">Sort: Monthly Fee</option>
                <option value="name">Sort: Sponsor Name</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              {/* View mode toggle (Cards vs Table) */}
              <div className="flex items-center rounded-lg border border-outline-variant/30 bg-surface-container-low p-0.5">
                <button
                  type="button"
                  onClick={() => setBannerViewMode("cards")}
                  title="Visual Cards Grid"
                  className={`flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-bold transition-all ${
                    bannerViewMode === "cards"
                      ? "bg-surface-container-highest text-primary shadow-xs"
                      : "text-on-surface-variant hover:text-on-surface"
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">grid_view</span>
                  <span className="hidden sm:inline">Cards</span>
                </button>
                <button
                  type="button"
                  onClick={() => setBannerViewMode("table")}
                  title="Dense Table"
                  className={`flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-bold transition-all ${
                    bannerViewMode === "table"
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
                  onClick={handleSeedDefaults}
                  disabled={loading}
                  className="flex items-center gap-1.5 rounded-lg border border-outline-variant/40 bg-surface-container-low px-3 py-1.5 text-xs font-bold text-on-surface hover:bg-surface-container-high transition-colors disabled:opacity-50"
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
                  className="flex items-center gap-1.5 rounded-lg bg-primary-container text-on-primary-container px-3.5 py-1.5 text-xs font-bold shadow-xs hover:opacity-90 transition-opacity"
                >
                  <span className="material-symbols-outlined text-[17px]">add</span>
                  <span>New Banner</span>
                </button>
              )}
            </div>
          </div>

          {/* VIEW MODE 1: VISUAL CARDS GRID */}
          {bannerViewMode === "cards" && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredBanners.map((b) => {
                const ctrNum = parseFloat(b.ctr) || 0;
                return (
                  <div
                    key={b.id}
                    className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-outline-variant/20 bg-surface-container hover:border-outline-variant/40 hover:shadow-lg transition-all"
                  >
                    {/* Top: Creative Panoramic Banner & Overlay Badges */}
                    <div className="relative aspect-[21/9] sm:aspect-[24/7] w-full overflow-hidden bg-slate-950">
                      <img
                        src={b.bannerImageUrl}
                        alt={b.name}
                        className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />

                      {/* Top Left: Active Status Toggle Pill */}
                      <div className="absolute left-3 top-3">
                        <button
                          type="button"
                          disabled={!canWrite || loading}
                          onClick={() => handleToggle(b.id)}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold backdrop-blur-xs transition-all shadow-xs ${
                            b.active
                              ? "bg-secondary/25 text-secondary border border-secondary/40 hover:bg-secondary/35"
                              : "bg-slate-900/80 text-slate-400 border border-slate-700 hover:bg-slate-900"
                          }`}
                        >
                          <span
                            className={`h-2 w-2 rounded-full ${
                              b.active ? "bg-secondary animate-pulse" : "bg-slate-500"
                            }`}
                          />
                          <span>{b.active ? "Active" : "Paused"}</span>
                        </button>
                      </div>

                      {/* Top Right: Priority Order + Fee */}
                      <div className="absolute right-3 top-3 flex items-center gap-1.5">
                        <span className="rounded-lg bg-slate-900/80 px-2 py-0.5 text-[10px] font-mono font-bold text-amber-400 backdrop-blur-xs border border-amber-500/30">
                          #{b.order} Priority
                        </span>
                        <span className="rounded-lg bg-slate-900/80 px-2 py-0.5 text-[10px] font-mono font-bold text-emerald-400 backdrop-blur-xs border border-emerald-500/30">
                          ${b.monthlyFee}/mo
                        </span>
                      </div>
                    </div>

                    {/* Card Middle: Sponsor Name, Destination URL & Targeted Placements */}
                    <div className="flex-1 p-4 space-y-3">
                      <div>
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="font-bold font-headline-sm text-on-surface text-base truncate">
                            {b.name}
                          </h3>
                          <span className="text-[10px] font-mono text-on-surface-variant bg-surface-container-high px-1.5 py-0.5 rounded">
                            {b.code}
                          </span>
                        </div>
                        <a
                          href={b.targetUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline mt-1 truncate max-w-full font-mono"
                          title={b.targetUrl}
                        >
                          <span className="material-symbols-outlined text-[13px]">link</span>
                          <span className="truncate">{b.targetUrl}</span>
                        </a>
                      </div>

                      {/* Interactive Placements Chips */}
                      <div>
                        <div className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant mb-1.5 flex items-center gap-1">
                          <span className="material-symbols-outlined text-[13px]">layers</span>
                          <span>Live Placements (Click to verify)</span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {b.pages.includes("ALL") ? (
                            <span className="inline-flex items-center gap-1 rounded-md bg-secondary/15 text-secondary px-2 py-0.5 text-[10px] font-bold border border-secondary/30">
                              <span className="h-1.5 w-1.5 rounded-full bg-secondary" />
                              Global Banner (All 6 Pages)
                            </span>
                          ) : (
                            b.pages.map((p) => {
                              const pageOpt = COMMERCIAL_PAGE_OPTIONS.find((opt) => opt.value === p);
                              const label = pageOpt ? pageOpt.label : p;
                              return (
                                <Link
                                  key={p}
                                  href={p}
                                  target="_blank"
                                  title={`Open public page ${label}`}
                                  className="inline-flex items-center gap-1 rounded-md bg-surface-container-high px-2 py-0.5 text-[10px] font-semibold text-on-surface-variant hover:text-primary hover:bg-surface-container-highest border border-outline-variant/30 transition-colors"
                                >
                                  <span>{label}</span>
                                  <span className="material-symbols-outlined text-[11px] opacity-70">open_in_new</span>
                                </Link>
                              );
                            })
                          )}
                        </div>
                      </div>

                      {/* Metrics Performance Bar */}
                      <div className="rounded-xl border border-outline-variant/20 bg-surface-container-high/40 p-2.5">
                        <div className="grid grid-cols-3 gap-2 text-center">
                          <div>
                            <span className="text-[10px] text-on-surface-variant block uppercase font-bold">Impressions</span>
                            <span className="text-xs font-mono font-bold text-on-surface">
                              {b.impressions.toLocaleString()}
                            </span>
                          </div>
                          <div className="border-x border-outline-variant/20">
                            <span className="text-[10px] text-on-surface-variant block uppercase font-bold">Clicks</span>
                            <span className="text-xs font-mono font-bold text-tertiary">
                              {b.clicks.toLocaleString()}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] text-on-surface-variant block uppercase font-bold">CTR</span>
                            <span
                              className={`text-xs font-mono font-bold ${
                                ctrNum >= 2.0
                                  ? "text-secondary"
                                  : ctrNum >= 1.0
                                  ? "text-tertiary"
                                  : "text-on-surface-variant"
                              }`}
                            >
                              {b.ctr}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Card Action Bar */}
                    <div className="border-t border-outline-variant/15 bg-surface-container-high/30 p-3 flex items-center justify-between gap-2">
                      {/* Destination test link */}
                      <a
                        href={b.targetUrl}
                        target="_blank"
                        rel="noreferrer"
                        title={`Destination: ${b.targetUrl}`}
                        className="flex h-7 items-center gap-1 rounded-lg px-2 text-xs font-semibold text-primary hover:bg-primary-container/20 transition-colors truncate max-w-[140px]"
                      >
                        <span className="material-symbols-outlined text-[15px]">link</span>
                        <span className="truncate">Destination</span>
                      </a>

                      <div className="flex items-center gap-1">
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
                            <span className="material-symbols-outlined text-[17px]">edit</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => setInvoiceFor(b)}
                          className="flex h-7 w-7 items-center justify-center rounded-lg text-tertiary hover:bg-tertiary-container/30 transition-colors"
                          title="View Invoice & Contract"
                        >
                          <span className="material-symbols-outlined text-[17px]">receipt</span>
                        </button>

                        {canDelete && (
                          <button
                            type="button"
                            onClick={() => setDeleteCandidate(b)}
                            className="flex h-7 w-7 items-center justify-center rounded-lg text-error hover:bg-error-container/30 transition-colors"
                            title="Delete Banner"
                          >
                            <span className="material-symbols-outlined text-[17px]">delete</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {filteredBanners.length === 0 && (
                <div className="col-span-full py-16 text-center text-on-surface-variant rounded-2xl border border-dashed border-outline-variant/30 bg-surface-container p-6">
                  <span className="material-symbols-outlined text-[42px] block mb-2 opacity-50">campaign</span>
                  <p className="font-bold text-base text-on-surface">No commercial banners match your filters</p>
                  <p className="text-xs text-on-surface-variant mt-1">
                    Try adjusting your search criteria or placement filter.
                  </p>
                  <div className="mt-4 flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery("");
                        setPageFilter("ALL");
                        setStatusFilter("ALL");
                      }}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-surface-container-high px-4 py-2 text-xs font-bold text-primary hover:bg-surface-container-highest transition-colors shadow-xs"
                    >
                      <span className="material-symbols-outlined text-[16px]">restart_alt</span>
                      <span>Reset Filters</span>
                    </button>
                    {canWrite && (
                      <button
                        type="button"
                        onClick={() => {
                          setModalBanner(null);
                          setIsModalOpen(true);
                        }}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-primary-container px-4 py-2 text-xs font-bold text-on-primary-container shadow-xs hover:opacity-90"
                      >
                        <span className="material-symbols-outlined text-[16px]">add</span>
                        <span>Create Banner</span>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* VIEW MODE 2: DENSE DATA TABLE */}
          {bannerViewMode === "table" && (
            <div className="rounded-2xl border border-outline-variant/20 bg-surface-container overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="font-table-header uppercase text-on-surface-variant border-b border-outline-variant/20 bg-surface-container-high/40 text-[11px]">
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
                            <div className="relative h-11 w-24 shrink-0 overflow-hidden rounded-lg bg-slate-900 border border-outline-variant/30">
                              <img
                                src={b.bannerImageUrl}
                                alt={b.name}
                                className="h-full w-full object-cover"
                              />
                              <div className="absolute top-1 left-1 rounded bg-slate-900/80 px-1 py-0.2 text-[8px] font-bold text-emerald-400">
                                #{b.order}
                              </div>
                            </div>
                            <div className="min-w-0 max-w-xs">
                              <div className="font-bold text-on-surface truncate text-sm">
                                {b.name}
                              </div>
                              <div className="text-on-surface-variant text-[11px] truncate flex items-center gap-1 mt-0.5 font-mono">
                                <span className="text-slate-400">{b.code}</span>
                                <span>&middot;</span>
                                <span className="text-primary truncate max-w-[140px]">{b.targetUrl}</span>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Target Pages */}
                        <td className="px-4 py-3.5">
                          <div className="flex flex-wrap gap-1 max-w-xs">
                            {b.pages.includes("ALL") ? (
                              <span className="inline-flex items-center gap-1 rounded-md bg-secondary/15 text-secondary px-2 py-0.5 text-[10px] font-bold border border-secondary/30">
                                <span className="h-1.5 w-1.5 rounded-full bg-secondary" />
                                All Pages (Global)
                              </span>
                            ) : (
                              b.pages.map((p) => {
                                const pageOpt = COMMERCIAL_PAGE_OPTIONS.find((opt) => opt.value === p);
                                const label = pageOpt ? pageOpt.label : p;
                                return (
                                  <Link
                                    key={p}
                                    href={p}
                                    target="_blank"
                                    title={`View ${label}`}
                                    className="inline-flex items-center gap-0.5 rounded-md bg-surface-container-high px-2 py-0.5 text-[10px] font-semibold text-on-surface-variant hover:text-primary border border-outline-variant/30 transition-colors"
                                  >
                                    <span>{label}</span>
                                    <span className="material-symbols-outlined text-[10px]">open_in_new</span>
                                  </Link>
                                );
                              })
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
                              Try adjusting your search criteria or placement filter.
                            </p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
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
