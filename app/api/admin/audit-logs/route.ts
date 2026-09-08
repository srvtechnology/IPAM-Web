import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth/permissions";
import { ok } from "@/lib/api-response";
import type { AuditCategory, AuditSeverity, AuditStatus, Prisma } from "@prisma/client";

export async function GET(req: NextRequest) {
  const gate = await requirePermission(req, "AUDIT_TRAILS", "canRead");
  if (gate instanceof NextResponse) return gate;

  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");
  const severity = searchParams.get("severity");
  const status = searchParams.get("status");
  const actorAdminId = searchParams.get("actorAdminId");
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const where: Prisma.AuditLogEntryWhereInput = {};
  if (category) where.category = category as AuditCategory;
  if (severity) where.severity = severity as AuditSeverity;
  if (status) where.status = status as AuditStatus;
  if (actorAdminId) where.actorAdminId = actorAdminId;
  if (from || to) {
    where.timestamp = {
      ...(from ? { gte: new Date(from) } : {}),
      ...(to ? { lte: new Date(to) } : {}),
    };
  }

  const logs = await db.auditLogEntry.findMany({
    where,
    orderBy: { timestamp: "desc" },
    take: 500,
  });

  return ok(logs);
}
