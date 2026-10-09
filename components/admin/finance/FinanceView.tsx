"use client";

import { useState } from "react";
import { useTransactions } from "@/hooks/admin/useTransactions";
import { useAdminSession } from "@/lib/admin/context";
import EditTierModal, { type TierConfigData } from "./EditTierModal";
import GrantTierModal, { type SubscriberRow } from "./GrantTierModal";

export interface TransactionRow {
  id: string;
  refId: string;
  method: string;
  amount: string;
  currency: string;
  tier: string;
  status: string;
  date: string;
  alumniName: string;
}

const STATUS_STYLES: Record<string, string> = {
  SETTLED: "bg-secondary/15 text-secondary border border-secondary/30",
  PENDING: "bg-tertiary/15 text-tertiary border border-tertiary/30",
  RECONCILED: "bg-primary/15 text-primary border border-primary/30",
};

const TIER_BADGE_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  STANDARD: { bg: "bg-slate-500/10", text: "text-slate-400", border: "border-slate-500/30" },
  SILVER_LIFETIME: { bg: "bg-blue-500/10", text: "text-blue-400", border: "border-blue-500/30" },
  GOLD_PATRON: { bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/30" },
};

export default function FinanceView({
  transactions: initialTransactions,
  initialPlans,
  initialSubscribers,
}: {
  transactions: TransactionRow[];
  initialPlans: TierConfigData[];
  initialSubscribers: SubscriberRow[];
}) {
  const { can } = useAdminSession();
  const { reconcile, loading: reconcileLoading } = useTransactions();
  const canWrite = can("FINANCE", "canWrite");
  const canApprove = can("FINANCE", "canApprove");

  // Tab State
  const [activeTab, setActiveTab] = useState<"tiers" | "subscribers" | "transactions">("tiers");

  // Plans State
  const [plans, setPlans] = useState<TierConfigData[]>(initialPlans);
  const [editingPlan, setEditingPlan] = useState<TierConfigData | null>(null);

  // Subscribers State
  const [subscribers, setSubscribers] = useState<SubscriberRow[]>(initialSubscribers);
  const [selectedSubscriberForGrant, setSelectedSubscriberForGrant] = useState<SubscriberRow | null>(null);
  const [subscriberSearch, setSubscriberSearch] = useState("");
  const [subscriberTierFilter, setSubscriberTierFilter] = useState("ALL");
  const [subscribersLoading, setSubscribersLoading] = useState(false);

  // Transactions State
  const [transactions] = useState<TransactionRow[]>(initialTransactions);
  const [statusFilter, setStatusFilter] = useState("ALL");

  async function reloadSubscribers() {
    setSubscribersLoading(true);
    try {
      const res = await fetch(`/api/admin/subscriptions?q=${encodeURIComponent(subscriberSearch)}&tier=${subscriberTierFilter}`);
      const json = await res.json();
      if (json.data?.subscribers) {
        setSubscribers(json.data.subscribers);
      }
    } catch {
      // ignore
    } finally {
      setSubscribersLoading(false);
    }
  }

  const filteredSubscribers = subscribers.filter((s) => {
    if (subscriberTierFilter !== "ALL" && s.tier !== subscriberTierFilter) return false;
    if (subscriberSearch.trim()) {
      const q = subscriberSearch.toLowerCase();
      return (
        s.name.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q) ||
        s.studentId.toLowerCase().includes(q) ||
        s.company.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const filteredTransactions = transactions.filter(
    (t) => statusFilter === "ALL" || t.status === statusFilter
  );
  const totalSettled = transactions
    .filter((t) => t.status !== "PENDING")
    .reduce((sum, t) => sum + Number(t.amount), 0);
  const pendingCount = transactions.filter((t) => t.status === "PENDING").length;
  const reconciledCount = transactions.filter((t) => t.status === "RECONCILED").length;

  return (
    <div className="space-y-6">
      {/* Header and Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-headline-lg text-on-surface">Subscriptions &amp; Finance Management</h1>
          <p className="font-body-default text-on-surface-variant mt-1">
            Dynamic alumni patronage plans, member subscribers, pricing rules, and transactions
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if (activeTab === "subscribers") reloadSubscribers();
              else window.location.reload();
            }}
            className="flex items-center gap-1.5 rounded-lg border border-outline-variant/30 bg-surface-container px-3.5 py-2 font-body-compact text-on-surface hover:bg-surface-container-high transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]">refresh</span>
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3.5">
        <div className="bg-surface-container-lowest p-4 rounded-2xl border border-outline-variant/30 shadow-xs">
          <div className="w-9 h-9 rounded-lg bg-primary/15 flex items-center justify-center text-primary mb-2">
            <span className="material-symbols-outlined text-[20px]">layers</span>
          </div>
          <div className="font-display-metric text-primary">{plans.filter((p) => p.isActive).length}</div>
          <p className="font-body-compact text-on-surface-variant mt-1">Active Dynamic Tiers</p>
        </div>
        <div className="bg-surface-container-lowest p-4 rounded-2xl border border-outline-variant/30 shadow-xs">
          <div className="w-9 h-9 rounded-lg bg-secondary/15 flex items-center justify-center text-secondary mb-2">
            <span className="material-symbols-outlined text-[20px]">military_tech</span>
          </div>
          <div className="font-display-metric text-secondary">
            {subscribers.filter((s) => s.tier !== "STANDARD").length}
          </div>
          <p className="font-body-compact text-on-surface-variant mt-1">Paying Patrons (Silver/Gold)</p>
        </div>
        <div className="bg-surface-container-lowest p-4 rounded-2xl border border-outline-variant/30 shadow-xs">
          <div className="w-9 h-9 rounded-lg bg-tertiary/15 flex items-center justify-center text-tertiary mb-2">
            <span className="material-symbols-outlined text-[20px]">group</span>
          </div>
          <div className="font-display-metric text-tertiary">{subscribers.length}</div>
          <p className="font-body-compact text-on-surface-variant mt-1">Total Alumni Subscribers</p>
        </div>
        <div className="bg-surface-container-lowest p-4 rounded-2xl border border-outline-variant/30 shadow-xs">
          <div className="w-9 h-9 rounded-lg bg-secondary/15 flex items-center justify-center text-secondary mb-2">
            <span className="material-symbols-outlined text-[20px]">payments</span>
          </div>
          <div className="font-display-metric text-secondary">${totalSettled.toLocaleString()}</div>
          <p className="font-body-compact text-on-surface-variant mt-1">Settled &amp; Reconciled</p>
        </div>
      </div>

      {/* Tabs navigation */}
      <div className="flex items-center gap-2 border-b border-outline-variant/30 pb-px">
        <button
          onClick={() => setActiveTab("tiers")}
          className={`flex items-center gap-2 px-4 py-2.5 font-headline-sm text-xs rounded-t-xl transition-all border-b-2 ${
            activeTab === "tiers"
              ? "border-primary text-primary bg-surface-container-low"
              : "border-transparent text-on-surface-variant hover:text-on-surface"
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">tune</span>
          <span>Subscription Plans &amp; Pricing</span>
          <span className="ml-1 rounded-full bg-primary/20 text-primary px-2 py-0.5 text-[10px] font-bold">
            {plans.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("subscribers")}
          className={`flex items-center gap-2 px-4 py-2.5 font-headline-sm text-xs rounded-t-xl transition-all border-b-2 ${
            activeTab === "subscribers"
              ? "border-primary text-primary bg-surface-container-low"
              : "border-transparent text-on-surface-variant hover:text-on-surface"
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">badge</span>
          <span>Alumni Subscribers</span>
          <span className="ml-1 rounded-full bg-secondary/20 text-secondary px-2 py-0.5 text-[10px] font-bold">
            {subscribers.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("transactions")}
          className={`flex items-center gap-2 px-4 py-2.5 font-headline-sm text-xs rounded-t-xl transition-all border-b-2 ${
            activeTab === "transactions"
              ? "border-primary text-primary bg-surface-container-low"
              : "border-transparent text-on-surface-variant hover:text-on-surface"
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">receipt_long</span>
          <span>Transactions &amp; Settlement</span>
          <span className="ml-1 rounded-full bg-surface-container-highest text-on-surface-variant px-2 py-0.5 text-[10px] font-bold">
            {transactions.length}
          </span>
        </button>
      </div>

      {/* TAB 1: DYNAMIC SUBSCRIPTION TIERS & PRICING */}
      {activeTab === "tiers" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-headline-sm text-on-surface">Dynamic Patronage Tiers</h2>
              <p className="font-body-compact text-on-surface-variant">
                Configure prices, promotional badges, and perks shown on the alumni subscription portal in real time.
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs text-secondary font-semibold">
              <span className="w-2 h-2 rounded-full bg-secondary"></span>
              <span>Syncs instantly to public alumni modal</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {plans.map((p) => {
              const perksList = Array.isArray(p.perks) ? p.perks : [];
              const isGold = p.tier === "GOLD_PATRON";
              const isSilver = p.tier === "SILVER_LIFETIME";

              return (
                <div
                  key={p.id || p.tier}
                  className={`relative flex flex-col justify-between rounded-2xl border p-5 transition-all shadow-md ${
                    isGold
                      ? "border-amber-500/50 bg-gradient-to-b from-amber-950/20 via-surface-container-low to-surface-container"
                      : isSilver
                      ? "border-blue-500/40 bg-gradient-to-b from-blue-950/20 via-surface-container-low to-surface-container"
                      : "border-outline-variant/40 bg-surface-container-low"
                  }`}
                >
                  {p.badgeText && (
                    <div className="absolute -top-3 right-4 rounded-full bg-amber-500 px-3 py-0.5 text-[10px] font-black tracking-wider uppercase text-slate-950 shadow-md">
                      {p.badgeText}
                    </div>
                  )}

                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
                        {p.tier.replace(/_/g, " ")}
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          p.isActive
                            ? "bg-secondary/15 text-secondary border border-secondary/30"
                            : "bg-surface-container-high text-on-surface-variant"
                        }`}
                      >
                        {p.isActive ? "Active on Portal" : "Disabled"}
                      </span>
                    </div>

                    <h3 className="mt-2 font-headline-md text-on-surface text-xl">{p.name}</h3>
                    <p className="mt-1 font-body-compact text-xs text-on-surface-variant line-clamp-2">
                      {p.description}
                    </p>

                    {/* Pricing Display */}
                    <div className="mt-4 rounded-xl border border-outline-variant/30 bg-surface-container-lowest/80 p-3">
                      {p.isFree ? (
                        <div className="flex items-baseline gap-1">
                          <span className="font-display-metric text-2xl text-on-surface">Free</span>
                          <span className="text-xs text-on-surface-variant">($0 / Included)</span>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <div className="flex items-baseline gap-1">
                            <span className="font-display-metric text-2xl text-secondary">${p.annualPrice}</span>
                            <span className="text-xs text-on-surface-variant">/ year</span>
                          </div>
                          <div className="flex items-center justify-between text-[11px] font-code-compact text-on-surface-variant pt-1 border-t border-outline-variant/20">
                            <span>Lifetime: ${p.lifetimePrice}</span>
                            <span>Monthly: ${p.monthlyPrice}/mo</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Perks List */}
                    <div className="mt-4 space-y-1.5">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant block">
                        Included Privileges ({perksList.length})
                      </span>
                      <ul className="space-y-1 text-xs text-on-surface">
                        {perksList.slice(0, 5).map((perk, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="material-symbols-outlined text-[15px] text-secondary flex-shrink-0 mt-0.5">
                              check_circle
                            </span>
                            <span className="leading-tight line-clamp-2">{perk}</span>
                          </li>
                        ))}
                        {perksList.length > 5 && (
                          <li className="text-[11px] font-semibold text-secondary pl-6">
                            + {perksList.length - 5} more privileges
                          </li>
                        )}
                      </ul>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-6 pt-4 border-t border-outline-variant/30 flex items-center justify-between">
                    <span className="text-[11px] font-body-compact text-on-surface-variant">
                      Order: #{p.sortOrder}
                    </span>
                    {canWrite && (
                      <button
                        onClick={() => setEditingPlan(p)}
                        className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-on-primary hover:opacity-90 active:scale-95 transition-all shadow-xs"
                      >
                        <span className="material-symbols-outlined text-[15px]">edit</span>
                        <span>Edit Plan &amp; Pricing</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: ALUMNI SUBSCRIBERS */}
      {activeTab === "subscribers" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="font-headline-sm text-on-surface">Alumni Membership Subscribers</h2>
              <p className="font-body-compact text-on-surface-variant">
                Search, inspect, and grant membership tiers to verified alumni members.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Search alumni by name, email, ID..."
                value={subscriberSearch}
                onChange={(e) => setSubscriberSearch(e.target.value)}
                className="w-64 rounded-lg bg-surface-container-low border border-outline-variant/30 px-3 py-2 text-xs text-on-surface outline-hidden focus:border-primary"
              />
              <select
                value={subscriberTierFilter}
                onChange={(e) => setSubscriberTierFilter(e.target.value)}
                className="rounded-lg bg-surface-container-low border border-outline-variant/30 px-3 py-2 text-xs text-on-surface outline-hidden"
              >
                <option value="ALL">All Tiers</option>
                <option value="STANDARD">Standard Alumni</option>
                <option value="SILVER_LIFETIME">Silver Patron</option>
                <option value="GOLD_PATRON">Gold Executive Patron</option>
              </select>
            </div>
          </div>

          <div className="rounded-xl border border-outline-variant/20 bg-surface-container overflow-hidden overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="font-table-header uppercase text-on-surface-variant text-[11px] border-b border-outline-variant/20 bg-surface-container-lowest/40">
                  <th className="px-4 py-3">Alumni Member</th>
                  <th className="px-4 py-3">Student ID</th>
                  <th className="px-4 py-3">Membership Tier</th>
                  <th className="px-4 py-3">Cadence</th>
                  <th className="px-4 py-3">Validity</th>
                  <th className="px-4 py-3">Latest Paid</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/10 text-xs">
                {filteredSubscribers.map((s) => {
                  const badgeStyle = TIER_BADGE_STYLES[s.tier] || TIER_BADGE_STYLES.STANDARD;
                  const isExpired = s.validUntil && new Date(s.validUntil) < new Date();

                  return (
                    <tr key={s.userId} className="hover:bg-surface-container-high/50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          {s.avatar ? (
                            <img
                              src={s.avatar}
                              alt={s.name}
                              className="h-8 w-8 rounded-full object-cover ring-1 ring-primary/40"
                            />
                          ) : (
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-primary">
                              {s.name.charAt(0)}
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="font-bold text-on-surface truncate">{s.name}</p>
                            <p className="text-on-surface-variant text-[11px] truncate">{s.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-code-compact text-on-surface">{s.studentId}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold text-[11px] border ${badgeStyle.bg} ${badgeStyle.text} ${badgeStyle.border}`}
                        >
                          <span className="material-symbols-outlined text-[13px]">military_tech</span>
                          <span>{s.tier.replace(/_/g, " ")}</span>
                        </span>
                      </td>
                      <td className="px-4 py-3 font-body-compact text-on-surface-variant">
                        {s.billingCycle}
                      </td>
                      <td className="px-4 py-3 font-body-compact">
                        {s.tier === "STANDARD" || !s.validUntil ? (
                          <span className="text-secondary font-semibold">Permanent / Lifetime</span>
                        ) : (
                          <span className={isExpired ? "text-rose-400 font-bold" : "text-on-surface"}>
                            {new Date(s.validUntil).toLocaleDateString()}
                            {isExpired && " (Expired)"}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 font-code-compact font-bold text-secondary">
                        {s.latestAmountPaid > 0 ? `$${s.latestAmountPaid}` : "Free / Comp"}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {canWrite && (
                          <button
                            onClick={() => setSelectedSubscriberForGrant(s)}
                            className="inline-flex items-center gap-1 rounded-md border border-outline-variant/40 bg-surface-container-high px-2.5 py-1 text-[11px] font-bold text-on-surface hover:bg-surface-container-highest transition-colors"
                          >
                            <span className="material-symbols-outlined text-[13px]">tune</span>
                            <span>Change Tier</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}

                {filteredSubscribers.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-on-surface-variant font-body-default">
                      No alumni members match your search or filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: TRANSACTIONS & SETTLEMENT */}
      {activeTab === "transactions" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-headline-sm text-on-surface">Payment Transactions &amp; Audit</h2>
              <p className="font-body-compact text-on-surface-variant">
                Reconciliation ledger for subscription fees, physical card orders, and endowments.
              </p>
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-lg bg-surface-container-low border border-outline-variant/30 px-3 py-2 text-xs text-on-surface outline-hidden"
            >
              <option value="ALL">All statuses</option>
              <option value="SETTLED">Settled</option>
              <option value="PENDING">Pending</option>
              <option value="RECONCILED">Reconciled</option>
            </select>
          </div>

          <div className="rounded-xl border border-outline-variant/20 bg-surface-container overflow-hidden overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="font-table-header uppercase text-on-surface-variant text-[11px] border-b border-outline-variant/20 bg-surface-container-lowest/40">
                  <th className="px-4 py-3">Reference</th>
                  <th className="px-4 py-3">Alumni</th>
                  <th className="px-4 py-3">Method</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/10 text-xs">
                {filteredTransactions.map((t) => (
                  <tr key={t.id} className="hover:bg-surface-container-high/50 transition-colors">
                    <td className="px-4 py-3 font-body-medium text-on-surface">{t.refId}</td>
                    <td className="px-4 py-3 font-body-default text-on-surface-variant">{t.alumniName}</td>
                    <td className="px-4 py-3 font-body-default text-on-surface-variant">{t.method}</td>
                    <td className="px-4 py-3 font-code-compact font-bold text-secondary">
                      {t.amount} {t.currency}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full font-body-compact ${STATUS_STYLES[t.status] ?? ""}`}>
                        {t.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {canApprove && t.status !== "RECONCILED" && (
                        <button
                          type="button"
                          disabled={reconcileLoading}
                          onClick={() => reconcile(t.id)}
                          className="font-body-compact text-primary hover:underline disabled:opacity-50"
                        >
                          Reconcile
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {filteredTransactions.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center font-body-default text-on-surface-variant">
                      No transactions recorded.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Edit Tier Plan Modal */}
      {editingPlan && (
        <EditTierModal
          plan={editingPlan}
          onClose={() => setEditingPlan(null)}
          onSuccess={(updated) => {
            setPlans((prev) => prev.map((p) => (p.tier === updated.tier ? updated : p)));
          }}
        />
      )}

      {/* Grant Tier Modal */}
      {selectedSubscriberForGrant && (
        <GrantTierModal
          subscriber={selectedSubscriberForGrant}
          onClose={() => setSelectedSubscriberForGrant(null)}
          onSuccess={() => {
            reloadSubscribers();
          }}
        />
      )}
    </div>
  );
}
