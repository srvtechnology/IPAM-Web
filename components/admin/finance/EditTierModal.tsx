"use client";

import { useState } from "react";
import { type MembershipTierKey } from "@/lib/subscription-pricing";

export interface TierConfigData {
  id: string;
  tier: MembershipTierKey;
  name: string;
  tagline: string;
  description: string;
  badgeText: string | null;
  isFree: boolean;
  annualPrice: number;
  lifetimePrice: number;
  monthlyPrice: number;
  currency: string;
  isActive: boolean;
  sortOrder: number;
  perks: string[];
  accentColor: string;
}

export default function EditTierModal({
  plan,
  onClose,
  onSuccess,
}: {
  plan: TierConfigData;
  onClose: () => void;
  onSuccess: (updated: TierConfigData) => void;
}) {
  const [name, setName] = useState(plan.name);
  const [tagline, setTagline] = useState(plan.tagline);
  const [description, setDescription] = useState(plan.description);
  const [badgeText, setBadgeText] = useState(plan.badgeText || "");
  const [isFree, setIsFree] = useState(plan.isFree);
  const [annualPrice, setAnnualPrice] = useState(plan.annualPrice);
  const [lifetimePrice, setLifetimePrice] = useState(plan.lifetimePrice);
  const [monthlyPrice, setMonthlyPrice] = useState(plan.monthlyPrice);
  const [isActive, setIsActive] = useState(plan.isActive);
  const [perks, setPerks] = useState<string[]>(
    Array.isArray(plan.perks) ? plan.perks : []
  );
  const [newPerkInput, setNewPerkInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  function handleAddPerk() {
    const trimmed = newPerkInput.trim();
    if (!trimmed) return;
    setPerks([...perks, trimmed]);
    setNewPerkInput("");
  }

  function handleRemovePerk(index: number) {
    setPerks(perks.filter((_, i) => i !== index));
  }

  function handleMovePerk(index: number, direction: "up" | "down") {
    const target = direction === "up" ? index - 1 : index + 1;
    if (target < 0 || target >= perks.length) return;
    const copy = [...perks];
    const [moved] = copy.splice(index, 1);
    copy.splice(target, 0, moved);
    setPerks(copy);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    try {
      const payload = {
        name,
        tagline,
        description,
        badgeText: badgeText.trim() ? badgeText.trim() : null,
        isFree,
        annualPrice: isFree ? 0 : Number(annualPrice),
        lifetimePrice: isFree ? 0 : Number(lifetimePrice),
        monthlyPrice: isFree ? 0 : Number(monthlyPrice),
        isActive,
        perks: perks.filter((p) => p.trim().length > 0),
        accentColor: plan.accentColor,
        sortOrder: plan.sortOrder,
      };

      const res = await fetch(`/api/admin/subscription-plans/${plan.tier}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Failed to update subscription tier");
      }

      const updated = json.data || json;
      onSuccess({
        ...plan,
        ...updated,
        perks: Array.isArray(updated.perks) ? updated.perks : perks,
      });
      onClose();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Error updating tier plan");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-2xl border border-outline-variant/30 bg-surface-container-low shadow-2xl my-8">
        <div className="flex items-center justify-between border-b border-outline-variant/30 px-6 py-4 bg-surface-container-lowest/80 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-primary text-[24px]">tune</span>
            <div>
              <h2 className="font-headline-sm text-on-surface">Edit {plan.tier.replace(/_/g, " ")} Plan</h2>
              <p className="font-body-compact text-on-surface-variant">
                Configure dynamic pricing, promotional badges, and membership perks
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-on-surface-variant hover:bg-surface-container-high transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <form onSubmit={handleSave} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {errorMsg && (
            <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3.5 text-xs font-semibold text-rose-500">
              {errorMsg}
            </div>
          )}

          {/* Tier Identity */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-table-header uppercase text-on-surface-variant text-[11px] mb-1">
                Display Plan Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border border-outline-variant/40 bg-surface-container px-3.5 py-2 font-body-default text-on-surface focus:border-primary outline-hidden"
                placeholder="e.g. Silver Patron"
              />
            </div>
            <div>
              <label className="block font-table-header uppercase text-on-surface-variant text-[11px] mb-1">
                Highlight Badge (Optional)
              </label>
              <input
                type="text"
                value={badgeText}
                onChange={(e) => setBadgeText(e.target.value)}
                className="w-full rounded-lg border border-outline-variant/40 bg-surface-container px-3.5 py-2 font-body-default text-on-surface focus:border-primary outline-hidden"
                placeholder="e.g. EXECUTIVE CHOICE or POPULAR"
              />
            </div>
          </div>

          <div>
            <label className="block font-table-header uppercase text-on-surface-variant text-[11px] mb-1">
              Tagline / Headline
            </label>
            <input
              type="text"
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              className="w-full rounded-lg border border-outline-variant/40 bg-surface-container px-3.5 py-2 font-body-default text-on-surface focus:border-primary outline-hidden"
              placeholder="e.g. Distinguished Patronage & Professional Mentorship"
            />
          </div>

          <div>
            <label className="block font-table-header uppercase text-on-surface-variant text-[11px] mb-1">
              Description
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-lg border border-outline-variant/40 bg-surface-container px-3.5 py-2 font-body-default text-on-surface focus:border-primary outline-hidden"
              placeholder="Detailed explanation of this alumni patronage level..."
            />
          </div>

          {/* Pricing Settings */}
          <div className="rounded-xl border border-outline-variant/30 bg-surface-container-lowest/60 p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-outline-variant/20 pb-2">
              <span className="font-table-header uppercase text-on-surface text-xs font-bold">
                Pricing &amp; Cost Configuration
              </span>
              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-on-surface">
                <input
                  type="checkbox"
                  checked={isFree}
                  onChange={(e) => setIsFree(e.target.checked)}
                  className="rounded border-outline-variant text-primary"
                />
                <span>Free Plan ($0)</span>
              </label>
            </div>

            {!isFree ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                <div>
                  <label className="block font-table-header uppercase text-on-surface-variant text-[10px] mb-1">
                    Annual Price ($ USD) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    required={!isFree}
                    value={annualPrice}
                    onChange={(e) => setAnnualPrice(Number(e.target.value))}
                    className="w-full rounded-lg border border-outline-variant/40 bg-surface-container px-3 py-1.5 font-code-compact font-bold text-on-surface focus:border-primary outline-hidden"
                  />
                </div>
                <div>
                  <label className="block font-table-header uppercase text-on-surface-variant text-[10px] mb-1">
                    Lifetime Price ($ USD) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    required={!isFree}
                    value={lifetimePrice}
                    onChange={(e) => setLifetimePrice(Number(e.target.value))}
                    className="w-full rounded-lg border border-outline-variant/40 bg-surface-container px-3 py-1.5 font-code-compact font-bold text-on-surface focus:border-primary outline-hidden"
                  />
                </div>
                <div>
                  <label className="block font-table-header uppercase text-on-surface-variant text-[10px] mb-1">
                    Monthly Price ($ USD)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={monthlyPrice}
                    onChange={(e) => setMonthlyPrice(Number(e.target.value))}
                    className="w-full rounded-lg border border-outline-variant/40 bg-surface-container px-3 py-1.5 font-code-compact font-bold text-on-surface focus:border-primary outline-hidden"
                  />
                </div>
              </div>
            ) : (
              <p className="text-xs text-on-surface-variant italic py-1">
                This plan is marked as Free ($0). Standard alumni privileges apply at zero cost.
              </p>
            )}
          </div>

          {/* Dynamic Perks Checklist */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-table-header uppercase text-on-surface-variant text-[11px]">
                Membership Perks &amp; Feature Privileges ({perks.length})
              </label>
              <span className="text-[11px] text-on-surface-variant">Displayed as bullet checklist to alumni</span>
            </div>

            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {perks.map((perk, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 rounded-lg border border-outline-variant/30 bg-surface-container p-2 text-xs text-on-surface"
                >
                  <span className="material-symbols-outlined text-[16px] text-secondary">check_circle</span>
                  <input
                    type="text"
                    value={perk}
                    onChange={(e) => {
                      const updated = [...perks];
                      updated[idx] = e.target.value;
                      setPerks(updated);
                    }}
                    className="flex-1 bg-transparent border-0 font-body-compact text-on-surface focus:outline-hidden"
                  />
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => handleMovePerk(idx, "up")}
                      className="p-1 text-on-surface-variant hover:text-on-surface disabled:opacity-30"
                      title="Move Up"
                    >
                      <span className="material-symbols-outlined text-[14px]">arrow_upward</span>
                    </button>
                    <button
                      type="button"
                      disabled={idx === perks.length - 1}
                      onClick={() => handleMovePerk(idx, "down")}
                      className="p-1 text-on-surface-variant hover:text-on-surface disabled:opacity-30"
                      title="Move Down"
                    >
                      <span className="material-symbols-outlined text-[14px]">arrow_downward</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemovePerk(idx)}
                      className="p-1 text-rose-400 hover:text-rose-500"
                      title="Delete Perk"
                    >
                      <span className="material-symbols-outlined text-[14px]">delete</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="text"
                value={newPerkInput}
                onChange={(e) => setNewPerkInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddPerk();
                  }
                }}
                placeholder="Add new perk (e.g. VIP seating, directory boost...)"
                className="flex-1 rounded-lg border border-outline-variant/40 bg-surface-container px-3 py-2 text-xs text-on-surface focus:border-primary outline-hidden"
              />
              <button
                type="button"
                onClick={handleAddPerk}
                className="flex items-center gap-1 rounded-lg bg-surface-container-high px-3.5 py-2 text-xs font-bold text-on-surface hover:bg-surface-container-highest transition-colors"
              >
                <span className="material-symbols-outlined text-[16px]">add</span>
                <span>Add Perk</span>
              </button>
            </div>
          </div>

          {/* Visibility toggle */}
          <div className="flex items-center justify-between border-t border-outline-variant/20 pt-3">
            <div>
              <span className="text-xs font-bold text-on-surface block">Active on Alumni Portal</span>
              <span className="text-[11px] text-on-surface-variant">
                If disabled, alumni cannot select or upgrade to this tier.
              </span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-surface-container-highest peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 border-t border-outline-variant/30 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-lg border border-outline-variant/30 px-4 py-2 font-body-compact text-on-surface-variant hover:bg-surface-container-high transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2 font-headline-sm text-on-primary hover:opacity-90 active:scale-95 transition-all disabled:opacity-50"
            >
              {loading && <span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>}
              <span>Save Tier Changes</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
