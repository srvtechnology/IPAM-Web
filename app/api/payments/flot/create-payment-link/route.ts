import type { NextRequest } from "next/server";
import { getAlumniSession } from "@/lib/auth/session";
import { getPhysicalCardPricing } from "@/lib/card-pricing";
import { createFlotPaymentLink } from "@/lib/payments/flot";
import { sleToUsd } from "@/lib/payments/currency";
import { ok, fail } from "@/lib/api-response";

export async function POST(req: NextRequest) {
  const session = await getAlumniSession();
  const body = await req.json().catch(() => null);

  const cardTier = body?.cardTier as "STANDARD_PVC" | "GOLD_RFID_SMART" | "EXECUTIVE_TITANIUM" | undefined;

  let amount = typeof body?.amount === "number" ? body.amount : 0;
  let currency = (typeof body?.currency === "string" ? body.currency : "SLE").toUpperCase();
  let description = body?.description || "IPAM Alumni Payment";

  if (cardTier) {
    if (!session) {
      return fail(401, "You must be signed in to order a physical ID card");
    }
    if (!["STANDARD_PVC", "GOLD_RFID_SMART", "EXECUTIVE_TITANIUM"].includes(cardTier)) {
      return fail(400, "Invalid or missing card tier");
    }
    const pricing = await getPhysicalCardPricing();
    const tierConfig = pricing.tiers[cardTier];
    if (!tierConfig || !tierConfig.enabled) {
      return fail(400, "Selected card tier is currently unavailable");
    }
    const baseSleAmount = tierConfig.price + pricing.shippingFee;
    if (currency === "USD") {
      amount = sleToUsd(baseSleAmount);
    } else {
      amount = baseSleAmount;
      currency = "SLE";
    }
    description = `IPAM Alumni Physical ID Card: ${tierConfig.name}`;
  }

  if (amount <= 0) {
    return fail(400, "Payment amount must be greater than zero");
  }

  // Ensure currency is either SLE or USD
  if (currency !== "USD" && currency !== "SLE") {
    currency = "SLE";
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

  // Generate unique order ID or use provided orderNumber
  const orderId =
    body?.orderNumber ||
    body?.orderId ||
    `IPAM-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

  const result = await createFlotPaymentLink({
    orderId,
    amount,
    currency,
    type: paymentType,
    recipientName: body?.recipientName || session?.email,
    description,
  });

  return ok(result);
}

