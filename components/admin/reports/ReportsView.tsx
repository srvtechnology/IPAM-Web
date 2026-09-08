"use client";

import { useState } from "react";

export interface CohortReport {
  byGradYear: { gradYear: number; count: number }[];
  byFaculty: { faculty: string; count: number }[];
  totalAlumni: number;
}

export interface CareerPlacementReport {
  byStatus: { status: string; count: number }[];
  totalApplications: number;
  totalSelected: number;
}

export interface FinancialReport {
  byMethod: { method: string; total: number }[];
  totalSettled: number;
  totalPending: number;
  totalReconciled: number;
}

export interface IdBureauReport {
  byStatus: { status: string; count: number }[];
  byCourier: { courierType: string; count: number }[];
  totalOrders: number;
}

type TabKey = "cohort" | "career" | "financial" | "idBureau";

const TABS: { key: TabKey; label: string; icon: string }[] = [
  { key: "cohort", label: "Cohort Demographics", icon: "groups" },
  { key: "career", label: "Career Placement", icon: "work" },
  { key: "financial", label: "Financial Revenue", icon: "payments" },
  { key: "idBureau", label: "ID Bureau Logistics", icon: "local_shipping" },
];

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-outline-variant/20 bg-surface-container p-4">
      <p className="font-table-header uppercase text-on-surface-variant">{label}</p>
      <p className="font-headline-lg text-on-surface mt-1">{value}</p>
    </div>
  );
}

function BreakdownTable({ rows }: { rows: { label: string; value: number }[] }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <div className="rounded-xl border border-outline-variant/20 bg-surface-container p-4 space-y-2">
      {rows.map((r) => (
        <div key={r.label} className="flex items-center gap-3">
          <span className="w-40 truncate font-body-default text-on-surface-variant">{r.label}</span>
          <div className="flex-1 h-2 rounded-full bg-surface-container-high overflow-hidden">
            <div className="h-full bg-primary" style={{ width: `${(r.value / max) * 100}%` }} />
          </div>
          <span className="w-10 text-right font-body-medium text-on-surface">{r.value}</span>
        </div>
      ))}
      {rows.length === 0 && <p className="font-body-default text-on-surface-variant">No data yet.</p>}
    </div>
  );
}

export default function ReportsView({
  visibleTabs,
  cohort,
  career,
  financial,
  idBureau,
}: {
  visibleTabs: TabKey[];
  cohort: CohortReport | null;
  career: CareerPlacementReport | null;
  financial: FinancialReport | null;
  idBureau: IdBureauReport | null;
}) {
  const [tab, setTab] = useState<TabKey>(visibleTabs[0] ?? "cohort");
  const tabs = TABS.filter((t) => visibleTabs.includes(t.key));

  return (
    <div className="space-y-4">
      <h1 className="font-headline-lg text-on-surface">Reports &amp; Analytics</h1>

      <div className="flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-2 font-body-medium transition-colors ${
              tab === t.key
                ? "bg-primary-container text-on-primary-container"
                : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">{t.icon}</span>
            {t.label}
          </button>
        ))}
        {tabs.length === 0 && (
          <p className="font-body-default text-on-surface-variant">
            You don&apos;t have export access to any report tab yet.
          </p>
        )}
      </div>

      {tab === "cohort" && cohort && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <StatCard label="Total Alumni" value={cohort.totalAlumni} />
            <StatCard label="Faculties Represented" value={cohort.byFaculty.length} />
            <StatCard label="Graduation Cohorts" value={cohort.byGradYear.length} />
          </div>
          <BreakdownTable rows={cohort.byGradYear.map((r) => ({ label: String(r.gradYear), value: r.count }))} />
          <BreakdownTable rows={cohort.byFaculty.map((r) => ({ label: r.faculty, value: r.count }))} />
        </div>
      )}

      {tab === "career" && career && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <StatCard label="Total Applications" value={career.totalApplications} />
            <StatCard label="Selected / Placed" value={career.totalSelected} />
            <StatCard
              label="Selection Rate"
              value={career.totalApplications > 0 ? `${Math.round((career.totalSelected / career.totalApplications) * 100)}%` : "0%"}
            />
          </div>
          <BreakdownTable rows={career.byStatus.map((r) => ({ label: r.status.replaceAll("_", " "), value: r.count }))} />
        </div>
      )}

      {tab === "financial" && financial && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <StatCard label="Settled" value={`$${financial.totalSettled.toLocaleString()}`} />
            <StatCard label="Pending" value={`$${financial.totalPending.toLocaleString()}`} />
            <StatCard label="Reconciled" value={`$${financial.totalReconciled.toLocaleString()}`} />
          </div>
          <BreakdownTable rows={financial.byMethod.map((r) => ({ label: r.method, value: r.total }))} />
        </div>
      )}

      {tab === "idBureau" && idBureau && (
        <div className="space-y-4">
          <StatCard label="Total ID Card Orders" value={idBureau.totalOrders} />
          <BreakdownTable rows={idBureau.byStatus.map((r) => ({ label: r.status.replaceAll("_", " "), value: r.count }))} />
          <BreakdownTable rows={idBureau.byCourier.map((r) => ({ label: r.courierType.replaceAll("_", " "), value: r.count }))} />
        </div>
      )}
    </div>
  );
}
