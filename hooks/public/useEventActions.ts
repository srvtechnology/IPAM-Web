"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function useRegisterForEvent(eventId: string) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function register() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/events/${eventId}/register`, { method: "POST" });
      if (res.status === 401) {
        router.push("/login");
        return false;
      }
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Registration failed");
        return false;
      }
      router.refresh();
      return true;
    } finally {
      setLoading(false);
    }
  }

  return { register, loading, error };
}
