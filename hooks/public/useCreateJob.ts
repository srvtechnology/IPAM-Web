"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function useCreateJob() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function createJob(payload: Record<string, unknown>) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) {
        let msg = json.error ?? "Could not post job";
        const issues = json.data?.issues || json.issues;
        if (issues?.fieldErrors && Object.keys(issues.fieldErrors).length > 0) {
          const fieldMsgs = Object.entries(issues.fieldErrors)
            .map(([field, errs]) => `${field}: ${(errs as string[]).join(", ")}`)
            .join(" • ");
          msg = `Validation failed: ${fieldMsgs}`;
        }
        setError(msg);
        return false;
      }
      router.refresh();
      return true;
    } finally {
      setLoading(false);
    }
  }

  return { createJob, loading, error };
}
