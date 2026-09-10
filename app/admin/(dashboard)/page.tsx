import Link from "next/link";
import { db } from "@/lib/db";

export default async function AdminOverviewPage() {
  const [
    totalAlumni,
    pendingVerifications,
    activeJobs,
    upcomingEvents,
    idCardsInProgress,
    recentAuditLogs,
    transactionSnapshot,
  ] = await Promise.all([
    db.alumniRecord.count(),
    db.alumniRecord.count({ where: { status: "PENDING" } }),
    db.adminJobListing.count({ where: { status: "ACTIVE" } }).catch(() => 0),
    db.alumniEvent.count({ where: { date: { gte: new Date() } } }),
    db.idCardOrder.count({
      where: { status: { in: ["IN_PRINT_PRESS", "QUALITY_CHECK", "READY_COURIER"] } },
    }),
    db.auditLogEntry.findMany({ orderBy: { timestamp: "desc" }, take: 6 }),
    db.transaction.aggregate({ _sum: { amount: true }, _count: true }).catch(() => null),
  ]);

  // Alternating icon-chip accent per card, matching the original design's
  // color-coded KPI cards (primary/secondary/tertiary/error containers)
  // instead of one flat color repeated on every card.
  const kpis = [
    { label: "Total Alumni Records", value: totalAlumni, icon: "groups", accent: "primary" as const },
    { label: "Pending Verifications", value: pendingVerifications, icon: "pending_actions", accent: "tertiary" as const },
    { label: "Active Job Listings", value: activeJobs, icon: "work_history", accent: "secondary" as const },
    { label: "Upcoming Events", value: upcomingEvents, icon: "event", accent: "primary" as const },
    { label: "ID Cards In Pipeline", value: idCardsInProgress, icon: "badge", accent: "tertiary" as const },
    {
      label: "Transactions Settled",
      value: transactionSnapshot?._count ?? 0,
      icon: "account_balance_wallet",
      accent: "secondary" as const,
    },
  ];

  const accentChipClass: Record<string, string> = {
    primary: "bg-primary-container/20 text-primary",
    secondary: "bg-secondary-container/20 text-secondary",
    tertiary: "bg-tertiary/20 text-tertiary",
  };

  const auditStatusDot: Record<string, string> = {
    SUCCESS: "bg-secondary",
    FLAGGED: "bg-error",
    WARNING: "bg-tertiary",
    "BLOCKED (RBAC Violation)": "bg-error",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 flex-wrap">
        <h1 className="font-headline-lg text-on-surface">Executive Overview</h1>
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-secondary/10 text-secondary font-label-badge font-semibold">
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75"></span>
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-secondary"></span>
          </span>
          LIVE
        </span>
      </div>
      <p className="font-body-default text-on-surface-variant -mt-4">
        Real-time snapshot of the IPAM Alumni platform.
      </p>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {kpis.map((kpi) => (
          <div
            key={kpi.label}
            className="rounded-xl bg-surface-container p-4 border border-outline-variant/20 hover:bg-surface-container-high/60 transition-colors group"
          >
            <div className="flex items-center justify-between">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform ${accentChipClass[kpi.accent]}`}
              >
                <span className="material-symbols-outlined text-[22px]">{kpi.icon}</span>
              </div>
            </div>
            <p className="font-display-metric text-on-surface mt-3">{kpi.value}</p>
            <p className="font-body-compact text-on-surface-variant mt-1">{kpi.label}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl bg-surface-container border border-outline-variant/20">
        <div className="px-4 py-3 border-b border-outline-variant/20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[20px]">history_edu</span>
            <h2 className="font-headline-sm text-on-surface">Recent Audit Activity</h2>
          </div>
          <Link href="/admin/audit-trails" className="font-body-compact text-primary hover:underline">
            View all
          </Link>
        </div>
        <div className="divide-y divide-outline-variant/10">
          {recentAuditLogs.length === 0 && (
            <p className="px-4 py-6 font-body-default text-on-surface-variant">No audit activity yet.</p>
          )}
          {recentAuditLogs.map((log) => (
            <div key={log.id} className="px-4 py-3 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <span
                  className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${auditStatusDot[log.status] ?? "bg-outline"}`}
                />
                <div className="min-w-0">
                  <p className="font-body-medium text-on-surface truncate">{log.actionLabel}</p>
                  <p className="font-body-compact text-on-surface-variant truncate">
                    {log.actorName} &middot; {log.target}
                  </p>
                </div>
              </div>
              <span className="font-code-compact text-on-surface-variant flex-shrink-0">
                {log.timestamp.toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
