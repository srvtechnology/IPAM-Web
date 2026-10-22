import type { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getAlumniSession, getAdminSession } from "@/lib/auth/session";
import { ok, fail } from "@/lib/api-response";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const alumniSession = await getAlumniSession(req);
  const adminSession = await getAdminSession(req);

  if (!alumniSession && !adminSession) {
    return fail(401, "Authentication required");
  }

  const { id } = await params;

  const order = await db.physicalCardOrder.findFirst({
    where: {
      OR: [{ id }, { orderNumber: id }],
    },
    include: {
      alumniUser: {
        include: { profile: true },
      },
      transaction: true,
    },
  });

  if (!order) return fail(404, "Card order not found");

  // Check ownership unless admin
  if (!adminSession && order.alumniUserId !== alumniSession!.sub) {
    return fail(403, "You do not have permission to view this order");
  }

  return ok({
    id: order.id,
    orderNumber: order.orderNumber,
    cardTier: order.cardTier,
    status: order.status,
    amount: Number(order.amount),
    currency: order.currency,
    deliveryAddress: order.deliveryAddress,
    recipientName: order.recipientName,
    recipientPhone: order.recipientPhone,
    paymentMethod: order.paymentMethod,
    paymentStatus: order.paymentStatus,
    paymentRef: order.paymentRef,
    trackingCode: order.trackingCode,
    createdAt: order.createdAt.toISOString(),
    user: {
      name: order.recipientName || order.alumniUser.profile?.name || order.alumniUser.email,
      studentId: order.alumniUser.studentId,
      email: order.alumniUser.email,
    },
  });
}
