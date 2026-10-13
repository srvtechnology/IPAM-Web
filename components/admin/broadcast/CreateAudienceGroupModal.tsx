"use client";

import { useState, useMemo, useEffect, type FormEvent } from "react";
import { useBroadcast } from "@/hooks/admin/useBroadcast";
import type { AudienceGroupRow, BroadcastAlumniItem } from "./OmnichannelBroadcastView";

export default function CreateAudienceGroupModal({
  group,
  alumni: initialAlumni = [],
  onClose,
}: {
  group?: AudienceGroupRow | null;
  alumni?: BroadcastAlumniItem[];
  onClose: () => void;
}) {
  const isEditing = Boolean(group);
  const { createAudienceGroup, updateAudienceGroup, loading, error } = useBroadcast();

  const [alumniList, setAlumniList] = useState<BroadcastAlumniItem[]>(initialAlumni);
  const [fetchingUsers, setFetchingUsers] = useState(false);

  // If no alumni were passed down, fetch them
  useEffect(() => {
    if (initialAlumni.length === 0) {
      setFetchingUsers(true);
      fetch("/api/admin/broadcast/audience-groups/users")
        .then((res) => res.json())
        .then((json) => {
          if (json.data && Array.isArray(json.data)) {
            setAlumniList(json.data);
          }
        })
        .catch(() => {})
        .finally(() => setFetchingUsers(false));
    }
  }, [initialAlumni]);

  const [name, setName] = useState(group?.name ?? "");
  const [description, setDescription] = useState(group?.description ?? "");

  // Criteria initial state
  const initialCriteria = group?.criteria;
  const initialSelectAll = Boolean(initialCriteria?.selectAll);
  const initialUserIds = (initialCriteria?.userIds as string[]) ?? [];

  const [selectAll, setSelectAll] = useState(initialSelectAll);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>(() => {
    if (initialSelectAll && alumniList.length > 0) {
      return alumniList.map((a) => a.id);
    }
    return initialUserIds;
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [faculties, setFaculties] = useState(
    initialCriteria?.faculties ? initialCriteria.faculties.join(", ") : "All"
  );
  const [cohorts, setCohorts] = useState(
    initialCriteria?.cohorts ? initialCriteria.cohorts.join(", ") : "All"
  );
  const [digitalPassOnly, setDigitalPassOnly] = useState(
    Boolean(initialCriteria?.digitalPassOnly)
  );
  const [estimatedCount, setEstimatedCount] = useState<number>(() => {
    if (group?.estimatedCount !== undefined && group?.estimatedCount !== null) {
      return group.estimatedCount;
    }
    return initialSelectAll ? alumniList.length : initialUserIds.length;
  });
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Update selectedUserIds if alumniList loaded later and selectAll was true
  useEffect(() => {
    if (initialSelectAll && selectedUserIds.length === 0 && alumniList.length > 0) {
      setSelectedUserIds(alumniList.map((a) => a.id));
      setEstimatedCount(alumniList.length);
    }
  }, [alumniList, initialSelectAll, selectedUserIds.length]);

  // Filtered users for selection list
  const filteredAlumni = useMemo(() => {
    return alumniList.filter((a) => {
      if (digitalPassOnly && !a.digitalPassIssued) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        a.name.toLowerCase().includes(q) ||
        a.email.toLowerCase().includes(q) ||
        a.regNo.toLowerCase().includes(q) ||
        (a.faculty && a.faculty.toLowerCase().includes(q))
      );
    });
  }, [alumniList, searchQuery, digitalPassOnly]);

  function handleToggleSelectAll(checked: boolean) {
    setSelectAll(checked);
    if (checked) {
      const allIds = alumniList.map((a) => a.id);
      setSelectedUserIds(allIds);
      setEstimatedCount(allIds.length);
    } else {
      setSelectedUserIds([]);
      setEstimatedCount(0);
    }
  }

  function handleToggleUser(userId: string) {
    setSelectedUserIds((prev) => {
      let updated: string[];
      if (prev.includes(userId)) {
        updated = prev.filter((id) => id !== userId);
        setSelectAll(false);
      } else {
        updated = [...prev, userId];
        if (alumniList.length > 0 && updated.length === alumniList.length) {
          setSelectAll(true);
        }
      }
      setEstimatedCount(updated.length);
      return updated;
    });
  }

  function handleSelectVisible() {
    const visibleIds = filteredAlumni.map((a) => a.id);
    setSelectedUserIds((prev) => {
      const combined = Array.from(new Set([...prev, ...visibleIds]));
      if (alumniList.length > 0 && combined.length === alumniList.length) {
        setSelectAll(true);
      }
      setEstimatedCount(combined.length);
      return combined;
    });
  }

  function handleClearVisible() {
    const visibleIds = new Set(filteredAlumni.map((a) => a.id));
    setSelectedUserIds((prev) => {
      const remaining = prev.filter((id) => !visibleIds.has(id));
      setSelectAll(false);
      setEstimatedCount(remaining.length);
      return remaining;
    });
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    const finalCount =
      selectAll && selectedUserIds.length === 0
        ? alumniList.length
        : selectedUserIds.length > 0
        ? selectedUserIds.length
        : estimatedCount;

    const payload = {
      name,
      description,
      criteria: {
        selectAll,
        userIds: selectedUserIds,
        faculties: faculties.split(",").map((f) => f.trim()).filter(Boolean),
        cohorts: cohorts.split(",").map((c) => c.trim()).filter(Boolean),
        digitalPassOnly,
      },
      estimatedCount: finalCount,
    };

    let result;
    if (isEditing && group) {
      result = await updateAudienceGroup(group.id, payload);
    } else {
      result = await createAudienceGroup(payload);
    }

    if (result) onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-xl rounded-2xl bg-surface-container p-6 shadow-2xl border border-outline-variant/20 flex flex-col max-h-[90vh] animate-fade-in"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-outline-variant/20 flex-shrink-0">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary text-[24px]">
              {isEditing ? "group_work" : "group_add"}
            </span>
            <h2 className="font-headline-md text-on-surface">
              {isEditing ? "Edit Audience Group" : "New Audience Group"}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-on-surface-variant hover:text-on-surface p-1 rounded-lg hover:bg-surface-container-high transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {error && (
          <div className="my-3 rounded-lg bg-error-container text-on-error-container px-3 py-2 font-body-compact flex-shrink-0">
            {error}
          </div>
        )}

        {/* Scrollable Form Body */}
        <div className="space-y-4 overflow-y-auto pr-1 py-3 flex-1">
          {/* Basic Details */}
          <div className="grid grid-cols-1 gap-3">
            <label className="font-body-compact text-on-surface-variant block">
              Group name
              <input
                required
                placeholder="e.g. Verified Alumni 2020-2025"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 w-full rounded-lg bg-surface-container-low border border-outline-variant/30 px-3 py-2 font-body-default text-on-surface outline-none focus:border-secondary"
              />
            </label>

            <label className="font-body-compact text-on-surface-variant block">
              Description
              <input
                required
                placeholder="e.g. Targeted group for annual fundraising drive"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="mt-1 w-full rounded-lg bg-surface-container-low border border-outline-variant/30 px-3 py-2 font-body-default text-on-surface outline-none focus:border-secondary"
              />
            </label>
          </div>

          {/* User Selection Section */}
          <div className="rounded-xl border border-outline-variant/30 bg-surface-container-low/70 p-3.5 space-y-3">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary text-[18px]">person_check</span>
                <span className="font-headline-sm text-sm text-on-surface font-semibold">
                  Select Recipients ({alumniList.length} available)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-code-compact text-xs px-2 py-0.5 rounded-full bg-secondary/15 text-secondary font-semibold">
                  {selectedUserIds.length} selected
                </span>
              </div>
            </div>

            {/* Select All Toggle Bar */}
            <div className="flex items-center justify-between bg-surface-container p-2.5 rounded-lg border border-outline-variant/20 gap-2 flex-wrap">
              <label className="flex items-center gap-2.5 cursor-pointer text-on-surface font-body-compact font-medium select-none">
                <input
                  type="checkbox"
                  checked={selectAll}
                  onChange={(e) => handleToggleSelectAll(e.target.checked)}
                  className="w-4 h-4 rounded text-secondary accent-secondary cursor-pointer"
                />
                <span>Select All Users ({alumniList.length})</span>
              </label>

              <div className="flex items-center gap-2 text-xs">
                <button
                  type="button"
                  onClick={handleSelectVisible}
                  className="text-primary hover:underline font-body-compact"
                >
                  Select shown
                </button>
                <span className="text-outline-variant">•</span>
                <button
                  type="button"
                  onClick={handleClearVisible}
                  className="text-on-surface-variant hover:text-error font-body-compact"
                >
                  Clear shown
                </button>
              </div>
            </div>

            {/* Search Box */}
            <div className="relative">
              <span className="material-symbols-outlined text-[18px] text-on-surface-variant absolute left-3 top-2.5">
                search
              </span>
              <input
                type="text"
                placeholder="Search alumni by name, email, reg no, faculty…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg bg-surface-container border border-outline-variant/30 pl-9 pr-8 py-2 font-body-compact text-on-surface outline-none focus:border-secondary"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="material-symbols-outlined text-[16px] text-on-surface-variant hover:text-on-surface absolute right-2.5 top-2.5"
                >
                  cancel
                </button>
              )}
            </div>

            {/* User List Scrollable Container */}
            <div className="max-h-52 overflow-y-auto rounded-lg border border-outline-variant/20 divide-y divide-outline-variant/15 bg-surface-container">
              {fetchingUsers && (
                <div className="p-4 text-center text-on-surface-variant font-body-compact flex items-center justify-center gap-2">
                  <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
                  Loading users…
                </div>
              )}

              {!fetchingUsers && filteredAlumni.length === 0 && (
                <div className="p-6 text-center text-on-surface-variant font-body-compact">
                  No alumni found matching criteria.
                </div>
              )}

              {!fetchingUsers &&
                filteredAlumni.map((user) => {
                  const isChecked = selectedUserIds.includes(user.id);
                  const initials =
                    user.initials ||
                    user.name
                      .split(" ")
                      .map((p) => p[0])
                      .slice(0, 2)
                      .join("")
                      .toUpperCase();

                  return (
                    <div
                      key={user.id}
                      onClick={() => handleToggleUser(user.id)}
                      className={`px-3 py-2.5 flex items-center gap-3 cursor-pointer transition-colors select-none ${
                        isChecked
                          ? "bg-secondary/10 hover:bg-secondary/15"
                          : "hover:bg-surface-container-high"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}} // handled by row click
                        className="w-4 h-4 rounded text-secondary accent-secondary cursor-pointer flex-shrink-0"
                      />

                      {/* Avatar / Initials */}
                      <div className="w-8 h-8 rounded-full bg-surface-container-highest border border-outline-variant/30 flex items-center justify-center flex-shrink-0 text-xs font-semibold text-secondary">
                        {user.avatarUrl ? (
                          <img
                            src={user.avatarUrl}
                            alt={user.name}
                            className="w-full h-full object-cover rounded-full"
                          />
                        ) : (
                          initials
                        )}
                      </div>

                      {/* Info */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-body-compact text-on-surface font-semibold truncate">
                            {user.name}
                          </p>
                          <span className="font-code-compact text-[10px] px-1.5 py-0.2 rounded bg-surface-container-highest text-on-surface-variant font-medium">
                            {user.regNo}
                          </span>
                          {user.digitalPassIssued && (
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-secondary/15 text-secondary font-semibold">
                              Pass Issued
                            </span>
                          )}
                        </div>
                        <p className="font-body-compact text-xs text-on-surface-variant truncate">
                          {user.email} &middot; {user.faculty || "IPAM"} &apos;{String(user.gradYear).slice(-2)}
                        </p>
                      </div>
                    </div>
                  );
                })}
            </div>

            {/* Recipient summary */}
            <div className="flex items-center justify-between text-xs text-on-surface-variant pt-1">
              <span>
                Total recipients for this group:{" "}
                <strong className="text-secondary font-semibold font-code-compact text-sm">
                  {selectedUserIds.length > 0 ? selectedUserIds.length : selectAll ? alumniList.length : estimatedCount}
                </strong>
              </span>
              <span className="font-code-compact">
                {selectedUserIds.length} of {alumniList.length} users
              </span>
            </div>
          </div>

          {/* Advanced Criteria Filters Accordion */}
          <div className="rounded-xl border border-outline-variant/20 bg-surface-container-low/40">
            <button
              type="button"
              onClick={() => setShowAdvanced((prev) => !prev)}
              className="w-full px-3.5 py-2.5 flex items-center justify-between text-left text-on-surface-variant hover:text-on-surface font-body-compact"
            >
              <div className="flex items-center gap-1.5 font-medium">
                <span className="material-symbols-outlined text-[16px]">tune</span>
                <span>Advanced Criteria Filters (Faculties &amp; Cohorts)</span>
              </div>
              <span className="material-symbols-outlined text-[18px]">
                {showAdvanced ? "expand_less" : "expand_more"}
              </span>
            </button>

            {showAdvanced && (
              <div className="p-3.5 pt-0 space-y-3 border-t border-outline-variant/15 mt-1">
                <div className="grid grid-cols-2 gap-3">
                  <label className="font-body-compact text-on-surface-variant block">
                    Faculties (comma-separated)
                    <input
                      value={faculties}
                      onChange={(e) => setFaculties(e.target.value)}
                      placeholder="e.g. Economics, Public Policy"
                      className="mt-1 w-full rounded-lg bg-surface-container border border-outline-variant/30 px-3 py-1.5 font-body-compact text-on-surface outline-none focus:border-secondary"
                    />
                  </label>
                  <label className="font-body-compact text-on-surface-variant block">
                    Cohorts (comma-separated)
                    <input
                      value={cohorts}
                      onChange={(e) => setCohorts(e.target.value)}
                      placeholder="e.g. 2018, 2020, 2022"
                      className="mt-1 w-full rounded-lg bg-surface-container border border-outline-variant/30 px-3 py-1.5 font-body-compact text-on-surface outline-none focus:border-secondary"
                    />
                  </label>
                </div>

                <label className="flex items-center gap-2 font-body-compact text-on-surface-variant cursor-pointer">
                  <input
                    type="checkbox"
                    checked={digitalPassOnly}
                    onChange={(e) => setDigitalPassOnly(e.target.checked)}
                    className="w-4 h-4 rounded text-secondary accent-secondary"
                  />
                  Digital pass holders only (filters selectable user list)
                </label>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-3 border-t border-outline-variant/20 flex justify-end gap-2 flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg font-body-medium text-on-surface-variant hover:bg-surface-container-high transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-secondary text-on-secondary font-body-medium font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {loading && <span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>}
            {loading ? "Saving…" : isEditing ? "Save Changes" : "Create Group"}
          </button>
        </div>
      </form>
    </div>
  );
}
