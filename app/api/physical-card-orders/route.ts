import type { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getAlumniSession } from "@/lib/auth/session";
import { createPhysicalCardOrderSchema } from "@/lib/validation/physical-card-orders";
import { getPhysicalCardPricing } from "@/lib/card-pricing";
import { verifyStripePaymentIntent } from "@/lib/payments/stripe";
import { ok, fail } from "@/lib/api-response";

function generateOrderNumber() {
  return `PVC-${Date.now().toString(36).toUpperCase()}`;
}

export async function GET() {
  const session = await getAlumniSession();
  if (!session) return fail(401, "You must be signed in to view your card orders");

  const orders = await db.physicalCardOrder.findMany({
    where: { alumniUserId: session.sub },
    orderBy: { createdAt: "desc" },
  });
  return ok(orders);
}

export async function POST(req: NextRequest) {
  const session = await getAlumniSession();
  if (!session) return fail(401, "You must be signed in to order a physical card");

  const body = await req.json().catch(() => null);
  if (!body) return fail(400, "Invalid JSON body");
  const parsed = createPhysicalCardOrderSchema.safeParse(body);
  if (!parsed.success) return fail(400, "Validation failed", { issues: parsed.error.flatten() });

  const { cardTier, deliveryAddress, recipientName, recipientPhone, paymentMethod, paymentRef } = parsed.data;

  // Fetch admin-configured pricing
  const pricing = await getPhysicalCardPricing();
  const tierConfig = pricing.tiers[cardTier];
  if (!tierConfig || !tierConfig.enabled) {
    return fail(400, `The requested card tier (${cardTier}) is currently disabled`);
  }

  const totalAmount = tierConfig.price + pricing.shippingFee;
  let finalPaymentStatus = "PENDING";
  let finalPaymentRef = paymentRef;

  if (paymentMethod === "STRIPE") {
    if (!pricing.stripeEnabled) {
      return fail(400, "Stripe card payment is currently disabled by administrator");
    }
    if (!paymentRef) {
      return fail(400, "Payment reference is required for online card orders");
    }

    const verification = await verifyStripePaymentIntent(paymentRef);
    if (!verification.success) {
      return fail(400, verification.error || "Payment verification failed with Stripe");
    }

    finalPaymentStatus = "PAID";
    finalPaymentRef = paymentRef;
  } else if (paymentMethod === "COD") {
    if (!pricing.codEnabled) {
      return fail(400, "Cash on Delivery is currently disabled by administrator");
    }
    finalPaymentStatus = "PENDING_COD";
    finalPaymentRef = `COD-${Date.now().toString(36).toUpperCase()}`;
  } else {
    return fail(400, "Invalid payment method");
  }

  const orderNumber = generateOrderNumber();

  // Create PhysicalCardOrder
  const order = await db.physicalCardOrder.create({
    data: {
      orderNumber,
      alumniUserId: session.sub,
      cardTier,
      amount: totalAmount,
      currency: pricing.currency,
      deliveryAddress,
      recipientName,
      recipientPhone,
      paymentMethod,
      paymentStatus: finalPaymentStatus,
      paymentRef: finalPaymentRef,
      status: "IN_PRINT_PRESS",
    },
  });

  // Track financial transaction in Finance
  try {
    const currency = pricing.currency === "SLE" ? "SLE" : "USD";
    await db.transaction.create({
      data: {
        refId: `TXN-${order.orderNumber}`,
        method: paymentMethod === "STRIPE" ? "Stripe Online Payment" : "Cash on Delivery (Pending)",
        methodColor: paymentMethod === "STRIPE" ? "PRIMARY" : "SECONDARY",
        amount: totalAmount,
        currency,
        tier: `Physical ID Card - ${tierConfig.name}`,
        status: paymentMethod === "STRIPE" ? "SETTLED" : "PENDING",
        alumniName: recipientName,
        cardOrderId: order.id,
      },
    });
  } catch (err) {
    console.error("Failed to record finance transaction for card order:", err);
  }

  return ok(order, 201);
}
