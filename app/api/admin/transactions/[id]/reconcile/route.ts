import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth/permissions";
import { writeAuditLog, requestMeta } from "@/lib/audit";
import { ok, fail } from "@/lib/api-response";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const gate = await requirePermission(req, "FINANCE", "canApprove");
  if (gate instanceof NextResponse) return gate;
  const { admin } = gate;
  const roleName = (await db.adminRoleDefinition.findUnique({ where: { id: admin.roleId }, select: { name: true } }))?.name ?? "Admin";

  const { id } = await params;
  const existing = await db.transaction.findUnique({ where: { id } });
  if (!existing) return fail(404, "Transaction not found");

  const transaction = await db.transaction.update({ where: { id }, data: { status: "RECONCILED" } });

  const { ipAddress, location, deviceInfo } = requestMeta(req);
  await writeAuditLog({
    actorAdminId: admin.id,
    actorName: admin.name,
    actorEmail: admin.email,
    actorRole: roleName,
    action: "TRANSACTION_RECONCILED",
    actionLabel: "Finance Transaction Reconciled",
    category: "COMMERCIAL_FINANCE",
    target: `Transaction: ${transaction.refId}`,
    targetType: "Transaction",
    status: "SUCCESS",
    severity: "NOTICE",
    ipAddress,
    location,
    deviceInfo,
    details: `Transaction ${transaction.refId} (${transaction.amount} ${transaction.currency}) reconciled.`,
    beforeState: { status: existing.status },
    afterState: { status: "RECONCILED" },
  });

  return ok(transaction);
}
