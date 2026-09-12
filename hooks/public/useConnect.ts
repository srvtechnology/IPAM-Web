"use client";

import { useState } from "react";

export function useConnect() {
  const [loading, setLoading] = useState(false);

  async function connect(alumniId: string) {
    setLoading(true);
    try {
      const res = await fetch(`/api/alumni/${alumniId}/connect`, { method: "POST" });
      return res.ok;
    } finally {
      setLoading(false);
    }
  }

  return { connect, loading };
}
