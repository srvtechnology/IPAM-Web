"use client";

import { useState } from "react";
import DonationDetailModal from "../finance/DonationDetailModal";
import type { DonationRecordRow } from "../finance/FinanceView";

interface AdminGivingDeskViewProps {
  initialDonations: DonationRecordRow[];
}

export default function AdminGivingDeskView({ initialDonations }: AdminGivingDeskViewProps) {
  const [donations, setDonations] = useState<DonationRecordRow[]>(initialDonations);
  const [selectedDonation, setSelectedDonation] = useState<DonationRecordRow | null>(null);
  const [search, setSearch] = useState("");
  const [fundFilter, setFundFilter] = useState("ALL");
  const [methodFilter, setMethodFilter] = useState("ALL");
  const [donorTypeFilter, setDonorTypeFilter] = useState<"ALL" | "GUEST" | "ALUMNI">("ALL");
  const [loading, setLoading] = useState(false);

  async function reloadDonations() {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/admin/donations?q=${encodeURIComponent(search)}&fund=${fundFilter}&method=${methodFilter}&donorType=${donorTypeFilter}`
      );
      const json = await res.json();
      if (json.data?.donations) {
        setDonations(json.data.donations);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  function exportCSV() {
    const headers = [
      "Receipt Reference",
      "Date",
      "Donor Name",
      "Email",
      "Phone Number",
      "Affiliation/Class",
      "Donor Type",
      "Fund Designation",
      "Amount",
      "Currency",
      "Schedule",
      "Payment Method",
      "Dedication",
      "Status",
      "Transaction Ref",
    ];

    const rows = filteredDonations.map((d) => [
      `"${d.paymentRef}"`,
      `"${new Date(d.createdAt).toISOString()}"`,
      `"${d.donorName.replace(/"/g, '""')}"`,
      `"${d.donorEmail.replace(/"/g, '""')}"`,
      `"${(d.donorPhone || "").replace(/"/g, '""')}"`,
      `"${(d.donorClass || "").replace(/"/g, '""')}"`,
      d.isGuest ? '"Guest"' : '"Registered Alumni"',
      `"${d.fund.replace(/"/g, '""')}"`,
      d.amount,
      `"${d.currency}"`,
      `"${d.frequency}"`,
      `"${d.paymentMethod}"`,
      `"${(d.dedicationName || "").replace(/"/g, '""')}"`,
      `"${d.status}"`,
      `"${d.transactionRef || ""}"`,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `IPAM_Giving_Records_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  const filteredDonations = donations.filter((d) => {
    if (fundFilter !== "ALL" && d.fund !== fundFilter) return false;
    if (methodFilter !== "ALL" && d.paymentMethod !== methodFilter) return false;
    if (donorTypeFilter === "GUEST" && !d.isGuest) return false;
    if (donorTypeFilter === "ALUMNI" && d.isGuest) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        d.donorName.toLowerCase().includes(q) ||
        d.donorEmail.toLowerCase().includes(q) ||
        (d.donorPhone && d.donorPhone.toLowerCase().includes(q)) ||
        d.paymentRef.toLowerCase().includes(q) ||
        (d.dedicationName && d.dedicationName.toLowerCase().includes(q)) ||
        d.fund.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const totalUSD = donations
    .filter((d) => d.currency === "USD")
    .reduce((sum, d) => sum + Number(d.amount), 0);
  const totalSLE = donations
    .filter((d) => d.currency === "SLE")
    .reduce((sum, d) => sum + Number(d.amount), 0);
  const guestCount = donations.filter((d) => d.isGuest).length;
  const alumniCount = donations.filter((d) => !d.isGuest).length;
  const avgGiftUSD = donations.length > 0 ? Math.round(totalUSD / donations.length) : 0;

  return (
    <div className="space-y-6">
      {/* Header and Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="font-headline-lg text-on-surface">Donations &amp; Giving Desk</h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 font-label-badge font-semibold text-xs border border-emerald-500/20">
              <span className="material-symbols-outlined text-[14px]">volunteer_activism</span>
              <span>Official Institutional Registry</span>
            </span>
          </div>
          <p className="font-body-default text-on-surface-variant mt-1">
            Real-time ledger of institutional and guest contributions, contact phone numbers, and designated endowments.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={exportCSV}
            className="flex items-center gap-1.5 rounded-lg border border-outline-variant/30 bg-surface-container px-3.5 py-2 font-body-compact text-xs font-bold text-on-surface hover:bg-surface-container-high transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]">file_download</span>
            <span>Export Audit CSV</span>
          </button>
          <button
            type="button"
            onClick={reloadDonations}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-lg border border-outline-variant/30 bg-surface-container px-3.5 py-2 font-body-compact text-xs text-on-surface hover:bg-surface-container-high transition-colors disabled:opacity-50"
          >
            <span className={`material-symbols-outlined text-[16px] ${loading ? "animate-spin" : ""}`}>
              refresh
            </span>
            <span>Sync</span>
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
        <div className="bg-surface-container-lowest p-4 rounded-2xl border border-outline-variant/30 shadow-xs">
          <div className="w-9 h-9 rounded-lg bg-emerald-500/15 flex items-center justify-center text-emerald-600 mb-2">
            <span className="material-symbols-outlined text-[20px]">payments</span>
          </div>
          <div className="font-display-metric text-emerald-600">${totalUSD.toLocaleString()}</div>
          <p className="font-body-compact text-on-surface-variant mt-1">Total Contributed (USD)</p>
        </div>

        <div className="bg-surface-container-lowest p-4 rounded-2xl border border-outline-variant/30 shadow-xs">
          <div className="w-9 h-9 rounded-lg bg-primary/15 flex items-center justify-center text-primary mb-2">
            <span className="material-symbols-outlined text-[20px]">volunteer_activism</span>
          </div>
          <div className="font-display-metric text-primary">{donations.length}</div>
          <p className="font-body-compact text-on-surface-variant mt-1">Total Gifts Recorded</p>
        </div>

        <div className="bg-surface-container-lowest p-4 rounded-2xl border border-outline-variant/30 shadow-xs">
          <div className="w-9 h-9 rounded-lg bg-secondary/15 flex items-center justify-center text-secondary mb-2">
            <span className="material-symbols-outlined text-[20px]">person_off</span>
          </div>
          <div className="font-display-metric text-secondary">{guestCount}</div>
          <p className="font-body-compact text-on-surface-variant mt-1">Guest Donors (No Login)</p>
        </div>

        <div className="bg-surface-container-lowest p-4 rounded-2xl border border-outline-variant/30 shadow-xs">
          <div className="w-9 h-9 rounded-lg bg-tertiary/15 flex items-center justify-center text-tertiary mb-2">
            <span className="material-symbols-outlined text-[20px]">school</span>
          </div>
          <div className="font-display-metric text-tertiary">{alumniCount}</div>
          <p className="font-body-compact text-on-surface-variant mt-1">Alumni Contributors</p>
        </div>

        <div className="bg-surface-container-lowest p-4 rounded-2xl border border-outline-variant/30 shadow-xs">
          <div className="w-9 h-9 rounded-lg bg-secondary/15 flex items-center justify-center text-secondary mb-2">
            <span className="material-symbols-outlined text-[20px]">trending_up</span>
          </div>
          <div className="font-display-metric text-secondary">${avgGiftUSD.toLocaleString()}</div>
          <p className="font-body-compact text-on-surface-variant mt-1">Average Gift Size</p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-3">
        <div className="relative flex-1">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">
            search
          </span>
          <input
            type="text"
            placeholder="Search by donor name, email, phone (+232...), reference, or dedication..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-outline-variant/40 bg-surface-container-low pl-9 pr-4 py-2 text-xs font-medium text-on-surface placeholder:text-on-surface-variant focus:outline-primary"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={donorTypeFilter}
            onChange={(e) => setDonorTypeFilter(e.target.value as "ALL" | "GUEST" | "ALUMNI")}
            className="rounded-xl border border-outline-variant/40 bg-surface-container-low px-3 py-2 text-xs font-semibold text-on-surface focus:outline-primary"
          >
            <option value="ALL">All Donors (Guests &amp; Alumni)</option>
            <option value="GUEST">Guest Donors Only (Unauthenticated)</option>
            <option value="ALUMNI">Registered Alumni Only</option>
          </select>

          <select
            value={fundFilter}
            onChange={(e) => setFundFilter(e.target.value)}
            className="rounded-xl border border-outline-variant/40 bg-surface-container-low px-3 py-2 text-xs font-semibold text-on-surface focus:outline-primary"
          >
            <option value="ALL">All Designation Funds</option>
            <option value="Undergraduate & Merit Scholarship Endowment">Scholarship Endowment</option>
            <option value="Campus AI, Computing & Innovation Labs">Campus AI &amp; Tech Labs</option>
            <option value="Student Emergency Hardship Relief">Emergency Hardship Relief</option>
            <option value="Faculty Excellence & Academic Research">Faculty &amp; Research</option>
          </select>

          <select
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
            className="rounded-xl border border-outline-variant/40 bg-surface-container-low px-3 py-2 text-xs font-semibold text-on-surface focus:outline-primary"
          >
            <option value="ALL">All Payment Methods</option>
            <option value="CARD">Credit / Debit Card</option>
            <option value="MOMO">Orange / AfriMoney (MOMO)</option>
            <option value="BANK">Bank Wire (SWIFT)</option>
            <option value="PAYPAL">PayPal / Digital</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface-container-low text-on-surface-variant font-table-header uppercase tracking-wider text-[11px] border-b border-outline-variant/30">
              <tr>
                <th className="px-4 py-3">Receipt / Ref</th>
                <th className="px-4 py-3">Donor Name &amp; Contact</th>
                <th className="px-4 py-3">Phone Number</th>
                <th className="px-4 py-3">Affiliation / Class</th>
                <th className="px-4 py-3">Designation Fund</th>
                <th className="px-4 py-3">Amount &amp; Schedule</th>
                <th className="px-4 py-3">Method</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/20 font-body-compact">
              {filteredDonations.map((d) => {
                const symbol = d.currency === "SLE" ? "NLe " : d.currency === "GBP" ? "£" : d.currency === "EUR" ? "€" : "$";
                return (
                  <tr key={d.id} className="hover:bg-surface-container-low/50 transition-colors">
                    <td className="px-4 py-3 font-mono">
                      <div className="font-bold text-on-surface text-xs">{d.paymentRef}</div>
                      <div className="text-[10px] text-on-surface-variant font-sans mt-0.5">
                        {new Date(d.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-on-surface">{d.donorName}</span>
                        {d.isGuest ? (
                          <span className="rounded bg-slate-500/10 text-slate-400 px-1.5 py-0.2 text-[9px] font-bold border border-slate-500/20">
                            Guest
                          </span>
                        ) : (
                          <span className="rounded bg-primary/10 text-primary px-1.5 py-0.2 text-[9px] font-bold border border-primary/20">
                            Alumni
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-on-surface-variant truncate max-w-[180px]">
                        {d.donorEmail}
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      {d.donorPhone ? (
                        <a
                          href={`tel:${d.donorPhone}`}
                          className="inline-flex items-center gap-1 font-bold text-on-surface hover:text-primary"
                        >
                          <span className="material-symbols-outlined text-[14px] text-emerald-600">call</span>
                          <span>{d.donorPhone}</span>
                        </a>
                      ) : (
                        <span className="text-on-surface-variant italic text-[11px]">None</span>
                      )}
                    </td>

                    <td className="px-4 py-3 font-medium text-on-surface">
                      {d.donorClass || (d.user?.classYear ? `Class of ${d.user.classYear}` : "Supporter")}
                    </td>

                    <td className="px-4 py-3">
                      <span className="font-medium text-on-surface truncate block max-w-[200px]" title={d.fund}>
                        {d.fund}
                      </span>
                      {d.isDedication && d.dedicationName && (
                        <span className="inline-flex items-center gap-0.5 text-[10px] text-amber-500 font-medium">
                          <span className="material-symbols-outlined text-[11px]">favorite</span>
                          <span className="truncate max-w-[150px]">Honor: {d.dedicationName}</span>
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-3">
                      <div className="font-extrabold text-emerald-600 text-xs">
                        {symbol}{d.amount.toLocaleString()} {d.currency}
                      </div>
                      <div className="text-[10px] text-on-surface-variant">
                        {d.frequency === "MONTHLY" ? "Monthly" : "One-Time"}
                      </div>
                    </td>

                    <td className="px-4 py-3 font-semibold text-on-surface text-[11px]">
                      {d.paymentMethod}
                    </td>

                    <td className="px-4 py-3">
                      <span className="rounded-full bg-emerald-500/15 text-emerald-600 px-2 py-0.5 text-[10px] font-bold border border-emerald-500/30">
                        {d.status}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => setSelectedDonation(d)}
                        className="inline-flex items-center gap-1 rounded-lg border border-outline-variant/30 bg-surface-container px-2.5 py-1 text-xs font-bold text-primary hover:bg-surface-container-high transition-colors"
                      >
                        <span className="material-symbols-outlined text-[14px]">visibility</span>
                        <span>Record</span>
                      </button>
                    </td>
                  </tr>
                );
              })}

              {filteredDonations.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-on-surface-variant">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <span className="material-symbols-outlined text-[32px] text-on-surface-variant/60">
                        volunteer_activism
                      </span>
                      <span className="font-bold text-xs">No donation records found</span>
                      <span className="text-[11px] text-on-surface-variant/80">
                        Donations made on the public giving portal will be instantly recorded here.
                      </span>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Donation Detail Modal */}
      {selectedDonation && (
        <DonationDetailModal
          donation={selectedDonation}
          onClose={() => setSelectedDonation(null)}
        />
      )}
    </div>
  );
}
