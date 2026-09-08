"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function useCreateBusiness() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function createBusiness(payload: Record<string, unknown>) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/businesses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Could not submit business");
        return false;
      }
      router.refresh();
      return true;
    } finally {
      setLoading(false);
    }
  }

  return { createBusiness, loading, error };
}
