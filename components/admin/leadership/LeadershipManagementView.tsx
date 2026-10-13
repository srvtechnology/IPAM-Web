"use client";

import { useState, useMemo } from "react";
import { useLeadership } from "@/hooks/admin/useLeadership";
import CreateEditLeaderModal, { type LeadershipAdminItem } from "./CreateEditLeaderModal";

export default function LeadershipManagementView({
  leaders: initialLeaders,
}: {
  leaders: LeadershipAdminItem[];
}) {
  const { deleteLeader, loading, error } = useLeadership();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingLeader, setEditingLeader] = useState<LeadershipAdminItem | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<LeadershipAdminItem | null>(null);
  const [query, setQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");

  const filteredLeaders = useMemo(() => {
    if (!query.trim()) return initialLeaders;
    const q = query.toLowerCase();
    return initialLeaders.filter(
      (l) =>
        l.name.toLowerCase().includes(q) ||
        l.role.toLowerCase().includes(q) ||
        l.classYear.toLowerCase().includes(q) ||
        l.email.toLowerCase().includes(q)
    );
  }, [initialLeaders, query]);

  async function handleConfirmDelete() {
    if (!deleteConfirm) return;
    await deleteLeader(deleteConfirm.id);
    setDeleteConfirm(null);
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary text-[26px]">diversity_3</span>
            <h1 className="font-headline-lg text-on-surface">Global Leadership Desk</h1>
          </div>
          <p className="font-body-default text-on-surface-variant mt-1">
            Manage executive council leaders displayed on the public home page and About portal.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setEditingLeader(null);
            setModalOpen(true);
          }}
          className="flex items-center gap-2 rounded-lg bg-secondary text-on-secondary px-4 py-2 font-body-medium font-semibold shadow-xs hover:opacity-90 transition-opacity"
        >
          <span className="material-symbols-outlined text-[20px]">person_add</span>
          <span>Add Global Leader</span>
        </button>
      </div>

      {error && (
        <div className="rounded-lg bg-error-container text-on-error-container px-3 py-2 font-body-compact">
          {error}
        </div>
      )}

      {/* Metrics Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl bg-surface-container border border-outline-variant/20 p-4">
          <p className="font-body-compact text-on-surface-variant">Council Members</p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="font-headline-lg text-2xl font-bold text-on-surface">{initialLeaders.length}</span>
            <span className="font-code-compact text-xs text-secondary font-semibold">Active Leaders</span>
          </div>
        </div>

        <div className="rounded-xl bg-surface-container border border-outline-variant/20 p-4">
          <p className="font-body-compact text-on-surface-variant">Public Display Status</p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="font-headline-lg text-2xl font-bold text-secondary">Unlimited</span>
            <span className="font-code-compact text-xs text-on-surface-variant">Dynamic Carousel / Grid</span>
          </div>
        </div>

        <div className="rounded-xl bg-surface-container border border-outline-variant/20 p-4">
          <p className="font-body-compact text-on-surface-variant">Strategic Initiatives</p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="font-headline-lg text-2xl font-bold text-tertiary">
              {initialLeaders.reduce((acc, l) => acc + (l.initiatives?.length ?? 0), 0)}
            </span>
            <span className="font-code-compact text-xs text-on-surface-variant">Council Portfolios</span>
          </div>
        </div>
      </div>

      {/* Search & View Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-surface-container p-3 rounded-xl border border-outline-variant/20">
        <div className="relative w-full sm:w-96">
          <span className="material-symbols-outlined text-[18px] text-on-surface-variant absolute left-3 top-2.5">
            search
          </span>
          <input
            type="text"
            placeholder="Search leaders by name, role, class year, email…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full rounded-lg bg-surface-container-low border border-outline-variant/30 pl-9 pr-8 py-2 font-body-compact text-on-surface outline-none focus:border-secondary text-sm"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="material-symbols-outlined text-[16px] text-on-surface-variant hover:text-on-surface absolute right-2.5 top-2.5"
            >
              cancel
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <span className="text-xs text-on-surface-variant font-code-compact">
            Showing {filteredLeaders.length} of {initialLeaders.length}
          </span>
          <div className="flex items-center rounded-lg border border-outline-variant/30 bg-surface-container-low p-0.5">
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === "grid"
                  ? "bg-secondary text-on-secondary"
                  : "text-on-surface-variant hover:text-on-surface"
              }`}
              title="Grid View"
            >
              <span className="material-symbols-outlined text-[18px]">grid_view</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("table")}
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === "table"
                  ? "bg-secondary text-on-secondary"
                  : "text-on-surface-variant hover:text-on-surface"
              }`}
              title="Table View"
            >
              <span className="material-symbols-outlined text-[18px]">table_rows</span>
            </button>
          </div>
        </div>
      </div>

      {/* Empty State */}
      {filteredLeaders.length === 0 && (
        <div className="rounded-xl border border-outline-variant/20 bg-surface-container p-12 text-center space-y-3">
          <span className="material-symbols-outlined text-4xl text-on-surface-variant">person_off</span>
          <h3 className="font-headline-md text-on-surface">No Global Leaders Found</h3>
          <p className="font-body-default text-on-surface-variant max-w-md mx-auto">
            {query
              ? `No leaders matching "${query}". Try adjusting your search.`
              : "No executive council leaders added yet. Click 'Add Global Leader' to begin."}
          </p>
        </div>
      )}

      {/* Grid Mode */}
      {filteredLeaders.length > 0 && viewMode === "grid" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredLeaders.map((l) => (
            <div
              key={l.id}
              className="rounded-xl bg-surface-container border border-outline-variant/20 p-5 flex flex-col justify-between hover:border-secondary/40 transition-all shadow-xs"
            >
              <div className="space-y-3">
                {/* Avatar & Class Year */}
                <div className="flex items-start justify-between gap-2">
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full border-2 border-secondary bg-surface-container-highest shadow-xs">
                    {l.image ? (
                      <img src={l.image} alt={l.name} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-lg font-bold text-secondary">
                        {l.name.charAt(0)}
                      </div>
                    )}
                  </div>
                  <span className="font-code-compact text-xs px-2 py-0.5 rounded-full bg-surface-container-highest text-on-surface-variant border border-outline-variant/20 font-medium">
                    {l.classYear}
                  </span>
                </div>

                {/* Name & Role */}
                <div>
                  <h3 className="font-headline-sm text-base text-on-surface font-bold leading-tight">{l.name}</h3>
                  <p className="font-body-compact text-xs text-secondary font-semibold mt-0.5">{l.role}</p>
                  <p className="font-body-compact text-xs text-on-surface-variant truncate mt-1">{l.email}</p>
                </div>

                {/* Bio snippet */}
                <p className="font-body-compact text-xs text-on-surface-variant line-clamp-2 leading-relaxed">
                  {l.bio}
                </p>

                {/* Initiatives */}
                {l.initiatives && l.initiatives.length > 0 && (
                  <div className="pt-2 border-t border-outline-variant/15 flex flex-wrap gap-1">
                    {l.initiatives.slice(0, 2).map((init) => (
                      <span
                        key={init.id}
                        className="text-[10px] px-1.5 py-0.5 rounded bg-surface-container-high text-on-surface-variant truncate max-w-full"
                      >
                        {init.title}
                      </span>
                    ))}
                    {l.initiatives.length > 2 && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-surface-container-high text-on-surface-variant font-medium">
                        +{l.initiatives.length - 2} more
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="mt-4 pt-3 border-t border-outline-variant/20 flex items-center justify-end gap-1">
                <button
                  type="button"
                  onClick={() => {
                    setEditingLeader(l);
                    setModalOpen(true);
                  }}
                  className="p-1.5 rounded-lg text-on-surface-variant hover:text-secondary hover:bg-surface-container-high transition-colors"
                  title="Edit Leader"
                >
                  <span className="material-symbols-outlined text-[18px]">edit</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteConfirm(l)}
                  className="p-1.5 rounded-lg text-on-surface-variant hover:text-error hover:bg-error-container/20 transition-colors"
                  title="Delete Leader"
                >
                  <span className="material-symbols-outlined text-[18px]">delete</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Table Mode */}
      {filteredLeaders.length > 0 && viewMode === "table" && (
        <div className="rounded-xl border border-outline-variant/20 bg-surface-container overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-outline-variant/20 bg-surface-container-low/60 text-xs font-table-header uppercase text-on-surface-variant">
                  <th className="py-3 px-4">Leader</th>
                  <th className="py-3 px-4">Role &amp; Title</th>
                  <th className="py-3 px-4">Class Year</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Initiatives</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/15 text-sm font-body-default text-on-surface">
                {filteredLeaders.map((l) => (
                  <tr key={l.id} className="hover:bg-surface-container-high/40 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full border border-secondary bg-surface-container-highest">
                          {l.image ? (
                            <img src={l.image} alt={l.name} className="h-full w-full object-cover" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-xs font-bold text-secondary">
                              {l.name.charAt(0)}
                            </div>
                          )}
                        </div>
                        <span className="font-semibold text-on-surface">{l.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-secondary font-medium">{l.role}</td>
                    <td className="py-3 px-4 font-code-compact text-xs">{l.classYear}</td>
                    <td className="py-3 px-4 text-on-surface-variant text-xs">{l.email}</td>
                    <td className="py-3 px-4">
                      <span className="font-code-compact text-xs px-2 py-0.5 rounded bg-surface-container-highest text-on-surface-variant">
                        {l.initiatives?.length ?? 0} initiatives
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingLeader(l);
                            setModalOpen(true);
                          }}
                          className="p-1.5 rounded-lg text-on-surface-variant hover:text-secondary hover:bg-surface-container-high transition-colors"
                          title="Edit Leader"
                        >
                          <span className="material-symbols-outlined text-[18px]">edit</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteConfirm(l)}
                          className="p-1.5 rounded-lg text-on-surface-variant hover:text-error hover:bg-error-container/20 transition-colors"
                          title="Delete Leader"
                        >
                          <span className="material-symbols-outlined text-[18px]">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create / Edit Modal */}
      {modalOpen && (
        <CreateEditLeaderModal
          leader={editingLeader}
          onClose={() => {
            setModalOpen(false);
            setEditingLeader(null);
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="w-full max-w-md rounded-2xl bg-surface-container p-6 shadow-2xl border border-outline-variant/20">
            <div className="flex items-center gap-3 text-error mb-3">
              <span className="material-symbols-outlined text-[28px]">warning</span>
              <h3 className="font-headline-md text-on-surface">Confirm Delete</h3>
            </div>
            <p className="font-body-default text-on-surface-variant">
              Are you sure you want to remove <strong className="text-on-surface">&quot;{deleteConfirm.name}&quot;</strong> from
              the Global Leadership Council? This will also remove them from the public home page and About portal.
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 rounded-lg font-body-medium text-on-surface-variant hover:bg-surface-container-high transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={loading}
                className="px-4 py-2 rounded-lg bg-error text-on-error font-body-medium font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[16px]">delete</span>
                {loading ? "Deleting…" : "Delete Leader"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
