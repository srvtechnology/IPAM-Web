"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { HeroSlide } from "@/lib/hero-slides";

export function useHeroCarousel() {
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
        setError(json.error ?? "Operation failed");
        return null;
      }
      router.refresh();
      return json.data ?? json;
    } catch {
      setError("Network error occurred.");
      return null;
    } finally {
      setLoading(false);
    }
  }

  const createSlide = (payload: Partial<HeroSlide>) =>
    request("/api/admin/hero-slides", {
      method: "POST",
      body: JSON.stringify(payload),
    });

  const updateSlide = (id: string, payload: Partial<HeroSlide>) =>
    request(`/api/admin/hero-slides/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });

  const deleteSlide = (id: string) =>
    request(`/api/admin/hero-slides/${id}`, {
      method: "DELETE",
    });

  const reorderSlides = (slideIds: string[]) =>
    request("/api/admin/hero-slides/reorder", {
      method: "POST",
      body: JSON.stringify({ slideIds }),
    });

  const resetToDefaults = () =>
    request("/api/admin/hero-slides/reset", {
      method: "POST",
    });

  const toggleSlideActive = (id: string, currentActive: boolean) =>
    updateSlide(id, { active: !currentActive });

  return {
    createSlide,
    updateSlide,
    deleteSlide,
    reorderSlides,
    resetToDefaults,
    toggleSlideActive,
    loading,
    error,
  };
}
