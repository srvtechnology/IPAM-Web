import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getAlumniSession } from "@/lib/auth/session";
import { ok, fail } from "@/lib/api-response";
import { type MembershipTierKey } from "@/lib/subscription-pricing";
import { getDynamicSubscriptionTiers } from "@/lib/subscription-service";
import { updateSubscriptionSchema, toggleAutoRenewSchema } from "@/lib/validation/subscription";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getAlumniSession();
  if (!session) return fail(401, "Authentication required");

  const [user, dynamicTiers] = await Promise.all([
    db.alumniUser.findUnique({
      where: { id: session.sub },
      include: {
        subscriptions: {
          orderBy: { createdAt: "desc" },
          take: 10,
        },
        profile: true,
      },
    }),
    getDynamicSubscriptionTiers(),
  ]);

  if (!user) return fail(404, "User not found");
  if (user.status !== "APPROVED") return fail(403, "Account is pending approval");

  const currentTierKey = user.membershipTier as MembershipTierKey;
  const currentPlan = dynamicTiers[currentTierKey] || dynamicTiers.STANDARD;

  return ok({
    currentTier: currentTierKey,
    currentPlan,
    membershipValidUntil: user.membershipValidUntil,
    billingCycle: user.subscriptionBillingCycle || "ANNUAL",
    autoRenew: user.subscriptionAutoRenew,
    history: user.subscriptions,
    availableTiers: dynamicTiers,
  });
}

export async function POST(req: NextRequest) {
  const session = await getAlumniSession();
  if (!session) return fail(401, "Authentication required");

  const body = await req.json().catch(() => null);
  if (!body) return fail(400, "Invalid JSON body");

  const parsed = updateSubscriptionSchema.safeParse(body);
  if (!parsed.success) {
    return fail(400, "Validation failed", { issues: parsed.error.flatten() });
  }

  const { tier, billingCycle, paymentMethod, paymentReference } = parsed.data;
  const dynamicTiers = await getDynamicSubscriptionTiers();
  const targetPlan = dynamicTiers[tier as MembershipTierKey];
  if (!targetPlan) return fail(400, "Invalid subscription tier");

  let amountPaid = 0;
  if (!targetPlan.isFree) {
    if (billingCycle === "LIFETIME") {
      amountPaid = targetPlan.lifetimePrice;
    } else if (billingCycle === "MONTHLY") {
      amountPaid = targetPlan.monthlyPrice;
    } else {
      amountPaid = targetPlan.annualPrice;
    }
  }

  let validUntil: Date | null = null;
  if (!targetPlan.isFree) {
    const now = new Date();
    if (billingCycle === "LIFETIME") {
      validUntil = null; // No expiration
    } else if (billingCycle === "MONTHLY") {
      validUntil = new Date(now.setMonth(now.getMonth() + 1));
    } else {
      validUntil = new Date(now.setFullYear(now.getFullYear() + 1));
    }
  }

  const ref = paymentReference || `IPAM-SUB-${tier.substring(0, 3)}-${Date.now()}`;

  // Perform subscription upgrade transaction
  const [updatedUser, newSubscription] = await db.$transaction([
    db.alumniUser.update({
      where: { id: session.sub },
      data: {
        membershipTier: tier as never,
        subscriptionBillingCycle: billingCycle,
        subscriptionAutoRenew: billingCycle !== "LIFETIME",
        membershipValidUntil: validUntil,
        subscriptionUpdatedAt: new Date(),
      },
      include: {
        profile: true,
      },
    }),
    db.membershipSubscription.create({
      data: {
        userId: session.sub,
        tier: tier as never,
        billingCycle,
        amountPaid,
        currency: "USD",
        status: "ACTIVE",
        paymentMethod,
        paymentReference: ref,
        autoRenew: billingCycle !== "LIFETIME",
        validUntil,
      },
    }),
  ]);

  const { passwordHash: _omit, ...safeUser } = updatedUser;

  return ok({
    user: safeUser,
    subscription: newSubscription,
    tier: updatedUser.membershipTier,
    plan: targetPlan,
    message: `Successfully upgraded to ${targetPlan.name}!`,
  });
}

export async function PATCH(req: NextRequest) {
  const session = await getAlumniSession();
  if (!session) return fail(401, "Authentication required");

  const body = await req.json().catch(() => null);
  if (!body) return fail(400, "Invalid JSON body");

  const parsed = toggleAutoRenewSchema.safeParse(body);
  if (!parsed.success) {
    return fail(400, "Validation failed", { issues: parsed.error.flatten() });
  }

  const updatedUser = await db.alumniUser.update({
    where: { id: session.sub },
    data: {
      subscriptionAutoRenew: parsed.data.autoRenew,
      subscriptionUpdatedAt: new Date(),
    },
  });

  return ok({
    autoRenew: updatedUser.subscriptionAutoRenew,
    message: `Auto-renew ${updatedUser.subscriptionAutoRenew ? "enabled" : "disabled"} successfully`,
  });
}
