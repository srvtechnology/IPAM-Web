"use client";

import { useState } from "react";

export function useCreateEventProposal() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function createEventProposal(payload: Record<string, unknown>) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/event-proposals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Event proposal submission failed");
        return null;
      }
      return json.data as { id: string; title: string; status: string };
    } finally {
      setLoading(false);
    }
  }

  return { createEventProposal, loading, error };
}
