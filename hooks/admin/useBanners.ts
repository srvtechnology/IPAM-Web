"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function useBanners() {
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

  const createBanner = (payload: Record<string, unknown>) =>
    request("/api/admin/banners", { method: "POST", body: JSON.stringify(payload) });

  const updateBanner = (id: string, payload: Record<string, unknown>) =>
    request(`/api/admin/banners/${id}`, { method: "PATCH", body: JSON.stringify(payload) });

  const toggleBanner = (id: string) =>
    request(`/api/admin/banners/${id}/toggle`, { method: "PATCH" });

  return { createBanner, updateBanner, toggleBanner, loading, error };
}
