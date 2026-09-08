"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function useEmployers() {
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

  const createEmployer = (payload: Record<string, unknown>) =>
    request("/api/admin/employers", { method: "POST", body: JSON.stringify(payload) });

  const updateEmployer = (id: string, payload: Record<string, unknown>) =>
    request(`/api/admin/employers/${id}`, { method: "PATCH", body: JSON.stringify(payload) });

  return { createEmployer, updateEmployer, loading, error };
}
