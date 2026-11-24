"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export interface EventRegisterOptions {
  ticketCount?: number;
  attendeePhone?: string;
  attendeeName?: string;
  attendeeEmail?: string;
  notes?: string;
  paymentMethod?: string;
  paymentRef?: string;
  bookingReference?: string;
}

export function useRegisterForEvent(eventId: string) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function register(options?: EventRegisterOptions) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/events/${eventId}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(options || {}),
      });
      if (res.status === 401) {
        router.push("/login");
        return null;
      }
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Registration failed");
        return null;
      }
      router.refresh();
      return json.data ?? json;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Registration failed";
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  }

  return { register, loading, error };
}
