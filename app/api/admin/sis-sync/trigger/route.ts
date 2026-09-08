import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth/permissions";
import { writeAuditLog, requestMeta } from "@/lib/audit";
import { ok } from "@/lib/api-response";

const NODES = ["USL-Central-Node-01", "USL-Central-Node-02", "IPAM-Registrar-DB", "Faculty-Records-Mirror"];
const OPERATIONS = ["DELTA_SYNC", "FULL_RECONCILE", "ENROLLMENT_PULL", "GRADUATION_PUSH"];

/**
 * Stubbed: fabricates one plausible SisSyncLog row. No real external SIS
 * call is made — a genuine integration is out of scope for this pass (see
 * docs/ARCHITECTURE.md's stubbed-behavior list).
 */
export async function POST(req: NextRequest) {
  const gate = await requirePermission(req, "SIS_SYNC", "canWrite");
  if (gate instanceof NextResponse) return gate;
  const { admin } = gate;

  const node = NODES[Math.floor(Math.random() * NODES.length)];
  const operation = OPERATIONS[Math.floor(Math.random() * OPERATIONS.length)];
  const recordsSynced = Math.floor(Math.random() * 400) + 20;
  const latencyMs = Math.floor(Math.random() * 900) + 80;
  const roll = Math.random();
  const status = roll > 0.92 ? "ERROR" : roll > 0.8 ? "WARNING" : "SUCCESS";

  const log = await db.sisSyncLog.create({
    data: { node, operation, recordsSynced, latencyMs, status },
  });

  const admin2 = await db.adminUser.findUnique({ where: { id: admin.id }, include: { role: true } });
  const { ipAddress, location, deviceInfo } = requestMeta(req);
  await writeAuditLog({
    actorAdminId: admin.id,
    actorName: admin2?.name ?? admin.name,
    actorEmail: admin2?.email ?? admin.email,
    actorRole: admin2?.role.name ?? "Admin",
    action: "SIS_SYNC_TRIGGERED",
    actionLabel: "Manual SIS Sync Triggered",
    category: "SYSTEM_CORE",
    target: `Node: ${node}`,
    targetType: "SIS Sync",
    status: status === "ERROR" ? "FLAGGED" : "SUCCESS",
    severity: status === "ERROR" ? "WARNING" : "INFO",
    ipAddress,
    location,
    deviceInfo,
    details: `Manually triggered ${operation} against ${node}: ${recordsSynced} records, ${latencyMs}ms, status ${status}.`,
  });

  return ok(log, 201);
}
