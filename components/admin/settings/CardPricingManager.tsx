"use client";

import { useState } from "react";
import { useCardPricing } from "@/hooks/admin/useCardPricing";
import type { CardTierPricing, PhysicalCardPricingSettings } from "@/lib/card-pricing";
import { DEFAULT_CARD_PRICING } from "@/lib/card-pricing";

const TIER_METADATA: Record<
  keyof PhysicalCardPricingSettings["tiers"],
  { label: string; icon: string; badgeColor: string; blurb: string }
> = {
  STANDARD_PVC: {
    label: "Standard PVC",
    icon: "badge",
    badgeColor: "bg-surface-container-highest text-on-surface-variant",
    blurb: "Base durable card with high-resolution QR pass",
  },
  GOLD_RFID_SMART: {
    label: "Gold RFID Smart",
    icon: "contactless",
    badgeColor: "bg-tertiary/20 text-tertiary font-bold",
    blurb: "13.56MHz RFID chip for campus turnstile tap access",
  },
  EXECUTIVE_TITANIUM: {
    label: "Executive Titanium",
    icon: "shield_with_heart",
    badgeColor: "bg-primary/20 text-primary font-bold",
    blurb: "Solid laser-etched metal titanium for alumni patrons",
  },
};

export default function CardPricingManager({
  canWrite = true,
  onClose,
  onSaved,
}: {
  canWrite?: boolean;
  onClose?: () => void;
  onSaved?: () => void;
}) {
  const { pricing, loading, saving, error, successMessage, updatePricing } = useCardPricing();
  const [formState, setFormState] = useState<PhysicalCardPricingSettings | null>(null);

  // Sync state once loaded if not already edited
  const current = formState ?? pricing;

  function updateTierField<K extends keyof PhysicalCardPricingSettings["tiers"]>(
    tierKey: K,
    field: keyof CardTierPricing,
    value: unknown
  ) {
    if (!current) return;
    setFormState({
      ...current,
      tiers: {
        ...current.tiers,
        [tierKey]: {
          ...current.tiers[tierKey],
          [field]: value,
        },
      },
    });
  }

  async function handleSave() {
    if (!current) return;
    const ok = await updatePricing(current);
    if (ok) {
      onSaved?.();
    }
  }

  function handleResetDefaults() {
    if (confirm("Reset all card pricing and payment configurations to system defaults?")) {
      setFormState({ ...DEFAULT_CARD_PRICING });
    }
  }

  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        <p className="mt-2 font-body-compact text-on-surface-variant text-xs">Loading card pricing config…</p>
      </div>
    );
  }

  const currencySymbol = current.currency === "SLE" ? "SLE" : "$";

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-outline-variant/15 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[22px]">payments</span>
            <h3 className="font-headline-md text-on-surface">Physical ID Card Pricing & Payment Options</h3>
          </div>
          <p className="font-body-compact text-on-surface-variant text-xs mt-1">
            Configure member card tier pricing, courier delivery fees, and enabled payment channels (COD & Stripe).
          </p>
        </div>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-on-surface-variant hover:bg-surface-container-high transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        )}
      </div>

      {/* Notifications */}
      {error && (
        <div className="rounded-xl bg-error-container/40 p-3 text-xs font-medium text-error flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px]">error</span>
          <span>{error}</span>
        </div>
      )}
      {successMessage && (
        <div className="rounded-xl bg-emerald-500/10 p-3 text-xs font-medium text-emerald-600 flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px]">check_circle</span>
          <span>{successMessage}</span>
        </div>
      )}

      {/* Global Config: Currency & Delivery & Payment Methods */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-xl bg-surface-container p-4 border border-outline-variant/10">
          <label className="block text-xs font-bold text-on-surface uppercase tracking-wider mb-1">
            Primary Currency
          </label>
          <select
            disabled={!canWrite}
            value={current.currency}
            onChange={(e) =>
              setFormState({ ...current, currency: e.target.value as "USD" | "SLE" })
            }
            className="w-full rounded-lg bg-surface-container-high border border-outline-variant/30 px-3 py-2 text-sm font-semibold text-on-surface focus:outline-hidden focus:ring-2 focus:ring-primary"
          >
            <option value="USD">USD ($ - United States Dollar)</option>
            <option value="SLE">SLE (Le - Sierra Leonean Leone)</option>
          </select>
          <p className="text-[11px] text-on-surface-variant mt-1.5">
            Default billing currency applied to all member card orders.
          </p>
        </div>

        <div className="rounded-xl bg-surface-container p-4 border border-outline-variant/10">
          <label className="block text-xs font-bold text-on-surface uppercase tracking-wider mb-1">
            Flat Courier Shipping Fee
          </label>
          <div className="relative">
            <span className="absolute left-3 top-2 text-sm font-bold text-on-surface-variant">
              {currencySymbol}
            </span>
            <input
              type="number"
              min="0"
              step="1"
              disabled={!canWrite}
              value={current.shippingFee}
              onChange={(e) =>
                setFormState({ ...current, shippingFee: parseFloat(e.target.value) || 0 })
              }
              className="w-full rounded-lg bg-surface-container-high border border-outline-variant/30 pl-8 pr-3 py-2 text-sm font-semibold text-on-surface focus:outline-hidden focus:ring-2 focus:ring-primary"
            />
          </div>
          <p className="text-[11px] text-on-surface-variant mt-1.5">
            Added to order total at checkout (set 0 for Free Courier Shipping).
          </p>
        </div>

        <div className="rounded-xl bg-surface-container p-4 border border-outline-variant/10">
          <label className="block text-xs font-bold text-on-surface uppercase tracking-wider mb-2">
            Active Payment Gateways
          </label>
          <div className="space-y-2">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-on-surface">
              <input
                type="checkbox"
                disabled={!canWrite}
                checked={current.codEnabled}
                onChange={(e) => setFormState({ ...current, codEnabled: e.target.checked })}
                className="rounded border-outline-variant text-primary focus:ring-primary h-4 w-4"
              />
              <span>Cash on Delivery (COD)</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-on-surface">
              <input
                type="checkbox"
                disabled={!canWrite}
                checked={current.stripeEnabled}
                onChange={(e) => setFormState({ ...current, stripeEnabled: e.target.checked })}
                className="rounded border-outline-variant text-primary focus:ring-primary h-4 w-4"
              />
              <span>Stripe Payment Gateway (Card/Online)</span>
            </label>
          </div>
        </div>
      </div>

      {/* Tier Pricing Cards */}
      <div className="space-y-3">
        <h4 className="font-headline-sm text-on-surface text-sm font-bold">Tier Pricing Specifications</h4>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {(["STANDARD_PVC", "GOLD_RFID_SMART", "EXECUTIVE_TITANIUM"] as const).map((tierKey) => {
            const tier = current.tiers[tierKey];
            const meta = TIER_METADATA[tierKey];

            return (
              <div
                key={tierKey}
                className={`rounded-2xl border p-4 transition-all ${
                  tier.enabled
                    ? "bg-surface-container-low border-outline-variant/30 shadow-xs"
                    : "bg-surface-container-lowest/60 border-outline-variant/15 opacity-60"
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[20px] text-primary">{meta.icon}</span>
                    <span className="font-headline-sm text-sm text-on-surface">{meta.label}</span>
                  </div>
                  <label className="flex items-center gap-1.5 cursor-pointer text-[11px] text-on-surface-variant font-medium">
                    <input
                      type="checkbox"
                      disabled={!canWrite}
                      checked={tier.enabled}
                      onChange={(e) => updateTierField(tierKey, "enabled", e.target.checked)}
                      className="rounded border-outline-variant text-primary focus:ring-primary h-3.5 w-3.5"
                    />
                    <span>{tier.enabled ? "Active" : "Disabled"}</span>
                  </label>
                </div>

                <p className="text-[11.5px] text-on-surface-variant line-clamp-2 min-h-[34px] mb-3">
                  {meta.blurb}
                </p>

                {/* Price Input */}
                <div className="mb-3">
                  <label className="block text-[10.5px] font-bold text-on-surface uppercase tracking-wider mb-1">
                    Card Price ({current.currency})
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-sm font-bold text-primary">
                      {currencySymbol}
                    </span>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      disabled={!canWrite || !tier.enabled}
                      value={tier.price}
                      onChange={(e) =>
                        updateTierField(tierKey, "price", parseFloat(e.target.value) || 0)
                      }
                      className="w-full rounded-xl bg-surface-container border border-outline-variant/30 pl-8 pr-3 py-2 text-base font-black text-on-surface focus:outline-hidden focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>

                {/* Features Highlights */}
                <div>
                  <label className="block text-[10.5px] font-bold text-on-surface uppercase tracking-wider mb-1.5">
                    Included Features
                  </label>
                  <ul className="space-y-1 text-[11px] text-on-surface-variant">
                    {tier.features.map((feat, idx) => (
                      <li key={idx} className="flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[14px] text-emerald-500">check</span>
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Action Footer */}
      {canWrite && (
        <div className="flex items-center justify-between pt-2 border-t border-outline-variant/15">
          <button
            type="button"
            onClick={handleResetDefaults}
            disabled={saving}
            className="text-xs font-semibold text-on-surface-variant hover:text-error transition-colors px-2 py-1"
          >
            Reset to System Defaults
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1.5 rounded-xl bg-primary text-on-primary px-5 py-2.5 font-body-medium font-bold shadow-sm hover:opacity-95 transition-opacity disabled:opacity-50 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">save</span>
            <span>{saving ? "Saving Changes…" : "Save Pricing Configuration"}</span>
          </button>
        </div>
      )}
    </div>
  );
}
