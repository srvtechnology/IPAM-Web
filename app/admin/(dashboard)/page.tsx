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

  const kpis = [
    { label: "Total Alumni Records", value: totalAlumni, icon: "groups" },
    { label: "Pending Verifications", value: pendingVerifications, icon: "pending_actions" },
    { label: "Active Job Listings", value: activeJobs, icon: "work_history" },
    { label: "Upcoming Events", value: upcomingEvents, icon: "event" },
    { label: "ID Cards In Pipeline", value: idCardsInProgress, icon: "badge" },
    {
      label: "Transactions Settled",
      value: transactionSnapshot?._count ?? 0,
      icon: "account_balance_wallet",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-headline-lg text-on-surface">Executive Overview</h1>
        <p className="font-body-default text-on-surface-variant mt-1">
          Real-time snapshot of the IPAM Alumni platform.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {kpis.map((kpi) => (
          <div
            key={kpi.label}
            className="rounded-xl bg-surface-container p-4 border border-outline-variant/20"
          >
            <div className="flex items-center justify-between">
              <span className="material-symbols-outlined text-primary text-[22px]">{kpi.icon}</span>
            </div>
            <p className="font-display-metric text-on-surface mt-3">{kpi.value}</p>
            <p className="font-body-compact text-on-surface-variant mt-1">{kpi.label}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl bg-surface-container border border-outline-variant/20">
        <div className="px-4 py-3 border-b border-outline-variant/20 flex items-center justify-between">
          <h2 className="font-headline-sm text-on-surface">Recent Audit Activity</h2>
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
              <div className="min-w-0">
                <p className="font-body-medium text-on-surface truncate">{log.actionLabel}</p>
                <p className="font-body-compact text-on-surface-variant truncate">
                  {log.actorName} &middot; {log.target}
                </p>
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
