import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth/permissions";
import { ok, fail } from "@/lib/api-response";
import { writeAuditLog, requestMeta } from "@/lib/audit";
import { grantSubscriptionSchema } from "@/lib/validation/admin-subscription";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const gate = await requirePermission(req, "FINANCE", "canWrite");
  if (gate instanceof NextResponse) return gate;
  const { admin } = gate;

  const body = await req.json().catch(() => null);
  if (!body) return fail(400, "Invalid JSON body");

  const parsed = grantSubscriptionSchema.safeParse(body);
  if (!parsed.success) {
    return fail(400, "Validation failed", { issues: parsed.error.flatten() });
  }

  const { userId, tier, billingCycle, validUntil, notes } = parsed.data;

  const targetUser = await db.alumniUser.findUnique({
    where: { id: userId },
    include: { profile: true },
  });
  if (!targetUser) return fail(404, "Alumni user not found");

  const ref = `ADMIN-GRANT-${tier.substring(0, 3)}-${Date.now()}`;
  const validUntilDate = validUntil ? new Date(validUntil) : null;

  const [updatedUser, newSub] = await db.$transaction([
    db.alumniUser.update({
      where: { id: userId },
      data: {
        membershipTier: tier as never,
        subscriptionBillingCycle: billingCycle,
        membershipValidUntil: validUntilDate,
        subscriptionAutoRenew: billingCycle !== "LIFETIME",
        subscriptionUpdatedAt: new Date(),
      },
      include: { profile: true },
    }),
    db.membershipSubscription.create({
      data: {
        userId,
        tier: tier as never,
        billingCycle,
        amountPaid: 0,
        currency: "USD",
        status: "ACTIVE",
        paymentMethod: "COMPLIMENTARY",
        paymentReference: ref,
        autoRenew: billingCycle !== "LIFETIME",
        validUntil: validUntilDate,
      },
    }),
  ]);

  const roleName = (await db.adminRoleDefinition.findUnique({
    where: { id: admin.roleId },
    select: { name: true },
  }))?.name ?? "Admin";

  const { ipAddress, location, deviceInfo } = requestMeta(req);
  await writeAuditLog({
    actorAdminId: admin.id,
    actorName: admin.name,
    actorEmail: admin.email,
    actorRole: roleName,
    action: "MEMBERSHIP_TIER_GRANTED",
    actionLabel: "Alumni Membership Granted by Admin",
    category: "COMMERCIAL_FINANCE",
    target: targetUser.email,
    targetType: "AlumniUser",
    status: "SUCCESS",
    severity: "INFO",
    ipAddress,
    location,
    deviceInfo,
    details: `Granted ${tier} (${billingCycle}) to ${targetUser.profile?.name || targetUser.email}. Notes: ${notes || "None"}`,
    afterState: { tier, billingCycle, validUntil: validUntilDate?.toISOString() || null },
  });

  return ok({
    user: updatedUser,
    subscription: newSub,
    message: `Successfully granted ${tier.replace(/_/g, " ")} to ${targetUser.profile?.name || targetUser.email}!`,
  });
}
