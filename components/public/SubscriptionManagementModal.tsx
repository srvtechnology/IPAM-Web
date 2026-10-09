"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Sparkles,
  ShieldCheck,
  Check,
  Crown,
  CreditCard,
  Calendar,
  Zap,
  ArrowRight,
  Loader2,
  Clock,
  AlertCircle,
  HelpCircle,
  RefreshCw,
} from "lucide-react";
import { useApp } from "@/lib/public/context";
import {
  SUBSCRIPTION_TIERS,
  type MembershipTierKey,
  type SubscriptionTierPlan,
} from "@/lib/subscription-pricing";

interface SubscriptionHistoryItem {
  id: string;
  tier: string;
  billingCycle: string;
  amountPaid: number;
  currency: string;
  status: string;
  paymentMethod: string;
  paymentReference: string | null;
  startDate: string;
  validUntil: string | null;
  createdAt: string;
}

export default function SubscriptionManagementModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const { session, setSession, refreshSession } = useApp();

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [currentTier, setCurrentTier] = useState<MembershipTierKey>(
    (session?.membershipTier as MembershipTierKey) || "STANDARD"
  );
  const [validUntil, setValidUntil] = useState<string | null>(null);
  const [billingCycle, setBillingCycle] = useState<"ANNUAL" | "LIFETIME">("ANNUAL");
  const [autoRenew, setAutoRenew] = useState<boolean>(true);
  const [history, setHistory] = useState<SubscriptionHistoryItem[]>([]);
  const [tiers, setTiers] = useState<Record<MembershipTierKey, SubscriptionTierPlan>>(SUBSCRIPTION_TIERS);

  // Upgrade Selection Modal State
  const [selectedUpgradePlan, setSelectedUpgradePlan] = useState<SubscriptionTierPlan | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"CARD" | "STRIPE" | "SIMULATED">("CARD");
  const [upgradeLoading, setUpgradeLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    let isMounted = true;
    setFetching(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    fetch("/api/subscription")
      .then((res) => res.json())
      .then((json) => {
        if (!isMounted) return;
        if (json.data) {
          if (json.data.availableTiers) setTiers(json.data.availableTiers);
          setCurrentTier(json.data.currentTier);
          setValidUntil(json.data.membershipValidUntil);
          setAutoRenew(json.data.autoRenew ?? true);
          if (json.data.history) setHistory(json.data.history);
        }
      })
      .catch(() => {
        if (isMounted) setErrorMsg("Failed to load subscription details.");
      })
      .finally(() => {
        if (isMounted) setFetching(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  async function handleToggleAutoRenew() {
    try {
      const newVal = !autoRenew;
      setAutoRenew(newVal);
      const res = await fetch("/api/subscription", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ autoRenew: newVal }),
      });
      if (res.ok) {
        setSuccessMsg(`Auto-renewal has been ${newVal ? "enabled" : "disabled"}.`);
        setTimeout(() => setSuccessMsg(null), 3000);
      }
    } catch {
      setErrorMsg("Failed to toggle auto-renewal.");
    }
  }

  async function handleConfirmUpgrade() {
    if (!selectedUpgradePlan) return;
    setUpgradeLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await fetch("/api/subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tier: selectedUpgradePlan.id,
          billingCycle,
          paymentMethod,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Upgrade failed");

      setCurrentTier(selectedUpgradePlan.id);
      setSelectedUpgradePlan(null);
      setSuccessMsg(`Congratulations! Your account is now upgraded to ${selectedUpgradePlan.name}!`);

      // Update global context session
      setSession((prev) =>
        prev
          ? {
              ...prev,
              membershipTier: selectedUpgradePlan.id,
            }
          : null
      );
      await refreshSession();

      // Refresh history
      const refRes = await fetch("/api/subscription");
      const refJson = await refRes.json();
      if (refJson.data?.history) setHistory(refJson.data.history);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Subscription update failed.");
    } finally {
      setUpgradeLoading(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/70 p-4 backdrop-blur-xs">
      <div className="relative w-full max-w-4xl overflow-hidden rounded-2xl border border-slate-700 bg-slate-900 text-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950/80 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 ring-1 ring-amber-500/20">
              <Crown className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-white">Manage Membership &amp; Subscription</h2>
              <p className="text-xs text-slate-400">Upgrade your alumni patronage tier, unlock executive perks, and manage billing.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {fetching ? (
          <div className="flex h-72 flex-col items-center justify-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-amber-400" />
            <p className="text-xs font-semibold text-slate-400">Loading subscription records...</p>
          </div>
        ) : (
          <div className="max-h-[80vh] overflow-y-auto p-6 space-y-6">
            {/* Feedback Alerts */}
            {successMsg && (
              <div className="flex items-center gap-2.5 rounded-xl border border-emerald-500/30 bg-emerald-950/60 p-3.5 text-xs font-semibold text-emerald-300">
                <Check className="h-4 w-4 shrink-0 text-emerald-400" />
                <span>{successMsg}</span>
              </div>
            )}
            {errorMsg && (
              <div className="flex items-center gap-2.5 rounded-xl border border-rose-500/30 bg-rose-950/60 p-3.5 text-xs font-semibold text-rose-300">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Current Active Plan Banner */}
            <div className="rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-5 shadow-lg">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Current Active Membership</span>
                  <div className="flex items-center gap-2.5">
                    <h3 className="text-xl font-black text-white">
                      {SUBSCRIPTION_TIERS[currentTier]?.name || currentTier}
                    </h3>
                    <span className="rounded-full border border-emerald-500/30 bg-emerald-950 px-2.5 py-0.5 text-xs font-bold text-emerald-300 flex items-center gap-1">
                      <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                      Active
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    {validUntil
                      ? `Valid until ${new Date(validUntil).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}`
                      : "Permanent Lifetime Patronage Privileges (Never expires)"}
                  </p>
                </div>

                {currentTier !== "STANDARD" && (
                  <div className="flex items-center gap-3 bg-slate-800/80 p-2.5 rounded-xl border border-slate-700">
                    <span className="text-xs font-bold text-slate-300">Auto-Renewal:</span>
                    <button
                      type="button"
                      onClick={handleToggleAutoRenew}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        autoRenew ? "bg-emerald-500" : "bg-slate-700"
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          autoRenew ? "translate-x-6" : "translate-x-1"
                        }`}
                      />
                    </button>
                    <span className="text-xs font-semibold text-slate-400">
                      {autoRenew ? "On" : "Off"}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Billing Cycle Selector */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
              <div className="text-center sm:text-left">
                <h4 className="text-xs font-bold text-white">Select Patronage Billing Cadence</h4>
                <p className="text-[11px] text-slate-400">Choose between flexible annual renewal or one-time lifetime endowment.</p>
              </div>
              <div className="flex items-center gap-1 rounded-xl bg-slate-800/80 p-1 border border-slate-700">
                <button
                  type="button"
                  onClick={() => setBillingCycle("ANNUAL")}
                  className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                    billingCycle === "ANNUAL"
                      ? "bg-emerald-500 text-slate-950 shadow-sm"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  Annual Billing
                </button>
                <button
                  type="button"
                  onClick={() => setBillingCycle("LIFETIME")}
                  className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                    billingCycle === "LIFETIME"
                      ? "bg-amber-400 text-slate-950 shadow-sm"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  Lifetime Patron (One-Time)
                </button>
              </div>
            </div>

            {/* 3-Tier Comparison Cards */}
            <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
              {(Object.keys(tiers) as MembershipTierKey[]).map((tierKey) => {
                const plan = tiers[tierKey] || SUBSCRIPTION_TIERS[tierKey];
                const isCurrent = currentTier === tierKey;
                const price =
                  billingCycle === "LIFETIME"
                    ? plan.lifetimePrice
                    : plan.annualPrice;

                return (
                  <div
                    key={tierKey}
                    className={`relative flex flex-col justify-between rounded-2xl border p-5 transition-all ${
                      isCurrent
                        ? "border-emerald-500/80 bg-slate-950 ring-2 ring-emerald-500/30"
                        : plan.popular
                        ? "border-amber-500/60 bg-slate-950/90 shadow-xl"
                        : "border-slate-800 bg-slate-950/40 hover:border-slate-700"
                    }`}
                  >
                    {plan.popular && (
                      <span className="absolute -top-3 right-4 rounded-full bg-gradient-to-r from-amber-500 to-yellow-400 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-slate-950 shadow-md">
                        {plan.badge || "Executive Choice"}
                      </span>
                    )}

                    <div className="space-y-4">
                      <div>
                        <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
                          {plan.badge}
                        </span>
                        <h4 className="text-lg font-black text-white mt-0.5">{plan.name}</h4>
                        <p className="text-[11px] text-slate-400 mt-1 leading-snug">{plan.description}</p>
                      </div>

                      <div className="border-t border-b border-slate-800/80 py-3">
                        <div className="flex items-baseline gap-1">
                          <span className="text-2xl font-black text-white">
                            {plan.isFree ? "Free" : `$${price}`}
                          </span>
                          {!plan.isFree && (
                            <span className="text-xs font-semibold text-slate-400">
                              /{billingCycle === "LIFETIME" ? "lifetime" : "year"}
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] font-medium text-emerald-400 block mt-0.5">
                          {plan.tagline}
                        </span>
                      </div>

                      {/* Feature Perks */}
                      <ul className="space-y-2 text-xs">
                        {plan.features.map((feat) => (
                          <li key={feat} className="flex items-start gap-2 text-slate-300">
                            <Check className="h-3.5 w-3.5 shrink-0 text-emerald-400 mt-0.5" />
                            <span className="text-[11px] leading-tight">{feat}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="pt-6">
                      {isCurrent ? (
                        <button
                          disabled
                          className="w-full rounded-xl border border-emerald-500/40 bg-emerald-950/60 py-2.5 text-xs font-extrabold text-emerald-300 cursor-default"
                        >
                          ✓ Current Tier
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setSelectedUpgradePlan(plan)}
                          className={`w-full rounded-xl py-2.5 text-xs font-extrabold transition-all shadow-md active:scale-95 ${
                            plan.popular
                              ? "bg-amber-400 text-slate-950 hover:bg-amber-300"
                              : "bg-emerald-500 text-slate-950 hover:bg-emerald-400"
                          }`}
                        >
                          <span>Upgrade to {plan.name}</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Upgrade Confirmation Drawer / Modal */}
            {selectedUpgradePlan && (
              <div className="rounded-2xl border border-amber-500/40 bg-slate-950 p-5 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-amber-400" />
                    <h4 className="text-sm font-black text-white">
                      Confirm Upgrade: {selectedUpgradePlan.name}
                    </h4>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedUpgradePlan(null)}
                    className="text-slate-400 hover:text-white"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="space-y-1.5 bg-slate-900 p-3.5 rounded-xl border border-slate-800">
                    <p className="text-slate-400 font-bold">Selected Plan &amp; Billing:</p>
                    <p className="text-sm font-black text-white">{selectedUpgradePlan.name}</p>
                    <p className="text-slate-300">
                      Amount:{" "}
                      <span className="font-bold text-amber-400">
                        ${billingCycle === "LIFETIME" ? selectedUpgradePlan.lifetimePrice : selectedUpgradePlan.annualPrice} USD
                      </span>{" "}
                      ({billingCycle === "LIFETIME" ? "Lifetime One-Time" : "Billed Annually"})
                    </p>
                  </div>

                  <div className="space-y-2 bg-slate-900 p-3.5 rounded-xl border border-slate-800">
                    <p className="text-slate-400 font-bold">Payment Method:</p>
                    <div className="space-y-1.5">
                      <label className="flex items-center gap-2 cursor-pointer text-slate-200">
                        <input
                          type="radio"
                          name="payment"
                          checked={paymentMethod === "CARD"}
                          onChange={() => setPaymentMethod("CARD")}
                          className="text-emerald-500"
                        />
                        <CreditCard className="h-3.5 w-3.5 text-emerald-400" />
                        <span>Credit / Debit Card (Instant Activation)</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer text-slate-200">
                        <input
                          type="radio"
                          name="payment"
                          checked={paymentMethod === "STRIPE"}
                          onChange={() => setPaymentMethod("STRIPE")}
                          className="text-emerald-500"
                        />
                        <Zap className="h-3.5 w-3.5 text-amber-400" />
                        <span>Stripe Global Gateway</span>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setSelectedUpgradePlan(null)}
                    className="rounded-xl border border-slate-700 px-4 py-2 text-xs font-bold text-slate-300 hover:bg-slate-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmUpgrade}
                    disabled={upgradeLoading}
                    className="flex items-center gap-2 rounded-xl bg-amber-400 px-5 py-2 text-xs font-black text-slate-950 shadow-md hover:bg-amber-300 active:scale-95 disabled:opacity-50"
                  >
                    {upgradeLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                    <span>Confirm &amp; Activate Membership</span>
                  </button>
                </div>
              </div>
            )}

            {/* Subscription History Roster */}
            {history.length > 0 && (
              <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5 space-y-3">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                  <Clock className="h-3.5 w-3.5" />
                  <span>Membership Subscription Transaction Log</span>
                </h4>
                <div className="divide-y divide-slate-800/80 rounded-xl border border-slate-800 overflow-hidden text-xs">
                  {history.map((item) => (
                    <div key={item.id} className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-slate-900/60 transition-colors">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white">{SUBSCRIPTION_TIERS[item.tier as MembershipTierKey]?.name || item.tier}</span>
                          <span className="rounded bg-emerald-950 border border-emerald-500/30 px-1.5 py-0.2 text-[10px] font-bold text-emerald-400">
                            {item.status}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400">
                          Ref: {item.paymentReference || item.id} • {item.billingCycle} • Method: {item.paymentMethod}
                        </p>
                      </div>
                      <div className="text-left sm:text-right">
                        <p className="font-extrabold text-white">${item.amountPaid.toFixed(2)} {item.currency}</p>
                        <p className="text-[10px] text-slate-500">
                          {new Date(item.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
