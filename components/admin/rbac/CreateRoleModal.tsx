"use client";

import { useState } from "react";
import { useRbac } from "@/hooks/admin/useRbac";
import { PERMISSION_MODULE_DEFINITIONS, CAPABILITY_KEYS, CAPABILITY_LABELS } from "@/lib/rbac-constants";

export interface RolePermissionRow {
  module: string;
  canRead: boolean;
  canWrite: boolean;
  canApprove: boolean;
  canExport: boolean;
  canDelete: boolean;
}

export interface RoleFormValue {
  id?: string;
  name: string;
  slug: string;
  description: string;
  priorityLevel: number;
  badgeColor?: string;
  permissions: RolePermissionRow[];
}

const BADGE_COLOR_OPTIONS = ["PRIMARY", "SECONDARY", "TERTIARY", "OUTLINE"] as const;
const BADGE_COLOR_SWATCH: Record<string, string> = {
  PRIMARY: "bg-primary/15 text-primary",
  SECONDARY: "bg-secondary/15 text-secondary",
  TERTIARY: "bg-tertiary/15 text-tertiary",
  OUTLINE: "bg-surface-container-high text-outline",
};

function emptyPermissions(): RolePermissionRow[] {
  return PERMISSION_MODULE_DEFINITIONS.map((m) => ({
    module: m.id,
    canRead: false,
    canWrite: false,
    canApprove: false,
    canExport: false,
    canDelete: false,
  }));
}

export default function CreateRoleModal({
  initial,
  onClose,
}: {
  initial?: RoleFormValue;
  onClose: () => void;
}) {
  const { createRole, updateRole, loading, error } = useRbac();
  const isEdit = Boolean(initial?.id);
  const [name, setName] = useState(initial?.name ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [priorityLevel, setPriorityLevel] = useState(initial?.priorityLevel ?? 50);
  const [badgeColor, setBadgeColor] = useState(initial?.badgeColor ?? "PRIMARY");
  const [permissions, setPermissions] = useState<RolePermissionRow[]>(
    initial?.permissions?.length ? initial.permissions : emptyPermissions()
  );

  function toggle(moduleId: string, cap: (typeof CAPABILITY_KEYS)[number]) {
    setPermissions((prev) =>
      prev.map((p) => (p.module === moduleId ? { ...p, [cap]: !p[cap] } : p))
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload = { name, description, priorityLevel, badgeColor, permissions };
    const result = isEdit
      ? await updateRole(initial!.id!, payload)
      : await createRole({ ...payload, slug });
    if (result) onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <form
        onSubmit={handleSubmit}
        className="bg-surface-container-low rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-container text-on-primary-container flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-[22px]">admin_panel_settings</span>
            </div>
            <div>
              <h2 className="font-headline-lg text-on-surface">{isEdit ? "Edit Role" : "Create Institutional Role"}</h2>
              <p className="text-[12px] text-on-surface-variant">
                Define organizational title, authority tier, and granular capability matrix.
              </p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="text-on-surface-variant hover:text-on-surface">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1">
            <span className="font-table-header uppercase text-on-surface-variant">Role Name</span>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="px-3 py-2 rounded-lg bg-surface-container border border-outline-variant/30 text-on-surface"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="font-table-header uppercase text-on-surface-variant">Slug</span>
            <input
              required
              disabled={isEdit}
              value={slug}
              onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))}
              className="px-3 py-2 rounded-lg bg-surface-container border border-outline-variant/30 text-on-surface disabled:opacity-50"
            />
          </label>
          <label className="col-span-2 flex flex-col gap-1">
            <span className="font-table-header uppercase text-on-surface-variant">Description</span>
            <textarea
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="px-3 py-2 rounded-lg bg-surface-container border border-outline-variant/30 text-on-surface"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="font-table-header uppercase text-on-surface-variant">Priority Level</span>
            <input
              type="number"
              min={1}
              max={100}
              required
              value={priorityLevel}
              onChange={(e) => setPriorityLevel(Number(e.target.value))}
              className="px-3 py-2 rounded-lg bg-surface-container border border-outline-variant/30 text-on-surface"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="font-table-header uppercase text-on-surface-variant">Badge Color Accent</span>
            <div className="flex items-center gap-2 h-9">
              {BADGE_COLOR_OPTIONS.map((color) => (
                <button
                  type="button"
                  key={color}
                  onClick={() => setBadgeColor(color)}
                  className={`flex-1 h-8 rounded-lg text-[11px] font-code-compact capitalize border transition-all cursor-pointer flex items-center justify-center ${
                    badgeColor === color
                      ? "border-primary ring-2 ring-primary/20 font-bold"
                      : "border-outline-variant/30 opacity-70 hover:opacity-100"
                  } ${BADGE_COLOR_SWATCH[color]}`}
                >
                  {color.toLowerCase()}
                </button>
              ))}
            </div>
          </label>
        </div>

        <div>
          <p className="font-table-header uppercase text-on-surface-variant mb-2">Module Permissions</p>
          <div className="overflow-x-auto border border-outline-variant/20 rounded-lg">
            <table className="w-full text-[11px]">
              <thead className="bg-surface-container-lowest/60 font-table-header uppercase text-on-surface-variant">
                <tr>
                  <th className="text-left px-3 py-2">Module</th>
                  {CAPABILITY_KEYS.map((c) => (
                    <th key={c} className="px-2 py-2 text-center">
                      {CAPABILITY_LABELS[c]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {PERMISSION_MODULE_DEFINITIONS.map((mod) => {
                  const row = permissions.find((p) => p.module === mod.id)!;
                  return (
                    <tr key={mod.id} className="border-t border-outline-variant/10">
                      <td className="px-3 py-2 text-on-surface font-body-medium">{mod.name}</td>
                      {CAPABILITY_KEYS.map((cap) => (
                        <td key={cap} className="px-2 py-2 text-center">
                          <input
                            type="checkbox"
                            checked={row[cap]}
                            onChange={() => toggle(mod.id, cap)}
                            className="w-4 h-4 accent-primary"
                          />
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {error && <p className="font-body-compact text-error">{error}</p>}

        <div className="flex items-center justify-between pt-2">
          <div className="text-[11px] font-code-compact text-outline flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-secondary"></span>
            <span>Will be cryptographically recorded in Audit Trails</span>
          </div>
          <div className="flex gap-2">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg text-on-surface-variant">
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 rounded-lg bg-primary-container text-on-primary-container font-body-medium disabled:opacity-50"
          >
            {loading ? "Saving…" : isEdit ? "Save Changes" : "Create Role"}
          </button>
          </div>
        </div>
      </form>
    </div>
  );
}
