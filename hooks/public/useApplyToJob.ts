"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export interface JobApplicationRecord {
  id: string;
  applicationRef: string;
  linkedinUrl: string | null;
  coverNote: string | null;
  createdAt: string;
}

export function useApplyToJob(jobId: string, initialApplication: JobApplicationRecord | null) {
  const router = useRouter();
  const [application, setApplication] = useState(initialApplication);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function apply(payload: { linkedinUrl?: string; coverNote?: string }) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/jobs/${jobId}/apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.status === 401) {
        router.push("/login");
        return;
      }
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Something went wrong. Please try again.");
        return;
      }
      setApplication(json.data.application);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return { application, loading, error, apply };
}
