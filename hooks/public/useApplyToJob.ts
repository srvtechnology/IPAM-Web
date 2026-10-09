"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export interface JobApplicationRecord {
  id: string;
  applicationRef: string;
  candidateName?: string | null;
  email?: string | null;
  phone?: string | null;
  degree?: string | null;
  faculty?: string | null;
  gradYear?: number | null;
  experienceYears?: number;
  linkedinUrl: string | null;
  coverNote: string | null;
  cvUrl?: string | null;
  cvFileName?: string | null;
  status: string; // "APPLIED" | "REVIEWING" | "SHORTLISTED" | "INTERVIEW_SCHEDULED" | "SELECTED" | "REJECTED"
  interviewDate?: string | null;
  notes?: string | null;
  selectedDate?: string | null;
  offerSalary?: string | null;
  startDate?: string | null;
  decisionStatus?: string | null; // "OFFER_EXTENDED" | "OFFER_ACCEPTED" | "PLACEMENT_CONFIRMED"
  recruiterRemarks?: string | null;
  matchScore?: number;
  createdAt: string;
  updatedAt?: string;
}

export function useApplyToJob(jobId: string, initialApplication: JobApplicationRecord | null) {
  const router = useRouter();
  const [application, setApplication] = useState<JobApplicationRecord | null>(initialApplication);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function apply(payload: {
    linkedinUrl?: string;
    coverNote?: string;
    phone?: string;
    experienceYears?: number;
    skills?: string[];
    cvUrl?: string;
    cvFileName?: string;
  }) {
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
      const app = json.data?.application || json.application;
      if (app) {
        setApplication({
          ...app,
          createdAt: typeof app.createdAt === "string" ? app.createdAt : new Date(app.createdAt).toISOString(),
          interviewDate: app.interviewDate ? new Date(app.interviewDate).toISOString() : null,
          startDate: app.startDate ? new Date(app.startDate).toISOString() : null,
          selectedDate: app.selectedDate ? new Date(app.selectedDate).toISOString() : null,
        });
      }
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  async function refreshStatus() {
    setRefreshing(true);
    try {
      const res = await fetch(`/api/jobs/${jobId}/apply`);
      if (res.ok) {
        const json = await res.json();
        const app = json.data?.application || json.application;
        if (app) {
          setApplication({
            ...app,
            createdAt: typeof app.createdAt === "string" ? app.createdAt : new Date(app.createdAt).toISOString(),
            interviewDate: app.interviewDate ? new Date(app.interviewDate).toISOString() : null,
            startDate: app.startDate ? new Date(app.startDate).toISOString() : null,
            selectedDate: app.selectedDate ? new Date(app.selectedDate).toISOString() : null,
          });
        }
      }
    } catch {
      // ignore
    } finally {
      setRefreshing(false);
    }
  }

  return { application, loading, refreshing, error, apply, refreshStatus };
}
