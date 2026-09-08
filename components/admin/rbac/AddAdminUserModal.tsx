"use client";

import { useState } from "react";
import { useRbac } from "@/hooks/admin/useRbac";

export interface AdminUserFormValue {
  id?: string;
  name: string;
  email: string;
  phone?: string | null;
  department: string;
  title: string;
  roleId: string;
  status?: string;
}

export default function AddAdminUserModal({
  initial,
  roles,
  onClose,
}: {
  initial?: AdminUserFormValue;
  roles: { id: string; name: string }[];
  onClose: () => void;
}) {
  const { createAdminUser, updateAdminUser, loading, error } = useRbac();
  const isEdit = Boolean(initial?.id);
  const [name, setName] = useState(initial?.name ?? "");
  const [email, setEmail] = useState(initial?.email ?? "");
  const [phone, setPhone] = useState(initial?.phone ?? "");
  const [department, setDepartment] = useState(initial?.department ?? "");
  const [title, setTitle] = useState(initial?.title ?? "");
  const [roleId, setRoleId] = useState(initial?.roleId ?? roles[0]?.id ?? "");
  const [status, setStatus] = useState(initial?.status ?? "ACTIVE");
  const [password, setPassword] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    let result;
    if (isEdit) {
      result = await updateAdminUser(initial!.id!, { name, phone, department, title, roleId, status });
    } else {
      result = await createAdminUser({ name, email, phone, department, title, roleId, password });
    }
    if (result) onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <form
        onSubmit={handleSubmit}
        className="bg-surface-container-low rounded-xl shadow-xl max-w-md w-full p-6 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <h2 className="font-headline-lg text-on-surface">{isEdit ? "Edit Admin User" : "Add Admin User"}</h2>
          <button type="button" onClick={onClose} className="text-on-surface-variant hover:text-on-surface">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <Field label="Full Name">
          <input required value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
        </Field>
        <Field label="Email">
          <input
            required
            type="email"
            disabled={isEdit}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={`${inputClass} disabled:opacity-50`}
          />
        </Field>
        {!isEdit && (
          <Field label="Initial Password">
            <input
              required
              minLength={8}
              type="text"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min. 8 characters — share with the new admin securely"
              className={inputClass}
            />
          </Field>
        )}
        <Field label="Phone">
          <input value={phone ?? ""} onChange={(e) => setPhone(e.target.value)} className={inputClass} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Department">
            <input required value={department} onChange={(e) => setDepartment(e.target.value)} className={inputClass} />
          </Field>
          <Field label="Title">
            <input required value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass} />
          </Field>
        </div>
        <Field label="Role">
          <select required value={roleId} onChange={(e) => setRoleId(e.target.value)} className={inputClass}>
            {roles.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </Field>
        {isEdit && (
          <Field label="Status">
            <select value={status} onChange={(e) => setStatus(e.target.value)} className={inputClass}>
              <option value="ACTIVE">Active</option>
              <option value="SUSPENDED">Suspended</option>
              <option value="PENDING_ACTIVATION">Pending Activation</option>
            </select>
          </Field>
        )}

        {error && <p className="font-body-compact text-error">{error}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg text-on-surface-variant">
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 rounded-lg bg-primary-container text-on-primary-container font-body-medium disabled:opacity-50"
          >
            {loading ? "Saving…" : isEdit ? "Save Changes" : "Create Admin User"}
          </button>
        </div>
      </form>
    </div>
  );
}

const inputClass = "w-full px-3 py-2 rounded-lg bg-surface-container border border-outline-variant/30 text-on-surface";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="font-table-header uppercase text-on-surface-variant">{label}</span>
      {children}
    </label>
  );
}
