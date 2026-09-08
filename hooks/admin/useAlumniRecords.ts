"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function useAlumniRecords() {
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

  const createRecord = (payload: Record<string, unknown>) =>
    request("/api/admin/directory", { method: "POST", body: JSON.stringify(payload) });

  const updateRecord = (id: string, payload: Record<string, unknown>) =>
    request(`/api/admin/directory/${id}`, { method: "PATCH", body: JSON.stringify(payload) });

  const approveRecord = (id: string) =>
    request(`/api/admin/directory/${id}/approve`, { method: "PATCH" });

  return { createRecord, updateRecord, approveRecord, loading, error };
}
