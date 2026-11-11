import type { NextRequest } from "next/server";
import { getAlumniSession } from "@/lib/auth/session";
import { getPhysicalCardPricing } from "@/lib/card-pricing";
import { createFlotPaymentLink } from "@/lib/payments/flot";
import { ok, fail } from "@/lib/api-response";

export async function POST(req: NextRequest) {
  const session = await getAlumniSession();
  if (!session) {
    return fail(401, "You must be signed in to initiate a Flot payment");
  }

  const body = await req.json().catch(() => null);
  const cardTier = body?.cardTier as "STANDARD_PVC" | "GOLD_RFID_SMART" | "EXECUTIVE_TITANIUM" | undefined;

  let amount = typeof body?.amount === "number" ? body.amount : 0;
  let currency = typeof body?.currency === "string" ? body.currency : "SLE";
  let description = body?.description || "IPAM Alumni Payment";

  if (cardTier) {
    if (!["STANDARD_PVC", "GOLD_RFID_SMART", "EXECUTIVE_TITANIUM"].includes(cardTier)) {
      return fail(400, "Invalid or missing card tier");
    }
    const pricing = await getPhysicalCardPricing();
    const tierConfig = pricing.tiers[cardTier];
    if (!tierConfig || !tierConfig.enabled) {
      return fail(400, "Selected card tier is currently unavailable");
    }
    amount = tierConfig.price + pricing.shippingFee;
    currency = pricing.currency;
    description = `IPAM Alumni Physical ID Card: ${tierConfig.name}`;
  }

  if (amount <= 0) {
    return fail(400, "Payment amount must be greater than zero");
  }

  // Generate unique order ID or use provided orderNumber
  const orderId = body?.orderNumber || `FLOT-ORD-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
  const paymentType = (body?.type === "credit-card" ? "credit-card" : "in-app") as "in-app" | "credit-card";

  const result = await createFlotPaymentLink({
    orderId,
    amount,
    currency,
    type: paymentType,
    recipientName: body?.recipientName,
    description,
  });

  return ok(result);
}

