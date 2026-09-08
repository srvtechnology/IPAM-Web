import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth/permissions";
import { updateIdCardOrderSchema } from "@/lib/validation/idcards";
import { writeAuditLog, requestMeta } from "@/lib/audit";
import { ok, fail } from "@/lib/api-response";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const gate = await requirePermission(req, "ID_CARDS", "canRead");
  if (gate instanceof NextResponse) return gate;

  const { id } = await params;
  const order = await db.idCardOrder.findUnique({ where: { id } });
  if (!order) return fail(404, "Order not found");
  return ok(order);
}

const STATUS_TIMESTAMP_FIELD: Record<string, "printedDate" | "dispatchedDate" | "issueDate" | undefined> = {
  QUALITY_CHECK: "printedDate",
  DISPATCHED: "dispatchedDate",
  DELIVERED: "issueDate",
  COLLECTED: "issueDate",
};

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const gate = await requirePermission(req, "ID_CARDS", "canWrite");
  if (gate instanceof NextResponse) return gate;
  const { admin } = gate;

  const { id } = await params;
  const body = await req.json().catch(() => null);
  if (!body) return fail(400, "Invalid JSON body");
  const parsed = updateIdCardOrderSchema.safeParse(body);
  if (!parsed.success) return fail(400, "Validation failed", { issues: parsed.error.flatten() });

  const existing = await db.idCardOrder.findUnique({ where: { id } });
  if (!existing) return fail(404, "Order not found");

  const extraTimestamp = parsed.data.status ? STATUS_TIMESTAMP_FIELD[parsed.data.status] : undefined;

  const updated = await db.idCardOrder.update({
    where: { id },
    data: {
      ...parsed.data,
      ...(extraTimestamp ? { [extraTimestamp]: new Date() } : {}),
    },
  });

  if (parsed.data.status && parsed.data.status !== existing.status) {
    const admin2 = await db.adminUser.findUnique({ where: { id: admin.id }, include: { role: true } });
    const { ipAddress, location, deviceInfo } = requestMeta(req);
    await writeAuditLog({
      actorAdminId: admin.id,
      actorName: admin2?.name ?? admin.name,
      actorEmail: admin2?.email ?? admin.email,
      actorRole: admin2?.role.name ?? "Admin",
      action: "ID_CARD_STATUS_CHANGED",
      actionLabel: "ID Card Status Transition",
      category: "SMART_ID_BUREAU",
      target: `Order: ${existing.orderNumber} (${existing.studentName})`,
      targetType: "ID Card Order",
      status: "SUCCESS",
      severity: "INFO",
      ipAddress,
      location,
      deviceInfo,
      details: `Order ${existing.orderNumber} moved from ${existing.status} to ${parsed.data.status}.`,
      beforeState: { status: existing.status },
      afterState: { status: parsed.data.status },
    });
  }

  return ok(updated);
}
