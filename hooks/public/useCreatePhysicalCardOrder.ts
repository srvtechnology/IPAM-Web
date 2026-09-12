"use client";

import { useState } from "react";

export function useCreatePhysicalCardOrder() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function createOrder(payload: { cardTier: string; deliveryAddress: string }) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/physical-card-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Order failed");
        return null;
      }
      return json.data as { id: string; orderNumber: string; cardTier: string; deliveryAddress: string };
    } finally {
      setLoading(false);
    }
  }

  return { createOrder, loading, error };
}
