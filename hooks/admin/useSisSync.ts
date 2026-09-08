"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function useSisSync() {
  const router = useRouter();
  const [triggering, setTriggering] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function trigger() {
    setTriggering(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/sis-sync/trigger", { method: "POST" });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json.error ?? "Sync failed to trigger");
        return null;
      }
      router.refresh();
      return json.data;
    } finally {
      setTriggering(false);
    }
  }

  return { trigger, triggering, error };
}
