"use client";

import { useState, useCallback, useEffect } from "react";
import type { PhysicalCardPricingSettings } from "@/lib/card-pricing";
import { DEFAULT_CARD_PRICING } from "@/lib/card-pricing";

export interface CreateOrderPayload {
  cardTier: string;
  deliveryAddress: string;
  recipientName: string;
  recipientPhone: string;
  paymentMethod: "COD" | "STRIPE";
  paymentRef?: string;
}

export interface CreatedOrderResponse {
  id: string;
  orderNumber: string;
  cardTier: string;
  amount: number;
  currency: string;
  deliveryAddress: string;
  paymentMethod: string;
  paymentStatus: string;
  status: string;
}

export function useCreatePhysicalCardOrder() {
  const [pricing, setPricing] = useState<PhysicalCardPricingSettings>(DEFAULT_CARD_PRICING);
  const [pricingLoading, setPricingLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPricing = useCallback(async () => {
    setPricingLoading(true);
    try {
      const res = await fetch("/api/physical-card-orders/pricing", {
        cache: "no-store",
        headers: { "Cache-Control": "no-cache" },
      });
      const json = await res.json();
      if (res.ok && json.data) {
        setPricing(json.data);
      }
    } catch (err) {
      console.error("Failed to load pricing from API, using defaults:", err);
    } finally {
      setPricingLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPricing();
  }, [fetchPricing]);

  async function createPaymentIntent(cardTier: string, recipientName?: string) {
    setError(null);
    try {
      const res = await fetch("/api/payments/stripe/create-payment-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cardTier, recipientName }),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Failed to initialize payment gateway");
      }
      return json.data as {
        id: string;
        clientSecret: string;
        amount: number;
        currency: string;
        isSandbox: boolean;
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Payment initialization failed";
      setError(msg);
      return null;
    }
  }

  async function createOrder(payload: CreateOrderPayload): Promise<CreatedOrderResponse | null> {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/physical-card-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Order placement failed");
        return null;
      }
      return json.data as CreatedOrderResponse;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "An unexpected network error occurred";
      setError(msg);
      return null;
    } finally {
      setLoading(false);
    }
  }

  return {
    pricing,
    pricingLoading,
    createOrder,
    createPaymentIntent,
    loading,
    error,
    setError,
    refetchPricing: fetchPricing,
  };
}
