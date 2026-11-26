import type { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getAlumniSession } from "@/lib/auth/session";
import { getPhysicalCardPricing } from "@/lib/card-pricing";
import { getDynamicSubscriptionTiers } from "@/lib/subscription-service";
import { type MembershipTierKey } from "@/lib/subscription-pricing";
import { createFlotPaymentLink } from "@/lib/payments/flot";
import { sleToUsd, usdToSle, getUsdToSleRate } from "@/lib/payments/currency";
import { ok, fail } from "@/lib/api-response";

export async function POST(req: NextRequest) {
  const session = await getAlumniSession(req);
  const body = await req.json().catch(() => null);
  if (!body) return fail(400, "Invalid JSON body");

  const cardTier = body?.cardTier as "STANDARD_PVC" | "GOLD_RFID_SMART" | "EXECUTIVE_TITANIUM" | undefined;
  const purpose = body?.purpose as
    | "physical_card"
    | "event_registration"
    | "subscription"
    | "donation"
    | undefined;

  let amount = typeof body?.amount === "number" ? body.amount : Number(body?.amount) || 0;
  let currency = (typeof body?.currency === "string" ? body.currency : "SLE").toUpperCase();
  if (currency !== "USD" && currency !== "SLE") {
    currency = "SLE";
  }

  let description = body?.description || "IPAM Alumni Payment";
  let orderId =
    body?.orderNumber ||
    body?.orderId ||
    `IPAM-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

  // 1. Physical ID Card Checkout
  if (cardTier || purpose === "physical_card") {
    if (!session) {
      return fail(401, "You must be signed in to order a physical ID card");
    }
    const targetTier = cardTier || "STANDARD_PVC";
    if (!["STANDARD_PVC", "GOLD_RFID_SMART", "EXECUTIVE_TITANIUM"].includes(targetTier)) {
      return fail(400, "Invalid or missing card tier");
    }
    const pricing = await getPhysicalCardPricing();
    const tierConfig = pricing.tiers[targetTier];
    if (!tierConfig || !tierConfig.enabled) {
      return fail(400, "Selected card tier is currently unavailable");
    }
    const baseSleAmount = tierConfig.price + pricing.shippingFee;
    amount = currency === "USD" ? sleToUsd(baseSleAmount) : baseSleAmount;
    description = `IPAM Alumni Physical ID Card: ${tierConfig.name}`;

    // If mobile passes deliveryAddress & recipientPhone with createPendingOrder=true,
    // pre-create PENDING PhysicalCardOrder + Transaction so webhook/status settles automatically.
    if (body?.createPendingOrder && body?.deliveryAddress && body?.recipientPhone) {
      const cardOrderNum = body?.orderNumber || `PVC-${Date.now().toString(36).toUpperCase()}`;
      orderId = cardOrderNum;

      const existingOrder = await db.physicalCardOrder.findUnique({ where: { orderNumber: cardOrderNum } });
      if (!existingOrder) {
        const order = await db.physicalCardOrder.create({
          data: {
            orderNumber: cardOrderNum,
            alumniUserId: session.sub,
            cardTier: targetTier,
            amount,
            currency,
            deliveryAddress: String(body.deliveryAddress),
            recipientName: String(body.recipientName || session.email),
            recipientPhone: String(body.recipientPhone),
            paymentMethod: "FLOT",
            paymentStatus: "PENDING",
            paymentRef: cardOrderNum,
            status: "IN_PRINT_PRESS",
          },
        });

        await db.transaction
          .create({
            data: {
              refId: `TXN-${cardOrderNum}`,
              method: "Flot Payment Gateway",
              methodColor: "PRIMARY",
              amount,
              currency,
              tier: `Physical ID Card - ${tierConfig.name}`,
              status: "PENDING",
              alumniName: String(body.recipientName || session.email),
              cardOrderId: order.id,
            },
          })
          .catch(() => {});
      }
    }
  }

  // 2. Paid Event Registration Checkout
  else if (purpose === "event_registration" || body?.eventId) {
    if (!session) {
      return fail(401, "You must be signed in to book paid event tickets");
    }
    const eventId = body?.eventId as string;
    if (!eventId) {
      return fail(400, "eventId is required for event registration payment");
    }

    const event = await db.alumniEvent.findUnique({
      where: { id: eventId },
      include: {
        registrations: { select: { ticketCount: true, bookingStatus: true } },
      },
    });
    if (!event) return fail(404, "Event not found");

    const ticketCount = Math.max(1, Number(body?.ticketCount) || 1);
    const bookedSeats = event.registrations
      .filter((r) => r.bookingStatus !== "CANCELLED")
      .reduce((sum, r) => sum + r.ticketCount, 0);

    const existingReg = await db.eventRegistration.findFirst({
      where: { eventId, userId: session.sub, bookingStatus: { not: "CANCELLED" } },
    });

    if (existingReg && (existingReg.paymentStatus === "PAID" || existingReg.paymentStatus === "FREE")) {
      return fail(409, "You already have a confirmed registration for this event");
    }

    if (!existingReg && bookedSeats + ticketCount > event.capacity) {
      return fail(409, `Only ${Math.max(0, event.capacity - bookedSeats)} seats remain`);
    }

    const basePrice = event.isPaid ? Number(event.ticketPrice) * ticketCount : 0;
    if (basePrice <= 0) {
      return fail(400, "This is a free event. Use POST /api/events/{id}/register directly.");
    }

    const eventCurr = event.currency === "USD" ? "USD" : "SLE";
    if (currency === eventCurr) {
      amount = basePrice;
    } else if (eventCurr === "SLE" && currency === "USD") {
      amount = sleToUsd(basePrice);
    } else {
      amount = usdToSle(basePrice);
    }

    description = `Event Tickets (${ticketCount}x): ${event.title}`;

    const bookingRef =
      body?.orderNumber ||
      existingReg?.bookingReference ||
      `BK-EVT-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    orderId = bookingRef;

    const alumniUser = await db.alumniUser.findUnique({
      where: { id: session.sub },
      include: { profile: true },
    });
    const attendeeName = body?.recipientName || alumniUser?.profile?.name || alumniUser?.email || "Alumni Attendee";

    if (existingReg) {
      await db.eventRegistration.update({
        where: { id: existingReg.id },
        data: {
          bookingReference: bookingRef,
          ticketCount,
          unitPrice: Number(event.ticketPrice),
          totalAmount: basePrice,
          paymentMethod: "FLOT",
          attendeePhone: body?.attendeePhone || existingReg.attendeePhone,
        },
      });
    } else {
      await db.eventRegistration.create({
        data: {
          bookingReference: bookingRef,
          eventId: event.id,
          userId: session.sub,
          ticketCount,
          unitPrice: Number(event.ticketPrice),
          totalAmount: basePrice,
          currency: eventCurr,
          paymentStatus: "PENDING",
          paymentMethod: "FLOT",
          bookingStatus: "CONFIRMED",
          attendeeName,
          attendeeEmail: alumniUser?.email || session.email,
          attendeePhone: body?.attendeePhone || null,
          source: "MOBILE_APP",
        },
      });
      await db.alumniEvent.update({
        where: { id: event.id },
        data: { registeredCount: { increment: ticketCount } },
      });
    }

    const txnRef = `TXN-${bookingRef}`;
    const existingTxn = await db.transaction.findFirst({ where: { refId: txnRef } });
    if (!existingTxn) {
      await db.transaction
        .create({
          data: {
            refId: txnRef,
            method: "Flot Event Booking",
            methodColor: "PRIMARY",
            amount: basePrice,
            currency: eventCurr,
            tier: `Event Registration - ${event.title}`,
            status: "PENDING",
            alumniName: attendeeName,
          },
        })
        .catch(() => {});
    }
  }

  // 3. Membership Subscription Checkout
  else if (purpose === "subscription" || body?.subscriptionTier) {
    if (!session) {
      return fail(401, "You must be signed in to upgrade your subscription");
    }
    const subscriptionTier = (body?.subscriptionTier || body?.tier) as MembershipTierKey;
    const billingCycle = (body?.billingCycle || "ANNUAL") as "ANNUAL" | "MONTHLY" | "LIFETIME";

    const dynamicTiers = await getDynamicSubscriptionTiers();
    const targetPlan = dynamicTiers[subscriptionTier];
    if (!targetPlan || targetPlan.isFree) {
      return fail(400, "Invalid or free subscription tier selected for paid checkout");
    }

    const baseSlePrice =
      billingCycle === "LIFETIME"
        ? targetPlan.lifetimePrice
        : billingCycle === "MONTHLY"
        ? targetPlan.monthlyPrice
        : targetPlan.annualPrice;

    amount = currency === "USD" ? sleToUsd(baseSlePrice) : baseSlePrice;
    description = `IPAM Membership: ${targetPlan.name} (${billingCycle})`;
    orderId = body?.orderNumber || `IPAM-SUB-${subscriptionTier.slice(0, 3)}-${Date.now()}`;

    if (body?.createPendingOrder !== false) {
      const validUntil =
        billingCycle === "LIFETIME"
          ? null
          : billingCycle === "MONTHLY"
          ? new Date(Date.now() + 30 * 86400000)
          : new Date(Date.now() + 365 * 86400000);

      const alumniUser = await db.alumniUser.findUnique({
        where: { id: session.sub },
        include: { profile: true },
      });

      const existingSub = await db.membershipSubscription.findFirst({
        where: { paymentReference: orderId },
      });

      if (!existingSub) {
        await db.membershipSubscription.create({
          data: {
            userId: session.sub,
            tier: subscriptionTier as never,
            billingCycle,
            amountPaid: amount,
            currency,
            status: "PENDING",
            paymentMethod: "FLOT",
            paymentReference: orderId,
            autoRenew: billingCycle !== "LIFETIME",
            validUntil,
          },
        });

        await db.transaction
          .create({
            data: {
              refId: `TXN-${orderId}`,
              method: "Flot Subscription",
              methodColor: "PRIMARY",
              amount,
              currency,
              tier: `Membership Subscription - ${targetPlan.name}`,
              status: "PENDING",
              alumniName: alumniUser?.profile?.name || alumniUser?.email || session.email,
            },
          })
          .catch(() => {});
      }
    }
  }

  // 4. University Giving / Donation Checkout
  else if (purpose === "donation" || body?.fund) {
    if (amount <= 0) {
      return fail(400, "Donation amount must be greater than zero");
    }

    const donRef = body?.orderNumber || `DON-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
    orderId = donRef;
    const fundTitle = String(body?.fund || "University Endowment Fund");
    description = `IPAM Giving: ${fundTitle}`;

    if (body?.donorName && body?.donorEmail) {
      const existingDon = await db.donation.findFirst({ where: { paymentRef: donRef } });
      if (!existingDon) {
        const don = await db.donation.create({
          data: {
            userId: session?.sub ?? null,
            donorName: String(body.donorName),
            donorEmail: String(body.donorEmail),
            donorPhone: String(body.donorPhone || "N/A"),
            donorClass: body.donorClass ? String(body.donorClass) : null,
            amount,
            currency,
            fund: fundTitle,
            frequency: body.frequency === "MONTHLY" ? "MONTHLY" : "ONE_TIME",
            paymentMethod: "FLOT",
            paymentRef: donRef,
            status: "PENDING",
            isDedication: Boolean(body.isDedication),
            dedicationName: body.dedicationName ? String(body.dedicationName) : null,
            isAnonymous: Boolean(body.isAnonymous),
          },
        });

        await db.transaction
          .create({
            data: {
              refId: `TXN-${donRef}`,
              method: "Flot Online Giving",
              methodColor: "TERTIARY",
              amount,
              currency,
              tier: `University Giving - ${fundTitle}`,
              status: "PENDING",
              alumniName: don.donorName,
              donationId: don.id,
            },
          })
          .catch(() => {});
      }
    }
  }

  if (amount <= 0) {
    return fail(400, "Payment amount must be greater than zero");
  }

  // For USD currency, Flot only accepts card payments
  let paymentType: "in-app" | "momo" | "card" = "in-app";
  if (currency === "USD") {
    paymentType = "card";
  } else if (body?.type === "momo" || body?.type === "mobile-money") {
    paymentType = "momo";
  } else if (body?.type === "card" || body?.type === "credit-card") {
    paymentType = "card";
  }

  const result = await createFlotPaymentLink({
    orderId,
    amount,
    currency,
    type: paymentType,
    recipientName: body?.recipientName || session?.email,
    description,
  });

  const exchangeRate = getUsdToSleRate();

  return ok({
    ...result,
    paymentType,
    currency,
    amount,
    exchangeRate,
    sleEquivalent: currency === "SLE" ? amount : usdToSle(amount),
    usdEquivalent: currency === "USD" ? amount : sleToUsd(amount),
  });
}
