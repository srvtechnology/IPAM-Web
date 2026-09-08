"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function useBroadcast() {
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

  const createTemplate = (payload: Record<string, unknown>) =>
    request("/api/admin/broadcast/templates", { method: "POST", body: JSON.stringify(payload) });

  const deleteTemplate = (id: string) =>
    request(`/api/admin/broadcast/templates/${id}`, { method: "DELETE" });

  const createAudienceGroup = (payload: Record<string, unknown>) =>
    request("/api/admin/broadcast/audience-groups", { method: "POST", body: JSON.stringify(payload) });

  const deleteAudienceGroup = (id: string) =>
    request(`/api/admin/broadcast/audience-groups/${id}`, { method: "DELETE" });

  const sendBroadcast = (payload: Record<string, unknown>) =>
    request("/api/admin/broadcast/records", { method: "POST", body: JSON.stringify(payload) });

  return {
    createTemplate,
    deleteTemplate,
    createAudienceGroup,
    deleteAudienceGroup,
    sendBroadcast,
    loading,
    error,
  };
}
