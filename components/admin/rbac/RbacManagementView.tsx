"use client";

import { useState } from "react";
import { useAdminSession } from "@/lib/admin/context";
import { useRbac } from "@/hooks/admin/useRbac";
import CreateRoleModal, { type RoleFormValue } from "./CreateRoleModal";
import AddAdminUserModal, { type AdminUserFormValue } from "./AddAdminUserModal";

export interface RoleRow {
  id: string;
  name: string;
  slug: string;
  description: string;
  isSystemDefault: boolean;
  priorityLevel: number;
  permissions: { module: string; canRead: boolean; canWrite: boolean; canApprove: boolean; canExport: boolean; canDelete: boolean }[];
  _count: { users: number };
}

export interface AdminUserRow {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  department: string;
  title: string;
  status: string;
  roleId: string;
  role: { id: string; name: string };
  lastLoginAt: string | null;
  assignedDate: string;
}

const STATUS_COLOR: Record<string, string> = {
  ACTIVE: "bg-tertiary/15 text-tertiary",
  SUSPENDED: "bg-error/15 text-error",
  PENDING_ACTIVATION: "bg-secondary/15 text-secondary",
};

export default function RbacManagementView({ roles, users }: { roles: RoleRow[]; users: AdminUserRow[] }) {
  const { can } = useAdminSession();
  const { deleteRole, loading } = useRbac();
  const [tab, setTab] = useState<"roles" | "users">("roles");
  const [editingRole, setEditingRole] = useState<RoleFormValue | null>(null);
  const [creatingRole, setCreatingRole] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUserFormValue | null>(null);
  const [creatingUser, setCreatingUser] = useState(false);
  const canWrite = can("RBAC_GOVERNANCE", "canWrite");
  const canDelete = can("RBAC_GOVERNANCE", "canDelete");

  async function handleDeleteRole(role: RoleRow) {
    if (role.isSystemDefault) return;
    if (!confirm(`Delete role "${role.name}"? This cannot be undone.`)) return;
    await deleteRole(role.id);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-headline-lg text-on-surface">RBAC & Access Control</h1>
          <p className="font-body-default text-on-surface-variant mt-1">
            {roles.length} roles · {users.length} admin users
          </p>
        </div>
        {canWrite && tab === "roles" && (
          <button
            onClick={() => setCreatingRole(true)}
            className="px-4 py-2 rounded-lg bg-primary-container text-on-primary-container font-body-medium"
          >
            + New Role
          </button>
        )}
        {canWrite && tab === "users" && (
          <button
            onClick={() => setCreatingUser(true)}
            className="px-4 py-2 rounded-lg bg-primary-container text-on-primary-container font-body-medium"
          >
            + Add Admin User
          </button>
        )}
      </div>

      <div className="flex gap-2 border-b border-outline-variant/30">
        {(["roles", "users"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 font-body-medium border-b-2 -mb-px ${
              tab === t ? "border-primary text-primary" : "border-transparent text-on-surface-variant"
            }`}
          >
            {t === "roles" ? "Roles & Permissions" : "Admin Users"}
          </button>
        ))}
      </div>

      {tab === "roles" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {roles.map((role) => (
            <div key={role.id} className="bg-surface-container-low rounded-xl shadow-md p-4 space-y-2">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-headline-sm text-on-surface flex items-center gap-2">
                    {role.name}
                    {role.isSystemDefault && (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-primary-container text-on-primary-container">
                        System Default
                      </span>
                    )}
                  </p>
                  <p className="font-code-compact text-[10px] text-on-surface-variant">{role.slug}</p>
                </div>
                <span className="text-[11px] text-on-surface-variant">{role._count.users} users</span>
              </div>
              <p className="font-body-compact text-on-surface-variant">{role.description}</p>
              <p className="font-body-compact text-on-surface-variant">
                {role.permissions.filter((p) => p.canRead).length}/10 modules readable
              </p>
              {canWrite && (
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() =>
                      setEditingRole({
                        id: role.id,
                        name: role.name,
                        slug: role.slug,
                        description: role.description,
                        priorityLevel: role.priorityLevel,
                        permissions: role.permissions,
                      })
                    }
                    className="px-3 py-1.5 rounded-lg bg-surface-container text-on-surface font-body-medium text-[12px]"
                  >
                    Edit Permissions
                  </button>
                  {canDelete && !role.isSystemDefault && (
                    <button
                      onClick={() => handleDeleteRole(role)}
                      disabled={loading || role._count.users > 0}
                      className="px-3 py-1.5 rounded-lg bg-error/10 text-error font-body-medium text-[12px] disabled:opacity-40"
                      title={role._count.users > 0 ? "Reassign users before deleting" : undefined}
                    >
                      Delete
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {tab === "users" && (
        <div className="bg-surface-container-low rounded-xl shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-[12px]">
              <thead className="bg-surface-container-lowest/60 font-table-header uppercase text-on-surface-variant">
                <tr>
                  <th className="text-left px-4 py-2.5">Name</th>
                  <th className="text-left px-4 py-2.5">Role</th>
                  <th className="text-left px-4 py-2.5">Department</th>
                  <th className="text-left px-4 py-2.5">Status</th>
                  <th className="text-left px-4 py-2.5">Last Login</th>
                  {canWrite && <th className="px-4 py-2.5"></th>}
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-t border-outline-variant/20">
                    <td className="px-4 py-2.5">
                      <p className="font-body-medium text-on-surface">{u.name}</p>
                      <p className="text-[10px] text-on-surface-variant">{u.email}</p>
                    </td>
                    <td className="px-4 py-2.5 text-on-surface-variant">{u.role.name}</td>
                    <td className="px-4 py-2.5 text-on-surface-variant">{u.department}</td>
                    <td className="px-4 py-2.5">
                      <span className={`px-2 py-0.5 rounded font-table-header ${STATUS_COLOR[u.status] ?? ""}`}>
                        {u.status.replaceAll("_", " ")}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-on-surface-variant">
                      {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString() : "Never"}
                    </td>
                    {canWrite && (
                      <td className="px-4 py-2.5 text-right">
                        <button
                          onClick={() =>
                            setEditingUser({
                              id: u.id,
                              name: u.name,
                              email: u.email,
                              phone: u.phone,
                              department: u.department,
                              title: u.title,
                              roleId: u.roleId,
                              status: u.status,
                            })
                          }
                          className="font-body-medium text-primary text-[12px]"
                        >
                          Edit
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {(creatingRole || editingRole) && (
        <CreateRoleModal
          initial={editingRole ?? undefined}
          onClose={() => {
            setCreatingRole(false);
            setEditingRole(null);
          }}
        />
      )}
      {(creatingUser || editingUser) && (
        <AddAdminUserModal
          initial={editingUser ?? undefined}
          roles={roles.map((r) => ({ id: r.id, name: r.name }))}
          onClose={() => {
            setCreatingUser(false);
            setEditingUser(null);
          }}
        />
      )}
    </div>
  );
}
