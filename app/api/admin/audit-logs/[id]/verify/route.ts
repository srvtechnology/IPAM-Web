import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth/permissions";
import { tamperHash } from "@/lib/audit";
import { ok, fail } from "@/lib/api-response";

/**
 * Recomputes the HMAC over the entry's stored (timestamp, actorEmail, action,
 * target) and compares it to the stored tamperHash. Never exposes
 * AUDIT_HMAC_SECRET to the client — the recompute happens entirely here.
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const gate = await requirePermission(req, "AUDIT_TRAILS", "canRead");
  if (gate instanceof NextResponse) return gate;

  const { id } = await params;
  const entry = await db.auditLogEntry.findUnique({ where: { id } });
  if (!entry) return fail(404, "Audit log entry not found");

  const recomputed = tamperHash(entry.timestamp, entry.actorEmail, entry.action, entry.target);
  const valid = recomputed === entry.tamperHash;

  return ok({ valid, entryId: entry.id, displayId: entry.displayId });
}
