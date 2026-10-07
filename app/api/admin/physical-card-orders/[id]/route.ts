import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth/permissions";
import { writeAuditLog, requestMeta } from "@/lib/audit";
import { ok, fail } from "@/lib/api-response";
import { z } from "zod";

const updatePhysicalCardOrderSchema = z.object({
  status: z
    .enum(["IN_PRINT_PRESS", "QUALITY_CHECK", "READY_COURIER", "DISPATCHED", "DELIVERED", "COLLECTED"])
    .optional(),
  trackingCode: z.string().nullable().optional(),
  paymentStatus: z.enum(["PENDING", "PENDING_COD", "PAID", "FAILED"]).optional(),
});

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const gate = await requirePermission(req, "ID_CARDS", "canRead");
  if (gate instanceof NextResponse) return gate;

  const { id } = await params;
  const order = await db.physicalCardOrder.findUnique({
    where: { id },
    include: {
      alumniUser: {
        include: { profile: true },
      },
      transaction: true,
    },
  });
  if (!order) return fail(404, "Physical card order not found");
  return ok(order);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const gate = await requirePermission(req, "ID_CARDS", "canWrite");
  if (gate instanceof NextResponse) return gate;
  const { admin } = gate;

  const { id } = await params;
  const body = await req.json().catch(() => null);
  if (!body) return fail(400, "Invalid JSON body");
  const parsed = updatePhysicalCardOrderSchema.safeParse(body);
  if (!parsed.success) return fail(400, "Validation failed", { issues: parsed.error.flatten() });

  const existing = await db.physicalCardOrder.findUnique({
    where: { id },
    include: { alumniUser: { include: { profile: true } }, transaction: true },
  });
  if (!existing) return fail(404, "Physical card order not found");

  const updated = await db.physicalCardOrder.update({
    where: { id },
    data: {
      ...(parsed.data.status ? { status: parsed.data.status } : {}),
      ...(parsed.data.trackingCode !== undefined ? { trackingCode: parsed.data.trackingCode } : {}),
      ...(parsed.data.paymentStatus ? { paymentStatus: parsed.data.paymentStatus } : {}),
    },
  });

  // If payment status transitioned to PAID (e.g. COD was collected on delivery)
  if (parsed.data.paymentStatus === "PAID" && existing.paymentStatus !== "PAID") {
    if (existing.transaction) {
      await db.transaction.update({
        where: { id: existing.transaction.id },
        data: {
          status: "SETTLED",
          method: existing.paymentMethod === "COD" ? "Cash on Delivery (Collected)" : existing.transaction.method,
        },
      });
    } else {
      const currency = existing.currency === "SLE" ? "SLE" : "USD";
      await db.transaction.create({
        data: {
          refId: `TXN-${existing.orderNumber}`,
          method: "Cash on Delivery (Collected)",
          methodColor: "PRIMARY",
          amount: existing.amount,
          currency,
          tier: `Physical ID Card - ${existing.cardTier}`,
          status: "SETTLED",
          alumniName: existing.recipientName || existing.alumniUser.profile?.name || existing.alumniUser.email,
          cardOrderId: existing.id,
        },
      });
    }
  }

  // Audit log
  const admin2 = await db.adminUser.findUnique({ where: { id: admin.id }, include: { role: true } });
  const { ipAddress, location, deviceInfo } = requestMeta(req);
  await writeAuditLog({
    actorAdminId: admin.id,
    actorName: admin2?.name ?? admin.name,
    actorEmail: admin2?.email ?? admin.email,
    actorRole: admin2?.role.name ?? "Admin",
    action: "PHYSICAL_CARD_ORDER_UPDATED",
    actionLabel: "Physical Card Order Updated",
    category: "SMART_ID_BUREAU",
    target: `Order: ${existing.orderNumber} (${existing.recipientName || existing.alumniUser.email})`,
    targetType: "Physical Card Order",
    status: "SUCCESS",
    severity: "INFO",
    ipAddress,
    location,
    deviceInfo,
    details: `Order ${existing.orderNumber} updated: status=${parsed.data.status ?? existing.status}, paymentStatus=${parsed.data.paymentStatus ?? existing.paymentStatus}.`,
    beforeState: { status: existing.status, paymentStatus: existing.paymentStatus },
    afterState: { status: updated.status, paymentStatus: updated.paymentStatus },
  });

  return ok(updated);
}
