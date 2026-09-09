import { NextResponse, type NextRequest } from "next/server";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth/permissions";
import { tamperHash } from "@/lib/audit";
import { ok, fail } from "@/lib/api-response";

/**
 * Recomputes the HMAC over the entry's stored substantive fields (timestamp,
 * actorEmail, action, target, status, severity, details, beforeState,
 * afterState) and compares it to the stored tamperHash. Never exposes
 * AUDIT_HMAC_SECRET to the client — the recompute happens entirely here.
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const gate = await requirePermission(req, "AUDIT_TRAILS", "canRead");
  if (gate instanceof NextResponse) return gate;

  const { id } = await params;
  const entry = await db.auditLogEntry.findUnique({ where: { id } });
  if (!entry) return fail(404, "Audit log entry not found");

  const recomputed = tamperHash({
    timestamp: entry.timestamp,
    actorEmail: entry.actorEmail,
    action: entry.action,
    target: entry.target,
    status: entry.status,
    severity: entry.severity,
    details: entry.details,
    beforeState: entry.beforeState as Prisma.InputJsonValue | null,
    afterState: entry.afterState as Prisma.InputJsonValue | null,
  });
  const valid = recomputed === entry.tamperHash;

  return ok({ valid, entryId: entry.id, displayId: entry.displayId });
}
