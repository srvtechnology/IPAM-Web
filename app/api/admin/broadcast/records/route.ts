import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth/permissions";
import { sendBroadcastSchema } from "@/lib/validation/broadcast";
import { writeAuditLog, requestMeta } from "@/lib/audit";
import { ok, fail } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  const gate = await requirePermission(req, "BROADCAST", "canRead");
  if (gate instanceof NextResponse) return gate;

  const records = await db.broadcastRecord.findMany({ orderBy: { date: "desc" } });
  return ok(records);
}

// "Send" a broadcast. Per the plan, this is STUBBED — no real SMS/WhatsApp/
// Email/Push provider is called. We create the BroadcastRecord immediately
// as DELIVERED with a plausible fabricated deliveryRate/cost.
export async function POST(req: NextRequest) {
  const gate = await requirePermission(req, "BROADCAST", "canWrite");
  if (gate instanceof NextResponse) return gate;
  const { admin } = gate;

  const body = await req.json().catch(() => null);
  if (!body) return fail(400, "Invalid JSON body");
  const parsed = sendBroadcastSchema.safeParse(body);
  if (!parsed.success) return fail(400, "Validation failed", { issues: parsed.error.flatten() });

  const deliveryRate = `${(96 + Math.random() * 3.5).toFixed(1)}%`;
  const costPerRecipient = 0.018;
  const cost = `$${(parsed.data.recipientsCount * costPerRecipient).toFixed(2)}`;

  const record = await db.broadcastRecord.create({
    data: {
      ...parsed.data,
      status: "DELIVERED",
      deliveryRate,
      cost,
      createdByAdminId: admin.id,
    },
  });

  const admin2 = await db.adminUser.findUnique({ where: { id: admin.id }, include: { role: true } });
  const { ipAddress, location, deviceInfo } = requestMeta(req);
  await writeAuditLog({
    actorAdminId: admin.id,
    actorName: admin2?.name ?? admin.name,
    actorEmail: admin2?.email ?? admin.email,
    actorRole: admin2?.role.name ?? "Admin",
    action: "BROADCAST_SENT",
    actionLabel: "Omnichannel Broadcast Dispatched",
    category: "OMNICHANNEL_BROADCAST",
    target: `Broadcast: ${parsed.data.title}`,
    targetType: "Broadcast Record",
    status: "SUCCESS",
    severity: "INFO",
    ipAddress,
    location,
    deviceInfo,
    details: `Broadcast "${parsed.data.title}" sent to ${parsed.data.audienceLabel} (${parsed.data.recipientsCount} recipients) via ${parsed.data.channels.join(", ")}.`,
    afterState: { status: "DELIVERED", deliveryRate, cost },
  });

  return ok(record, 201);
}
