import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyFlotBasicAuth, type FlotWebhookPayload } from "@/lib/payments/flot";

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

  // 3. Process status asynchronously / synchronously before sending 200 OK
  try {
    if (status === "failed") {
      // Per Flot documentation:
      // "If a webhook arrives with status = failed, the end-user experienced a payment error while paying with credit card.
      //  They can retry later — when your backend receives this status, leave the order in pending state rather than marking it failed."
      console.log(`[Flot Webhook] Payment failed for orderId=${orderId}. Keeping in PENDING state to allow retry.`);
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

        console.log(`[Flot Webhook] Successfully marked Event Registration #${registration.bookingReference} as PAID`);
        return NextResponse.json({ received: true, orderId, type: "event_registration", status: "completed" }, { status: 200 });
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

