import type { NextRequest } from "next/server";
import { getAlumniSession } from "@/lib/auth/session";
import { getPhysicalCardPricing } from "@/lib/card-pricing";
import { createStripePaymentIntent } from "@/lib/payments/stripe";
import { ok, fail } from "@/lib/api-response";

export async function POST(req: NextRequest) {
  const session = await getAlumniSession();
  if (!session) {
    return fail(401, "You must be signed in to initiate a card payment");
  }

  const body = await req.json().catch(() => null);
  const cardTier = body?.cardTier as "STANDARD_PVC" | "GOLD_RFID_SMART" | "EXECUTIVE_TITANIUM" | undefined;
  if (!cardTier || !["STANDARD_PVC", "GOLD_RFID_SMART", "EXECUTIVE_TITANIUM"].includes(cardTier)) {
    return fail(400, "Invalid or missing card tier");
  }

  const pricing = await getPhysicalCardPricing();
  const tierConfig = pricing.tiers[cardTier];
  if (!tierConfig || !tierConfig.enabled) {
    return fail(400, "Selected card tier is currently unavailable");
  }

  const totalAmount = tierConfig.price + pricing.shippingFee;
  if (totalAmount <= 0) {
    return fail(400, "Card tier price must be greater than zero");
  }

  const result = await createStripePaymentIntent({
    amount: totalAmount,
    currency: pricing.currency,
    cardTier,
    alumniUserId: session.sub,
    recipientName: body?.recipientName,
  });

  return ok(result);
}
