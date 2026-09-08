"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function useAdminJobs() {
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

  const createJob = (payload: Record<string, unknown>) =>
    request("/api/admin/jobs", { method: "POST", body: JSON.stringify(payload) });

  const updateJob = (id: string, payload: Record<string, unknown>) =>
    request(`/api/admin/jobs/${id}`, { method: "PATCH", body: JSON.stringify(payload) });

  const addApplication = (jobId: string, payload: Record<string, unknown>) =>
    request(`/api/admin/jobs/${jobId}/applications`, { method: "POST", body: JSON.stringify(payload) });

  const updateApplication = (jobId: string, appId: string, payload: Record<string, unknown>) =>
    request(`/api/admin/jobs/${jobId}/applications/${appId}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });

  const selectApplication = (jobId: string, appId: string, payload: Record<string, unknown>) =>
    request(`/api/admin/jobs/${jobId}/applications/${appId}/select`, {
      method: "POST",
      body: JSON.stringify(payload),
    });

  return { createJob, updateJob, addApplication, updateApplication, selectApplication, loading, error };
}
