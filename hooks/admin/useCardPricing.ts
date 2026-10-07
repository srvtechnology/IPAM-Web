"use client";

import { useState, useEffect, useCallback } from "react";
import type { PhysicalCardPricingSettings } from "@/lib/card-pricing";
import { DEFAULT_CARD_PRICING } from "@/lib/card-pricing";

export function useCardPricing() {
  const [pricing, setPricing] = useState<PhysicalCardPricingSettings>(DEFAULT_CARD_PRICING);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fetchPricing = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/settings/card-pricing", {
        cache: "no-store",
        headers: { "Cache-Control": "no-cache" },
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to load card pricing");
      setPricing(json.data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load pricing");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPricing();
  }, [fetchPricing]);

  async function updatePricing(updated: PhysicalCardPricingSettings): Promise<boolean> {
    setSaving(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const res = await fetch("/api/admin/settings/card-pricing", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to save card pricing");
      setPricing(json.data);
      setSuccessMessage("Card pricing & payment settings saved successfully");
      return true;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save card pricing");
      return false;
    } finally {
      setSaving(false);
    }
  }

  return {
    pricing,
    setPricing,
    loading,
    saving,
    error,
    successMessage,
    refetch: fetchPricing,
    updatePricing,
  };
}
