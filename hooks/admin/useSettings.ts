"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function useSettings() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function updateDefaultTheme(theme: "dark" | "light") {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ defaultTheme: theme }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json.error ?? "Failed to save settings");
        return null;
      }
      router.refresh();
      return json.data;
    } finally {
      setSaving(false);
    }
  }

  return { updateDefaultTheme, saving, error };
}
