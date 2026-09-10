import { db } from "@/lib/db";
import { checkPagePermission } from "@/lib/auth/permissions";
import AccessDenied from "@/components/admin/AccessDenied";
import AuditTrailsView from "@/components/admin/audit/AuditTrailsView";

export default async function AuditTrailsPage() {
  const gate = await checkPagePermission("AUDIT_TRAILS", "canRead");
  if (!gate.allowed) return <AccessDenied module="Audit Trails & Security" />;

  const entries = await db.auditLogEntry.findMany({
    orderBy: { timestamp: "desc" },
    take: 500,
  });

  return (
    // Audit trail view
    <AuditTrailsView
      entries={entries.map((e) => ({
        id: e.id,
        displayId: e.displayId,
        timestamp: e.timestamp.toISOString(),
        actorName: e.actorName,
        actorEmail: e.actorEmail,
        actorRole: e.actorRole,
        action: e.action,
        actionLabel: e.actionLabel,
        category: e.category,
        target: e.target,
        targetType: e.targetType,
        status: e.status,
        severity: e.severity,
        ipAddress: e.ipAddress,
        location: e.location,
        deviceInfo: e.deviceInfo,
        details: e.details,
        beforeState: e.beforeState,
        afterState: e.afterState,
        tamperHash: e.tamperHash,
      }))}
    />
  );
}
