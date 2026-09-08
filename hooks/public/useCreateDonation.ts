"use client";

import { useState } from "react";

export function useCreateDonation() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function createDonation(payload: Record<string, unknown>) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/donations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Donation failed");
        return null;
      }
      return json.data as { id: string; paymentRef: string; amount: string; fund: string; currency: string };
    } finally {
      setLoading(false);
    }
  }

  return { createDonation, loading, error };
}
