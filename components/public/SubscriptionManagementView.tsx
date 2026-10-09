"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Crown,
  Sparkles,
  ShieldCheck,
  Check,
  CreditCard,
  Zap,
  Clock,
  ChevronRight,
  AlertCircle,
  Loader2,
  X,
  User,
} from "lucide-react";
import { useApp } from "@/lib/public/context";
import {
  SUBSCRIPTION_TIERS,
  type MembershipTierKey,
  type SubscriptionTierPlan,
} from "@/lib/subscription-pricing";

interface InitialUserData {
  id: string;
  email: string;
  studentId: string;
  membershipTier: string;
  membershipValidUntil: string | null;
  subscriptionBillingCycle: string;
  subscriptionAutoRenew: boolean;
  profileName: string;
}

interface SubscriptionHistoryRecord {
  id: string;
  tier: string;
  billingCycle: string;
  amountPaid: number;
  currency: string;
  status: string;
  paymentMethod: string;
  paymentReference: string | null;
  createdAt: string;
}

export default function SubscriptionManagementView({
  initialUser,
  initialHistory,
}: {
  initialUser: InitialUserData;
  initialHistory: SubscriptionHistoryRecord[];
}) {
  const { setSession, refreshSession, setIsProfileModalOpen } = useApp();

  const [currentTier, setCurrentTier] = useState<MembershipTierKey>(
    (initialUser.membershipTier as MembershipTierKey) || "STANDARD"
  );
  const [validUntil, setValidUntil] = useState<string | null>(initialUser.membershipValidUntil);
  const [billingCycle, setBillingCycle] = useState<"ANNUAL" | "LIFETIME">("ANNUAL");
  const [autoRenew, setAutoRenew] = useState<boolean>(initialUser.subscriptionAutoRenew);
  const [history, setHistory] = useState<SubscriptionHistoryRecord[]>(initialHistory);
  const [tiers, setTiers] = useState<Record<MembershipTierKey, SubscriptionTierPlan>>(SUBSCRIPTION_TIERS);

  const [selectedUpgradePlan, setSelectedUpgradePlan] = useState<SubscriptionTierPlan | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"CARD" | "STRIPE" | "SIMULATED">("CARD");
  const [upgradeLoading, setUpgradeLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  React.useEffect(() => {
    fetch("/api/subscription")
      .then((res) => res.json())
      .then((json) => {
        if (json.data?.availableTiers) {
          setTiers(json.data.availableTiers);
        }
      })
      .catch(() => {});
  }, []);

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
      setErrorMsg("Failed to update auto-renewal preference.");
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
      setSuccessMsg(`Congratulations! Your account is now elevated to ${selectedUpgradePlan.name}!`);

      setSession((prev) =>
        prev
          ? {
              ...prev,
              membershipTier: selectedUpgradePlan.id,
            }
          : null
      );
      await refreshSession();

      // Refresh history records
      const refRes = await fetch("/api/subscription");
      const refJson = await refRes.json();
      if (refJson.data?.history) setHistory(refJson.data.history);
      if (refJson.data?.membershipValidUntil) setValidUntil(refJson.data.membershipValidUntil);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Error processing membership update.");
    } finally {
      setUpgradeLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Link href="/" className="hover:text-emerald-400 transition-colors">Home</Link>
            <ChevronRight className="h-3.5 w-3.5 text-slate-600" />
            <span className="font-bold text-white">Membership Subscription</span>
          </div>
          <h1 className="mt-1 text-2xl font-black text-white sm:text-3xl">Manage Alumni Subscription</h1>
          <p className="mt-1 text-xs text-slate-400">
            Support the University of Sierra Leone endowment, unlock VIP executive perks, and elevate your alumni status.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/profile"
            className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2 text-xs font-bold text-slate-200 hover:bg-slate-700 transition-colors"
          >
            <User className="h-3.5 w-3.5 text-emerald-400" />
            <span>Manage Profile &amp; Photo</span>
          </Link>
          <Link
            href="/pass"
            className="flex items-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-950/60 px-3.5 py-2 text-xs font-bold text-emerald-300 hover:bg-emerald-900/60 transition-colors"
          >
            <span>View Digital Pass</span>
          </Link>
        </div>
      </div>

      {/* Feedback Messages */}
      {successMsg && (
        <div className="flex items-center gap-2.5 rounded-xl border border-emerald-500/40 bg-emerald-950/70 p-4 text-xs font-semibold text-emerald-300 shadow-md">
          <Check className="h-4 w-4 shrink-0 text-emerald-400" />
          <span>{successMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div className="flex items-center gap-2.5 rounded-xl border border-rose-500/40 bg-rose-950/70 p-4 text-xs font-semibold text-rose-300 shadow-md">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Active Membership Status Banner */}
      <div className="rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6 shadow-2xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
          <div className="space-y-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Active Member Credential
            </span>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-black text-white">
                {SUBSCRIPTION_TIERS[currentTier]?.name || currentTier}
              </h2>
              <span className="rounded-full border border-emerald-500/30 bg-emerald-950 px-3 py-0.5 text-xs font-bold text-emerald-300 flex items-center gap-1">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                Active Standing
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Member: <span className="font-semibold text-slate-300">{initialUser.profileName}</span> • Member ID:{" "}
              <span className="font-mono text-emerald-400">{initialUser.studentId}</span>
            </p>
            <p className="text-xs text-slate-400">
              {validUntil
                ? `Valid through ${new Date(validUntil).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}`
                : "Permanent Lifetime Patron Privileges (Never expires)"}
            </p>
          </div>

          {currentTier !== "STANDARD" && (
            <div className="flex items-center gap-3 bg-slate-900 p-3 rounded-xl border border-slate-800">
              <div className="text-right">
                <span className="text-xs font-bold text-white block">Automatic Renewal</span>
                <span className="text-[11px] text-slate-400">
                  {autoRenew ? "Enabled (Billed annually)" : "Disabled (Expires at term)"}
                </span>
              </div>
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
            </div>
          )}
        </div>
      </div>

      {/* Cadence Toggle */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900/80 p-4 rounded-2xl border border-slate-800">
        <div>
          <h3 className="text-xs font-bold text-white">Select Patronage Billing Cadence</h3>
          <p className="text-[11px] text-slate-400">Choose between yearly support or one-time lifetime endowment patronage.</p>
        </div>
        <div className="flex items-center gap-1 rounded-xl bg-slate-950 p-1 border border-slate-800">
          <button
            type="button"
            onClick={() => setBillingCycle("ANNUAL")}
            className={`rounded-lg px-4 py-2 text-xs font-bold transition-all ${
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
            className={`rounded-lg px-4 py-2 text-xs font-bold transition-all ${
              billingCycle === "LIFETIME"
                ? "bg-amber-400 text-slate-950 shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Lifetime Patron (One-Time)
          </button>
        </div>
      </div>

      {/* Tier Plans Grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {(Object.keys(tiers) as MembershipTierKey[]).map((tierKey) => {
          const plan = tiers[tierKey] || SUBSCRIPTION_TIERS[tierKey];
          const isCurrent = currentTier === tierKey;
          const price = billingCycle === "LIFETIME" ? plan.lifetimePrice : plan.annualPrice;

          return (
            <div
              key={tierKey}
              className={`relative flex flex-col justify-between rounded-2xl border p-6 transition-all ${
                isCurrent
                  ? "border-emerald-500/80 bg-slate-900/90 ring-2 ring-emerald-500/30"
                  : plan.popular
                  ? "border-amber-500/60 bg-slate-900/90 shadow-2xl"
                  : "border-slate-800 bg-slate-900/50 hover:border-slate-700"
              }`}
            >
              {plan.popular && (
                <span className="absolute -top-3.5 right-6 rounded-full bg-gradient-to-r from-amber-500 to-yellow-400 px-3 py-0.5 text-[10px] font-black uppercase tracking-wider text-slate-950 shadow-lg">
                  {plan.badge || "Executive Choice"}
                </span>
              )}

              <div className="space-y-5">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    {plan.badge}
                  </span>
                  <h3 className="text-xl font-black text-white mt-1">{plan.name}</h3>
                  <p className="text-xs text-slate-400 mt-1 leading-snug">{plan.description}</p>
                </div>

                <div className="border-t border-b border-slate-800 py-4">
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-black text-white">
                      {plan.isFree ? "Free" : `$${price}`}
                    </span>
                    {!plan.isFree && (
                      <span className="text-xs font-semibold text-slate-400">
                        /{billingCycle === "LIFETIME" ? "lifetime" : "year"}
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] font-medium text-emerald-400 block mt-1">
                    {plan.tagline}
                  </span>
                </div>

                {/* Features */}
                <ul className="space-y-2.5 text-xs">
                  {plan.features.map((feat) => (
                    <li key={feat} className="flex items-start gap-2.5 text-slate-300">
                      <Check className="h-4 w-4 shrink-0 text-emerald-400 mt-0.5" />
                      <span className="text-xs leading-relaxed">{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-8">
                {isCurrent ? (
                  <button
                    disabled
                    className="w-full rounded-xl border border-emerald-500/40 bg-emerald-950/60 py-3 text-xs font-black text-emerald-300 cursor-default"
                  >
                    ✓ Your Current Plan
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setSelectedUpgradePlan(plan)}
                    className={`w-full rounded-xl py-3 text-xs font-black transition-all shadow-lg active:scale-95 ${
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

      {/* Confirmation Drawer / Modal */}
      {selectedUpgradePlan && (
        <div className="rounded-2xl border border-amber-500/40 bg-slate-900 p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2.5">
              <Sparkles className="h-5 w-5 text-amber-400" />
              <h3 className="text-sm font-black text-white">
                Confirm Subscription Activation: {selectedUpgradePlan.name}
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setSelectedUpgradePlan(null)}
              className="text-slate-400 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="space-y-2 bg-slate-950 p-4 rounded-xl border border-slate-800">
              <p className="text-slate-400 font-bold uppercase text-[10px]">Tier &amp; Amount:</p>
              <p className="text-base font-black text-white">{selectedUpgradePlan.name}</p>
              <p className="text-slate-300">
                Total Due:{" "}
                <span className="font-black text-amber-400 text-sm">
                  ${billingCycle === "LIFETIME" ? selectedUpgradePlan.lifetimePrice : selectedUpgradePlan.annualPrice} USD
                </span>{" "}
                ({billingCycle === "LIFETIME" ? "Lifetime Endowment" : "Annual Renewal"})
              </p>
            </div>

            <div className="space-y-2 bg-slate-950 p-4 rounded-xl border border-slate-800">
              <p className="text-slate-400 font-bold uppercase text-[10px]">Payment Method:</p>
              <div className="space-y-2">
                <label className="flex items-center gap-2.5 cursor-pointer text-slate-200">
                  <input
                    type="radio"
                    name="method"
                    checked={paymentMethod === "CARD"}
                    onChange={() => setPaymentMethod("CARD")}
                    className="text-emerald-500"
                  />
                  <CreditCard className="h-4 w-4 text-emerald-400" />
                  <span>Card Instant Activation (Simulated / Live)</span>
                </label>
                <label className="flex items-center gap-2.5 cursor-pointer text-slate-200">
                  <input
                    type="radio"
                    name="method"
                    checked={paymentMethod === "STRIPE"}
                    onChange={() => setPaymentMethod("STRIPE")}
                    className="text-emerald-500"
                  />
                  <Zap className="h-4 w-4 text-amber-400" />
                  <span>Stripe Global Gateway</span>
                </label>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setSelectedUpgradePlan(null)}
              className="rounded-xl border border-slate-700 px-4 py-2.5 text-xs font-bold text-slate-300 hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirmUpgrade}
              disabled={upgradeLoading}
              className="flex items-center gap-2 rounded-xl bg-amber-400 px-6 py-2.5 text-xs font-black text-slate-950 shadow-md hover:bg-amber-300 active:scale-95 disabled:opacity-50"
            >
              {upgradeLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              <span>Activate Membership Tier</span>
            </button>
          </div>
        </div>
      )}

      {/* History Log */}
      {history.length > 0 && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 space-y-4 shadow-xl">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <span>Membership Transaction Roster</span>
          </h3>
          <div className="divide-y divide-slate-800 rounded-xl border border-slate-800 overflow-hidden text-xs">
            {history.map((item) => (
              <div key={item.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-950/60 transition-colors">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-sm">
                      {SUBSCRIPTION_TIERS[item.tier as MembershipTierKey]?.name || item.tier}
                    </span>
                    <span className="rounded bg-emerald-950 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                      {item.status}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Reference: {item.paymentReference || item.id} • {item.billingCycle} • Method: {item.paymentMethod}
                  </p>
                </div>
                <div className="text-left sm:text-right">
                  <p className="font-black text-white text-sm">${item.amountPaid.toFixed(2)} {item.currency}</p>
                  <p className="text-[11px] text-slate-500">
                    {new Date(item.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
