"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function useToggleSaveJob(jobId: string, initialSaved: boolean) {
  const router = useRouter();
  const [saved, setSaved] = useState(initialSaved);
  const [loading, setLoading] = useState(false);

  async function toggle() {
    setLoading(true);
    try {
      const res = await fetch(`/api/jobs/${jobId}/save`, { method: "POST" });
      if (res.status === 401) {
        router.push("/login");
        return;
      }
      const json = await res.json();
      if (res.ok) setSaved(json.data.saved);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return { saved, loading, toggle };
}
