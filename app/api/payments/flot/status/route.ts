import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getFlotPaymentAttemptStatus } from "@/lib/payments/flot";
import { writeAuditLog, requestMeta } from "@/lib/audit";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const orderId = searchParams.get("orderId");
  const attemptId = searchParams.get("attemptId");

  if (!orderId) {
    return NextResponse.json({ error: "Missing orderId parameter" }, { status: 400 });
  }

  try {
    // 1. Check if database already shows order as settled/completed
    const physicalCardOrder = await db.physicalCardOrder.findFirst({
      where: { OR: [{ orderNumber: orderId }, { id: orderId }] },
    });
    if (physicalCardOrder && physicalCardOrder.paymentStatus === "PAID") {
      return NextResponse.json({ status: "completed", orderId, type: "physical_card" });
    }

    const donation = await db.donation.findFirst({
      where: { OR: [{ paymentRef: orderId }, { id: orderId }] },
    });
    if (donation && donation.status === "SUCCEEDED") {
      return NextResponse.json({ status: "completed", orderId, type: "donation" });
    }

    const subscription = await db.membershipSubscription.findFirst({
      where: { OR: [{ paymentReference: orderId }, { id: orderId }] },
    });
    if (subscription && subscription.status === "ACTIVE") {
      return NextResponse.json({ status: "completed", orderId, type: "subscription" });
    }

    const registration = await db.eventRegistration.findFirst({
      where: { OR: [{ bookingReference: orderId }, { paymentRef: orderId }, { id: orderId }] },
    });
    if (registration && registration.paymentStatus === "PAID") {
      return NextResponse.json({ status: "completed", orderId, type: "event_registration" });
    }

    // 2. Query Flot Payment Attempt Status directly if attemptId is present
    if (attemptId) {
      const flotStatus = await getFlotPaymentAttemptStatus(orderId, attemptId);

      if (flotStatus.status === "completed" || flotStatus.status === "succeeded") {
        const { ipAddress, location, deviceInfo } = requestMeta(req);

        // Settle immediately in DB if not already
        if (physicalCardOrder && physicalCardOrder.paymentStatus !== "PAID") {
          await db.physicalCardOrder.update({
            where: { id: physicalCardOrder.id },
            data: { paymentStatus: "PAID", paymentRef: attemptId, paymentMethod: "FLOT" },
          });
          await db.transaction.updateMany({
            where: { OR: [{ cardOrderId: physicalCardOrder.id }, { refId: `TXN-${physicalCardOrder.orderNumber}` }] },
            data: { status: "SETTLED", method: "Flot Online Payment", methodColor: "PRIMARY" },
          });
          await writeAuditLog({
            actorName: "Flot Payment Gateway",
            actorEmail: "gateway@flotme.ai",
            actorRole: "PAYMENT_GATEWAY",
            action: "FLOT_PAYMENT_SETTLED",
            actionLabel: "Flot Payment Settled",
            category: "COMMERCIAL_FINANCE",
            target: `Physical Card Order #${physicalCardOrder.orderNumber}`,
            targetType: "PhysicalCardOrder",
            status: "SUCCESS",
            severity: "INFO",
            ipAddress,
            location,
            deviceInfo,
            details: `Payment of ${physicalCardOrder.currency} ${Number(physicalCardOrder.amount).toFixed(2)} settled via Flot status check. Flot Ref: ${attemptId}.`,
            beforeState: { paymentStatus: physicalCardOrder.paymentStatus },
            afterState: { paymentStatus: "PAID", paymentRef: attemptId, paymentMethod: "FLOT" },
          });
          return NextResponse.json({ status: "completed", orderId, type: "physical_card" });
        }

        if (donation && donation.status !== "SUCCEEDED") {
          await db.donation.update({
            where: { id: donation.id },
            data: { status: "SUCCEEDED", paymentRef: attemptId, paymentMethod: "FLOT" },
          });
          await db.transaction.create({
            data: {
              refId: `TXN-${donation.paymentRef}`,
              method: "Flot Online Giving",
              methodColor: "TERTIARY",
              amount: donation.amount,
              currency: donation.currency === "SLE" ? "SLE" : "USD",
              tier: donation.fund,
              status: "SETTLED",
              alumniName: donation.donorName,
              donationId: donation.id,
            },
          });
          await writeAuditLog({
            actorName: "Flot Payment Gateway",
            actorEmail: "gateway@flotme.ai",
            actorRole: "PAYMENT_GATEWAY",
            action: "FLOT_PAYMENT_SETTLED",
            actionLabel: "Flot Donation Settled",
            category: "COMMERCIAL_FINANCE",
            target: `Donation #${donation.paymentRef}`,
            targetType: "Donation",
            status: "SUCCESS",
            severity: "INFO",
            ipAddress,
            location,
            deviceInfo,
            details: `Philanthropic donation of ${donation.currency} ${Number(donation.amount).toFixed(2)} settled via Flot status check. Flot Ref: ${attemptId}.`,
            beforeState: { status: donation.status },
            afterState: { status: "SUCCEEDED", paymentMethod: "FLOT", paymentRef: attemptId },
          });
          return NextResponse.json({ status: "completed", orderId, type: "donation" });
        }

        if (subscription && subscription.status !== "ACTIVE") {
          await db.membershipSubscription.update({
            where: { id: subscription.id },
            data: { status: "ACTIVE", paymentMethod: "FLOT", paymentReference: attemptId },
          });
          return NextResponse.json({ status: "completed", orderId, type: "subscription" });
        }

        if (registration && registration.paymentStatus !== "PAID") {
          await db.eventRegistration.update({
            where: { id: registration.id },
            data: { paymentStatus: "PAID", paymentMethod: "FLOT", paymentRef: attemptId },
          });
          return NextResponse.json({ status: "completed", orderId, type: "event_registration" });
        }

        return NextResponse.json({ status: "completed", orderId, attemptId, data: flotStatus.data });
      }

      return NextResponse.json({
        status: flotStatus.status || "pending",
        orderId,
        attemptId,
        data: flotStatus.data,
      });
    }

    return NextResponse.json({ status: "pending", orderId });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error checking payment status";
    return NextResponse.json({ status: "error", error: message }, { status: 500 });
  }
}
