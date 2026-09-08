import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getAdminSession } from "@/lib/auth/session";
import { getEffectivePermissions } from "@/lib/auth/permissions";
import ReportsView, {
  type CareerPlacementReport,
  type CohortReport,
  type FinancialReport,
  type IdBureauReport,
} from "@/components/admin/reports/ReportsView";

// `reports` has no dedicated PermissionModule (per the plan's noted schema
// gap) — each tab is gated by the `canExport` capability of the domain
// module it summarizes: cohort -> DIRECTORY, career -> JOBS,
// financial -> FINANCE, idBureau -> ID_CARDS.
export default async function ReportsPage() {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");

  const admin = await db.adminUser.findUnique({
    where: { id: session.sub },
    include: { role: { include: { permissions: true } } },
  });
  if (!admin || admin.status !== "ACTIVE") redirect("/admin/login");

  const permissions = getEffectivePermissions(admin);
  const canCohort = permissions.DIRECTORY?.canExport ?? false;
  const canCareer = permissions.JOBS?.canExport ?? false;
  const canFinancial = permissions.FINANCE?.canExport ?? false;
  const canIdBureau = permissions.ID_CARDS?.canExport ?? false;

  const visibleTabs = [
    canCohort && "cohort",
    canCareer && "career",
    canFinancial && "financial",
    canIdBureau && "idBureau",
  ].filter(Boolean) as ("cohort" | "career" | "financial" | "idBureau")[];

  let cohort: CohortReport | null = null;
  if (canCohort) {
    const [byGradYear, byFaculty, totalAlumni] = await Promise.all([
      db.alumniRecord.groupBy({ by: ["gradYear"], _count: { _all: true }, orderBy: { gradYear: "asc" } }),
      db.alumniRecord.groupBy({ by: ["faculty"], _count: { _all: true } }),
      db.alumniRecord.count(),
    ]);
    cohort = {
      byGradYear: byGradYear.map((r) => ({ gradYear: r.gradYear, count: r._count._all })),
      byFaculty: byFaculty.map((r) => ({ faculty: r.faculty, count: r._count._all })),
      totalAlumni,
    };
  }

  let career: CareerPlacementReport | null = null;
  if (canCareer) {
    const [byStatus, totalApplications, totalSelected] = await Promise.all([
      db.jobApplication.groupBy({ by: ["status"], _count: { _all: true } }),
      db.jobApplication.count(),
      db.jobApplication.count({ where: { status: "SELECTED" } }),
    ]);
    career = {
      byStatus: byStatus.map((r) => ({ status: r.status, count: r._count._all })),
      totalApplications,
      totalSelected,
    };
  }

  let financial: FinancialReport | null = null;
  if (canFinancial) {
    const [byMethod, settled, pending, reconciled] = await Promise.all([
      db.transaction.groupBy({ by: ["method"], _sum: { amount: true } }),
      db.transaction.aggregate({ where: { status: "SETTLED" }, _sum: { amount: true } }),
      db.transaction.aggregate({ where: { status: "PENDING" }, _sum: { amount: true } }),
      db.transaction.aggregate({ where: { status: "RECONCILED" }, _sum: { amount: true } }),
    ]);
    financial = {
      byMethod: byMethod.map((r) => ({ method: r.method, total: Number(r._sum.amount ?? 0) })),
      totalSettled: Number(settled._sum.amount ?? 0),
      totalPending: Number(pending._sum.amount ?? 0),
      totalReconciled: Number(reconciled._sum.amount ?? 0),
    };
  }

  let idBureau: IdBureauReport | null = null;
  if (canIdBureau) {
    const [byStatus, byCourier, totalOrders] = await Promise.all([
      db.idCardOrder.groupBy({ by: ["status"], _count: { _all: true } }),
      db.idCardOrder.groupBy({ by: ["courierType"], _count: { _all: true } }),
      db.idCardOrder.count(),
    ]);
    idBureau = {
      byStatus: byStatus.map((r) => ({ status: r.status, count: r._count._all })),
      byCourier: byCourier.map((r) => ({ courierType: r.courierType, count: r._count._all })),
      totalOrders,
    };
  }

  return (
    <ReportsView visibleTabs={visibleTabs} cohort={cohort} career={career} financial={financial} idBureau={idBureau} />
  );
}
