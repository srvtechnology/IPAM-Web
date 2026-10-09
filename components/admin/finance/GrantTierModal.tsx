"use client";

import { useState } from "react";
import { type MembershipTierKey } from "@/lib/subscription-pricing";

export interface SubscriberRow {
  userId: string;
  email: string;
  studentId: string;
  name: string;
  avatar: string | null;
  company: string;
  currentRole: string;
  tier: string;
  validUntil: string | null;
  billingCycle: string;
  autoRenew: boolean;
  latestAmountPaid: number;
  latestPaymentDate: string | null;
  latestPaymentMethod: string;
  latestRef: string | null;
}

export default function GrantTierModal({
  subscriber,
  onClose,
  onSuccess,
}: {
  subscriber: SubscriberRow;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [tier, setTier] = useState<MembershipTierKey>(
    (subscriber.tier as MembershipTierKey) || "STANDARD"
  );
  const [billingCycle, setBillingCycle] = useState<"ANNUAL" | "LIFETIME" | "MONTHLY">(
    (subscriber.billingCycle as "ANNUAL" | "LIFETIME" | "MONTHLY") || "ANNUAL"
  );
  const [isNeverExpires, setIsNeverExpires] = useState<boolean>(
    !subscriber.validUntil || subscriber.billingCycle === "LIFETIME"
  );
  const [validUntil, setValidUntil] = useState<string>(
    subscriber.validUntil
      ? new Date(subscriber.validUntil).toISOString().split("T")[0]
      : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  );
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    try {
      const expirationIso =
        tier === "STANDARD" || isNeverExpires || billingCycle === "LIFETIME"
          ? null
          : new Date(validUntil).toISOString();

      const res = await fetch("/api/admin/subscriptions/grant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: subscriber.userId,
          tier,
          billingCycle,
          validUntil: expirationIso,
          notes: notes.trim() || undefined,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Failed to grant membership tier");
      }

      onSuccess();
      onClose();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Error granting tier");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="relative w-full max-w-lg rounded-2xl border border-outline-variant/30 bg-surface-container-low shadow-2xl">
        <div className="flex items-center justify-between border-b border-outline-variant/30 px-6 py-4 bg-surface-container-lowest/80 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-primary text-[24px]">verified</span>
            <div>
              <h2 className="font-headline-sm text-on-surface">Manage Alumni Membership</h2>
              <p className="font-body-compact text-on-surface-variant">
                Grant or modify membership tier for {subscriber.name}
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

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs font-semibold text-rose-500">
              {errorMsg}
            </div>
          )}

          {/* Alumni details badge */}
          <div className="flex items-center gap-3 rounded-xl border border-outline-variant/30 bg-surface-container p-3">
            {subscriber.avatar ? (
              <img
                src={subscriber.avatar}
                alt={subscriber.name}
                className="h-10 w-10 rounded-full object-cover ring-2 ring-primary/40"
              />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20 font-bold text-primary text-sm">
                {subscriber.name.charAt(0)}
              </div>
            )}
            <div className="min-w-0 flex-1 text-xs">
              <p className="font-bold text-on-surface truncate">{subscriber.name}</p>
              <p className="text-on-surface-variant truncate">{subscriber.email}</p>
              <p className="font-code-compact text-on-surface-variant">ID: {subscriber.studentId}</p>
            </div>
          </div>

          <div>
            <label className="block font-table-header uppercase text-on-surface-variant text-[11px] mb-1">
              Select Membership Tier *
            </label>
            <select
              value={tier}
              onChange={(e) => setTier(e.target.value as MembershipTierKey)}
              className="w-full rounded-lg border border-outline-variant/40 bg-surface-container px-3.5 py-2 font-body-default text-on-surface focus:border-primary outline-hidden"
            >
              <option value="STANDARD">Standard Alumni (Free)</option>
              <option value="SILVER_LIFETIME">Silver Patron</option>
              <option value="GOLD_PATRON">Gold Executive Patron</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-table-header uppercase text-on-surface-variant text-[11px] mb-1">
                Cadence
              </label>
              <select
                value={billingCycle}
                onChange={(e) => setBillingCycle(e.target.value as "ANNUAL" | "LIFETIME" | "MONTHLY")}
                className="w-full rounded-lg border border-outline-variant/40 bg-surface-container px-3 py-2 text-xs text-on-surface focus:border-primary outline-hidden"
              >
                <option value="ANNUAL">Annual Renewal</option>
                <option value="LIFETIME">Lifetime Patron</option>
                <option value="MONTHLY">Monthly</option>
              </select>
            </div>
            <div>
              <label className="block font-table-header uppercase text-on-surface-variant text-[11px] mb-1">
                Validity Period
              </label>
              <label className="flex items-center gap-2 pt-2 cursor-pointer text-xs font-semibold text-on-surface">
                <input
                  type="checkbox"
                  checked={isNeverExpires || billingCycle === "LIFETIME"}
                  disabled={billingCycle === "LIFETIME"}
                  onChange={(e) => setIsNeverExpires(e.target.checked)}
                  className="rounded border-outline-variant text-primary"
                />
                <span>Never Expires / Permanent</span>
              </label>
            </div>
          </div>

          {!isNeverExpires && billingCycle !== "LIFETIME" && tier !== "STANDARD" && (
            <div>
              <label className="block font-table-header uppercase text-on-surface-variant text-[11px] mb-1">
                Valid Until Date *
              </label>
              <input
                type="date"
                required
                value={validUntil}
                onChange={(e) => setValidUntil(e.target.value)}
                className="w-full rounded-lg border border-outline-variant/40 bg-surface-container px-3 py-2 text-xs text-on-surface focus:border-primary outline-hidden"
              />
            </div>
          )}

          <div>
            <label className="block font-table-header uppercase text-on-surface-variant text-[11px] mb-1">
              Admin Notes / Reason (Optional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Complimentary honorary lifetime membership granted"
              className="w-full rounded-lg border border-outline-variant/40 bg-surface-container px-3.5 py-2 text-xs text-on-surface focus:border-primary outline-hidden"
            />
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-outline-variant/30 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-lg border border-outline-variant/30 px-4 py-2 text-xs font-bold text-on-surface-variant hover:bg-surface-container-high transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2 text-xs font-bold text-on-primary hover:opacity-90 active:scale-95 transition-all disabled:opacity-50"
            >
              {loading && <span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>}
              <span>Apply Membership Tier</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
