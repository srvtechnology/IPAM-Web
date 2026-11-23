import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyFlotBasicAuth, type FlotWebhookPayload } from "@/lib/payments/flot";
import { writeAuditLog, requestMeta } from "@/lib/audit";

export const dynamic = "force-dynamic";

/**
 * Flot Payment Gateway Webhook Receiver
 *
 * Implements Section 01 (REQ-02) and Section 05 of the Flot Integration Guide:
 * - Accepts POST requests
 * - Protected via HTTP Basic Authorization
 * - Idempotent handling for orderId + flotRequestId combinations
 * - One-shot delivery: acknowledges with 2xx immediately while processing order state
 * - Failed status rule: leaves order in pending state to allow user retry
 */
export async function POST(req: NextRequest) {
  // 1. Authenticate with HTTP Basic Auth
  const authHeader = req.headers.get("authorization");
  if (!verifyFlotBasicAuth(authHeader)) {
    console.warn("[Flot Webhook] Unauthorized webhook request rejected");
    return new NextResponse(
      JSON.stringify({ error: "Unauthorized: Invalid Flot Basic Auth credentials" }),
      {
        status: 401,
        headers: {
          "Content-Type": "application/json",
          "WWW-Authenticate": 'Basic realm="Flot Webhook"',
        },
      }
    );
  }

  // 2. Parse payload
  let payload: FlotWebhookPayload;
  try {
    payload = await req.json();
  } catch (err) {
    console.error("[Flot Webhook] Failed to parse JSON body:", err);
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  const { orderId, flotRequestId, status } = payload;
  if (!orderId || !status) {
    return NextResponse.json(
      { error: "Missing required fields: orderId and status are mandatory" },
      { status: 400 }
    );
  }

  console.log(`[Flot Webhook] Received notification for orderId=${orderId}, flotRequestId=${flotRequestId}, status=${status}`);
  const { ipAddress, location, deviceInfo } = requestMeta(req);

  // 3. Process status asynchronously / synchronously before sending 200 OK
  try {
    if (status === "failed") {
      // Per Flot documentation:
      // "If a webhook arrives with status = failed, the end-user experienced a payment error while paying with credit card.
      //  They can retry later — when your backend receives this status, leave the order in pending state rather than marking it failed."
      console.log(`[Flot Webhook] Payment failed for orderId=${orderId}. Keeping in PENDING state to allow retry.`);

      // Record audit log for admin visibility
      await writeAuditLog({
        actorName: "Flot Payment Gateway",
        actorEmail: "gateway@flotme.ai",
        actorRole: "PAYMENT_GATEWAY",
        action: "FLOT_PAYMENT_FAILED",
        actionLabel: "Flot Payment Error",
        category: "COMMERCIAL_FINANCE",
        target: `Order #${orderId}`,
        targetType: "PaymentGateway",
        status: "WARNING",
        severity: "WARNING",
        ipAddress,
        location,
        deviceInfo,
        details: `Payment failure reported by Flot for order #${orderId} (Flot Request ID: ${flotRequestId || "N/A"}). Order retained in PENDING state to allow customer retry.`,
      });

      return NextResponse.json({ received: true, orderId, status: "pending_retry" }, { status: 200 });
    }

    if (status === "completed") {
      // 3a. Check for Physical Card Order
      const physicalCardOrder = await db.physicalCardOrder.findFirst({
        where: {
          OR: [{ orderNumber: orderId }, { id: orderId }],
        },
      });

      if (physicalCardOrder) {
        await db.physicalCardOrder.update({
          where: { id: physicalCardOrder.id },
          data: {
            paymentStatus: "PAID",
            paymentRef: flotRequestId || physicalCardOrder.paymentRef,
            paymentMethod: "FLOT",
          },
        });

        // Settle associated finance transaction
        await db.transaction.updateMany({
          where: {
            OR: [
              { cardOrderId: physicalCardOrder.id },
              { refId: `TXN-${physicalCardOrder.orderNumber}` },
            ],
          },
          data: {
            status: "SETTLED",
            method: "Flot Online Payment",
            methodColor: "PRIMARY",
          },
        });

        // Write Admin Audit Log Entry
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
          details: `Payment of NLe ${Number(physicalCardOrder.amount).toFixed(2)} settled via Flot Payment Gateway. Order #${physicalCardOrder.orderNumber} marked as PAID. Flot Ref: ${flotRequestId}.`,
          beforeState: { paymentStatus: physicalCardOrder.paymentStatus, status: physicalCardOrder.status },
          afterState: { paymentStatus: "PAID", paymentRef: flotRequestId, paymentMethod: "FLOT" },
        });

        console.log(`[Flot Webhook] Successfully marked PhysicalCardOrder #${physicalCardOrder.orderNumber} as PAID and SETTLED`);
        return NextResponse.json({ received: true, orderId, type: "physical_card", status: "completed" }, { status: 200 });
      }

      // 3b. Check for Membership Subscription
      const subscription = await db.membershipSubscription.findFirst({
        where: {
          OR: [{ paymentReference: orderId }, { id: orderId }],
        },
      });

      if (subscription) {
        await db.membershipSubscription.update({
          where: { id: subscription.id },
          data: {
            status: "ACTIVE",
            paymentMethod: "FLOT",
            paymentReference: flotRequestId || orderId,
          },
        });

        // Record in Admin Transactions ledger
        const subUser = await db.alumniUser.findUnique({
          where: { id: subscription.userId },
          include: { profile: true },
        });

        const subTxnRef = `TXN-${subscription.paymentReference || orderId}`;
        const existingSubTxn = await db.transaction.findFirst({
          where: { refId: subTxnRef },
        });

        if (existingSubTxn) {
          await db.transaction.update({
            where: { id: existingSubTxn.id },
            data: {
              status: "SETTLED",
              method: "Flot Subscription",
              methodColor: "PRIMARY",
            },
          });
        } else {
          await db.transaction.create({
            data: {
              refId: subTxnRef,
              method: "Flot Subscription",
              methodColor: "PRIMARY",
              amount: subscription.amountPaid,
              currency: subscription.currency === "SLE" ? "SLE" : "USD",
              tier: `Membership Subscription - ${subscription.tier}`,
              status: "SETTLED",
              alumniName: subUser?.profile?.name || subUser?.email || "Alumni Subscriber",
            },
          });
        }

        // Write Admin Audit Log Entry
        await writeAuditLog({
          actorName: "Flot Payment Gateway",
          actorEmail: "gateway@flotme.ai",
          actorRole: "PAYMENT_GATEWAY",
          action: "SUBSCRIPTION_PAYMENT_COMPLETED",
          actionLabel: "Flot Subscription Activated",
          category: "COMMERCIAL_FINANCE",
          target: `Membership Subscription #${orderId}`,
          targetType: "MembershipSubscription",
          status: "SUCCESS",
          severity: "INFO",
          ipAddress,
          location,
          deviceInfo,
          details: `Flot subscription payment of NLe ${Number(subscription.amountPaid).toFixed(2)} completed (Tier: ${subscription.tier}, Cycle: ${subscription.billingCycle}). User: ${subscription.userId}. Flot Ref: ${flotRequestId}.`,
          beforeState: { status: subscription.status },
          afterState: { status: "ACTIVE", paymentMethod: "FLOT", paymentReference: flotRequestId || orderId },
        });

        console.log(`[Flot Webhook] Successfully activated Subscription for user ${subscription.userId}`);
        return NextResponse.json({ received: true, orderId, type: "subscription", status: "completed" }, { status: 200 });
      }

      // 3c. Check for Event Registration
      const registration = await db.eventRegistration.findFirst({
        where: {
          OR: [{ bookingReference: orderId }, { paymentRef: orderId }, { id: orderId }],
        },
      });

      if (registration) {
        await db.eventRegistration.update({
          where: { id: registration.id },
          data: {
            paymentStatus: "PAID",
            paymentMethod: "FLOT",
            paymentRef: flotRequestId || orderId,
          },
        });

        const targetEvent = await db.alumniEvent.findUnique({
          where: { id: registration.eventId },
          select: { title: true },
        });

        // Record in Admin Transactions ledger
        const evtTxnRef = `TXN-${registration.bookingReference}`;
        const existingEvtTxn = await db.transaction.findFirst({
          where: { refId: evtTxnRef },
        });

        if (existingEvtTxn) {
          await db.transaction.update({
            where: { id: existingEvtTxn.id },
            data: {
              status: "SETTLED",
              method: "Flot Event Booking",
              methodColor: "PRIMARY",
            },
          });
        } else {
          await db.transaction.create({
            data: {
              refId: evtTxnRef,
              method: "Flot Event Booking",
              methodColor: "PRIMARY",
              amount: registration.totalAmount,
              currency: registration.currency === "SLE" ? "SLE" : "USD",
              tier: `Event Registration - ${targetEvent?.title || "Ticket"}`,
              status: "SETTLED",
              alumniName: registration.attendeeName || "Event Attendee",
            },
          });
        }

        // Write Admin Audit Log Entry
        await writeAuditLog({
          actorName: "Flot Payment Gateway",
          actorEmail: "gateway@flotme.ai",
          actorRole: "PAYMENT_GATEWAY",
          action: "EVENT_BOOKING_PAYMENT_COMPLETED",
          actionLabel: "Flot Event Booking Paid",
          category: "COMMERCIAL_FINANCE",
          target: `Event Booking #${registration.bookingReference}`,
          targetType: "EventRegistration",
          status: "SUCCESS",
          severity: "INFO",
          ipAddress,
          location,
          deviceInfo,
          details: `Flot payment of NLe ${Number(registration.totalAmount).toFixed(2)} completed for event booking #${registration.bookingReference}. Flot Ref: ${flotRequestId}.`,
          beforeState: { paymentStatus: registration.paymentStatus },
          afterState: { paymentStatus: "PAID", paymentMethod: "FLOT", paymentRef: flotRequestId || orderId },
        });

        console.log(`[Flot Webhook] Successfully marked Event Registration #${registration.bookingReference} as PAID`);
        return NextResponse.json({ received: true, orderId, type: "event_registration", status: "completed" }, { status: 200 });
      }

      // 3d. Check for University Giving / Donation
      const donation = await db.donation.findFirst({
        where: {
          OR: [{ paymentRef: orderId }, { id: orderId }],
        },
      });

      if (donation) {
        await db.donation.update({
          where: { id: donation.id },
          data: {
            status: "SUCCEEDED",
            paymentRef: flotRequestId || donation.paymentRef,
            paymentMethod: "FLOT",
          },
        });

        // Settle or create finance transaction
        const existingTxn = await db.transaction.findFirst({
          where: {
            OR: [{ donationId: donation.id }, { refId: `TXN-${donation.paymentRef}` }],
          },
        });

        if (existingTxn) {
          await db.transaction.update({
            where: { id: existingTxn.id },
            data: {
              status: "SETTLED",
              method: "Flot Online Giving",
              methodColor: "TERTIARY",
              tier: `University Giving - ${donation.fund}`,
            },
          });
        } else {
          await db.transaction.create({
            data: {
              refId: `TXN-${donation.paymentRef}`,
              method: "Flot Online Giving",
              methodColor: "TERTIARY",
              amount: donation.amount,
              currency: donation.currency === "SLE" ? "SLE" : "USD",
              tier: `University Giving - ${donation.fund}`,
              status: "SETTLED",
              alumniName: donation.donorName,
              donationId: donation.id,
            },
          });
        }

        // Write Admin Audit Log Entry
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
          details: `Philanthropic donation of ${donation.currency} ${Number(donation.amount).toFixed(2)} to ${donation.fund} settled via Flot Payment Gateway. Donor: ${donation.donorName}. Flot Ref: ${flotRequestId}.`,
          beforeState: { status: donation.status },
          afterState: { status: "SUCCEEDED", paymentMethod: "FLOT", paymentRef: flotRequestId || donation.paymentRef },
        });

        console.log(`[Flot Webhook] Successfully marked Donation #${donation.paymentRef} as SUCCEEDED`);
        return NextResponse.json({ received: true, orderId, type: "donation", status: "completed" }, { status: 200 });
      }

      console.warn(`[Flot Webhook] No matching order found for orderId=${orderId}`);
    }

    return NextResponse.json({ received: true, orderId, status }, { status: 200 });
  } catch (err) {
    console.error(`[Flot Webhook] Error processing webhook for orderId=${orderId}:`, err);
    // Return 200 anyway to prevent Flot from discarding due to one-shot delivery rule,
    // but log the internal error for admin investigation.
    return NextResponse.json({ received: true, error: "Internal processing error logged" }, { status: 200 });
  }
}

