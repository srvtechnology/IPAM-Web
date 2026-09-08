"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function useRbac() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function request(url: string, options: RequestInit) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(url, {
        ...options,
        headers: { "Content-Type": "application/json", ...(options.headers ?? {}) },
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json.error ?? "Request failed");
        return null;
      }
      router.refresh();
      return json.data;
    } finally {
      setLoading(false);
    }
  }

  const createRole = (payload: Record<string, unknown>) =>
    request("/api/admin/rbac/roles", { method: "POST", body: JSON.stringify(payload) });

  const updateRole = (id: string, payload: Record<string, unknown>) =>
    request(`/api/admin/rbac/roles/${id}`, { method: "PATCH", body: JSON.stringify(payload) });

  const deleteRole = (id: string) => request(`/api/admin/rbac/roles/${id}`, { method: "DELETE" });

  const createAdminUser = (payload: Record<string, unknown>) =>
    request("/api/admin/rbac/users", { method: "POST", body: JSON.stringify(payload) });

  const updateAdminUser = (id: string, payload: Record<string, unknown>) =>
    request(`/api/admin/rbac/users/${id}`, { method: "PATCH", body: JSON.stringify(payload) });

  return { createRole, updateRole, deleteRole, createAdminUser, updateAdminUser, loading, error };
}
