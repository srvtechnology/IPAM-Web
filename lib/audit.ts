import { createHmac } from "crypto";
import { db } from "@/lib/db";
import type { AuditCategory, AuditSeverity, AuditStatus, Prisma } from "@prisma/client";

export interface TamperHashFields {
  timestamp: Date;
  actorEmail: string;
  action: string;
  target: string;
  status: string;
  severity: string;
  details: string;
  beforeState?: Prisma.InputJsonValue | null;
  afterState?: Prisma.InputJsonValue | null;
}

/**
 * Real HMAC-SHA256 over the substantive, compliance-relevant fields of an
 * audit entry — not just its identity/routing fields. `details` and the
 * before/after state are exactly what an auditor reviews to see "what
 * actually happened," so they must be covered or tampering them would go
 * undetected. Field order and JSON.stringify(null-safe) serialization of
 * beforeState/afterState must stay stable so a stored hash can be
 * recomputed/verified later.
 */
export function tamperHash(fields: TamperHashFields): string {
  const payload = [
    fields.timestamp.toISOString(),
    fields.actorEmail,
    fields.action,
    fields.target,
    fields.status,
    fields.severity,
    fields.details,
    JSON.stringify(fields.beforeState ?? null),
    JSON.stringify(fields.afterState ?? null),
  ].join("|");
  return createHmac("sha256", process.env.AUDIT_HMAC_SECRET ?? "dev-audit-hmac-secret-change-me")
    .update(payload)
    .digest("hex");
}

export interface WriteAuditLogInput {
  actorAdminId?: string | null;
  actorName: string;
  actorEmail: string;
  actorRole: string;
  actorAvatar?: string | null;
  action: string;
  actionLabel: string;
  category: AuditCategory;
  target: string;
  targetType?: string | null;
  status: AuditStatus;
  severity: AuditSeverity;
  ipAddress: string;
  location: string;
  deviceInfo: string;
  details: string;
  beforeState?: Prisma.InputJsonValue | null;
  afterState?: Prisma.InputJsonValue | null;
}

function formatDisplayId(timestamp: Date): string {
  const year = timestamp.getUTCFullYear();
  const rand = Math.floor(Math.random() * 9000 + 1000);
  return `AUD-${year}-${rand}`;
}

export async function writeAuditLog(input: WriteAuditLogInput) {
  const timestamp = new Date();
  const hash = tamperHash({
    timestamp,
    actorEmail: input.actorEmail,
    action: input.action,
    target: input.target,
    status: input.status,
    severity: input.severity,
    details: input.details,
    beforeState: input.beforeState,
    afterState: input.afterState,
  });

  return db.auditLogEntry.create({
    data: {
      displayId: formatDisplayId(timestamp),
      timestamp,
      actorAdminId: input.actorAdminId ?? null,
      actorName: input.actorName,
      actorEmail: input.actorEmail,
      actorRole: input.actorRole,
      actorAvatar: input.actorAvatar ?? null,
      action: input.action,
      actionLabel: input.actionLabel,
      category: input.category,
      target: input.target,
      targetType: input.targetType ?? null,
      status: input.status,
      severity: input.severity,
      ipAddress: input.ipAddress,
      location: input.location,
      deviceInfo: input.deviceInfo,
      details: input.details,
      beforeState: input.beforeState ?? undefined,
      afterState: input.afterState ?? undefined,
      tamperHash: hash,
    },
  });
}

/** Best-effort request metadata extraction for audit rows (no external geo-IP lookup). */
export function requestMeta(req: Request) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown";
  const deviceInfo = req.headers.get("user-agent") ?? "unknown";
  return { ipAddress: ip, location: "Unknown", deviceInfo };
}
