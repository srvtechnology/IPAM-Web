import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth/permissions";
import { ok, fail } from "@/lib/api-response";
import { writeAuditLog, requestMeta } from "@/lib/audit";
import { updateTierConfigSchema } from "@/lib/validation/admin-subscription";
import { type MembershipTierKey } from "@/lib/subscription-pricing";

export const dynamic = "force-dynamic";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ tier: string }> }
) {
  const gate = await requirePermission(req, "FINANCE", "canWrite");
  if (gate instanceof NextResponse) return gate;
  const { admin } = gate;

  const { tier } = await params;
  const validTiers = ["STANDARD", "SILVER_LIFETIME", "GOLD_PATRON"];
  if (!validTiers.includes(tier)) {
    return fail(400, "Invalid tier key");
  }

  const body = await req.json().catch(() => null);
  if (!body) return fail(400, "Invalid JSON body");

  const parsed = updateTierConfigSchema.safeParse(body);
  if (!parsed.success) {
    return fail(400, "Validation failed", { issues: parsed.error.flatten() });
  }

  const {
    name,
    tagline,
    description,
    badgeText,
    isFree,
    annualPrice,
    lifetimePrice,
    monthlyPrice,
    currency,
    isActive,
    sortOrder,
    perks,
    accentColor,
  } = parsed.data;

  const updatedConfig = await db.subscriptionTierConfig.upsert({
    where: { tier: tier as never },
    update: {
      name,
      tagline,
      description,
      badgeText: badgeText || null,
      isFree,
      annualPrice,
      lifetimePrice,
      monthlyPrice,
      currency,
      isActive,
      sortOrder,
      perks,
      accentColor,
    },
    create: {
      tier: tier as never,
      name,
      tagline,
      description,
      badgeText: badgeText || null,
      isFree,
      annualPrice,
      lifetimePrice,
      monthlyPrice,
      currency,
      isActive,
      sortOrder,
      perks,
      accentColor,
    },
  });

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
    action: "SUBSCRIPTION_PLAN_UPDATED",
    actionLabel: "Subscription Plan Updated",
    category: "COMMERCIAL_FINANCE",
    target: tier,
    targetType: "SubscriptionTierConfig",
    status: "SUCCESS",
    severity: "INFO",
    ipAddress,
    location,
    deviceInfo,
    details: `Updated subscription plan ${tier}: ${name}, Annual: $${annualPrice}, Lifetime: $${lifetimePrice}`,
    afterState: { tier, name, annualPrice, lifetimePrice, isActive },
  });

  return ok(updatedConfig);
}
