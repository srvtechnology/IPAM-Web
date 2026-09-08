"use client";

import { useState } from "react";

export function useAuditLogs() {
  const [verifying, setVerifying] = useState<string | null>(null);

  async function verifyIntegrity(id: string): Promise<{ valid: boolean } | null> {
    setVerifying(id);
    try {
      const res = await fetch(`/api/admin/audit-logs/${id}/verify`);
      const json = await res.json().catch(() => ({}));
      if (!res.ok) return null;
      return json.data;
    } finally {
      setVerifying(null);
    }
  }

  return { verifyIntegrity, verifying };
}
