"use client";

import { useState } from "react";
import { useTransactions } from "@/hooks/admin/useTransactions";
import { useAdminSession } from "@/lib/admin/context";

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
  SETTLED: "bg-secondary-container text-on-secondary-container",
  PENDING: "bg-tertiary-container text-on-tertiary-container",
  RECONCILED: "bg-primary-container text-on-primary-container",
};

export default function FinanceView({ transactions }: { transactions: TransactionRow[] }) {
  const { can } = useAdminSession();
  const { reconcile, loading } = useTransactions();
  const [statusFilter, setStatusFilter] = useState("ALL");
  const canApprove = can("FINANCE", "canApprove");

  const filtered = transactions.filter((t) => statusFilter === "ALL" || t.status === statusFilter);
  const totalSettled = transactions
    .filter((t) => t.status !== "PENDING")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-headline-lg text-on-surface">Subscriptions &amp; Finance</h1>
        <p className="font-body-default text-on-surface-variant mt-1">
          {transactions.length} transactions &middot; ${totalSettled.toLocaleString()} settled/reconciled
        </p>
      </div>

      <select
        value={statusFilter}
        onChange={(e) => setStatusFilter(e.target.value)}
        className="rounded-lg bg-surface-container-low border border-outline-variant/30 px-3 py-2 font-body-default text-on-surface outline-none"
      >
        <option value="ALL">All statuses</option>
        <option value="SETTLED">Settled</option>
        <option value="PENDING">Pending</option>
        <option value="RECONCILED">Reconciled</option>
      </select>

      <div className="rounded-xl border border-outline-variant/20 bg-surface-container overflow-hidden overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="font-table-header uppercase text-on-surface-variant border-b border-outline-variant/20">
              <th className="px-4 py-3">Reference</th>
              <th className="px-4 py-3">Alumni</th>
              <th className="px-4 py-3">Method</th>
              <th className="px-4 py-3">Amount</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {filtered.map((t) => (
              <tr key={t.id} className="border-b border-outline-variant/10 last:border-0 hover:bg-surface-container-high/50">
                <td className="px-4 py-3 font-body-medium text-on-surface">{t.refId}</td>
                <td className="px-4 py-3 font-body-default text-on-surface-variant">{t.alumniName}</td>
                <td className="px-4 py-3 font-body-default text-on-surface-variant">{t.method}</td>
                <td className="px-4 py-3 font-body-default text-on-surface">
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
                      disabled={loading}
                      onClick={() => reconcile(t.id)}
                      className="font-body-compact text-primary hover:underline disabled:opacity-50"
                    >
                      Reconcile
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center font-body-default text-on-surface-variant">
                  No transactions.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
