import { NextResponse, type NextRequest } from "next/server";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth/permissions";
import { getPhysicalCardPricing, SETTING_KEY_CARD_PRICING, DEFAULT_CARD_PRICING } from "@/lib/card-pricing";
import { updatePhysicalCardPricingSchema } from "@/lib/validation/physical-card-orders";
import { writeAuditLog, requestMeta } from "@/lib/audit";
import { ok, fail } from "@/lib/api-response";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: NextRequest) {
  // Allow admins with ID_CARDS or SYSTEM_SETTINGS read permission
  const idGate = await requirePermission(req, "ID_CARDS", "canRead");
  const sysGate = await requirePermission(req, "SYSTEM_SETTINGS", "canRead");
  if (idGate instanceof NextResponse && sysGate instanceof NextResponse) {
    return idGate;
  }

  const pricing = await getPhysicalCardPricing();
  return ok(pricing);
}

export async function PUT(req: NextRequest) {
  return handleUpdate(req);
}

export async function PATCH(req: NextRequest) {
  return handleUpdate(req);
}

async function handleUpdate(req: NextRequest) {
  // Allow admins with ID_CARDS or SYSTEM_SETTINGS write permission
  const idGate = await requirePermission(req, "ID_CARDS", "canWrite");
  const sysGate = await requirePermission(req, "SYSTEM_SETTINGS", "canWrite");
  let admin = null;
  if (!(idGate instanceof NextResponse)) {
    admin = idGate.admin;
  } else if (!(sysGate instanceof NextResponse)) {
    admin = sysGate.admin;
  } else {
    return idGate;
  }

  const body = await req.json().catch(() => null);
  if (!body) return fail(400, "Invalid JSON body");

  const currentPricing = await getPhysicalCardPricing();
  const mergedPayload = {
    currency: body.currency ?? currentPricing.currency,
    shippingFee: typeof body.shippingFee === "number" ? body.shippingFee : currentPricing.shippingFee,
    codEnabled: typeof body.codEnabled === "boolean" ? body.codEnabled : currentPricing.codEnabled,
    stripeEnabled: typeof body.stripeEnabled === "boolean" ? body.stripeEnabled : currentPricing.stripeEnabled,
    tiers: {
      STANDARD_PVC: {
        ...currentPricing.tiers.STANDARD_PVC,
        ...(body.tiers?.STANDARD_PVC || {}),
      },
      GOLD_RFID_SMART: {
        ...currentPricing.tiers.GOLD_RFID_SMART,
        ...(body.tiers?.GOLD_RFID_SMART || {}),
      },
      EXECUTIVE_TITANIUM: {
        ...currentPricing.tiers.EXECUTIVE_TITANIUM,
        ...(body.tiers?.EXECUTIVE_TITANIUM || {}),
      },
    },
  };

  const parsed = updatePhysicalCardPricingSchema.safeParse(mergedPayload);
  if (!parsed.success) return fail(400, "Validation failed", { issues: parsed.error.flatten() });

  const before = await db.systemSetting.findUnique({ where: { key: SETTING_KEY_CARD_PRICING } });

  const updatedSetting = await db.systemSetting.upsert({
    where: { key: SETTING_KEY_CARD_PRICING },
    create: { key: SETTING_KEY_CARD_PRICING, value: parsed.data },
    update: { value: parsed.data },
  });

  const admin2 = await db.adminUser.findUnique({ where: { id: admin.id }, include: { role: true } });
  const { ipAddress, location, deviceInfo } = requestMeta(req);
  await writeAuditLog({
    actorAdminId: admin.id,
    actorName: admin2?.name ?? admin.name,
    actorEmail: admin2?.email ?? admin.email,
    actorRole: admin2?.role.name ?? "Admin",
    action: "CARD_PRICING_UPDATED",
    actionLabel: "Physical Card Pricing Updated",
    category: "SMART_ID_BUREAU",
    target: "Physical ID Card Pricing",
    targetType: "System Setting",
    status: "SUCCESS",
    severity: "INFO",
    ipAddress,
    location,
    deviceInfo,
    details: `Updated physical card tier pricing: PVC $${parsed.data.tiers.STANDARD_PVC.price}, Gold $${parsed.data.tiers.GOLD_RFID_SMART.price}, Titanium $${parsed.data.tiers.EXECUTIVE_TITANIUM.price} (${parsed.data.currency}). COD: ${parsed.data.codEnabled}, Stripe: ${parsed.data.stripeEnabled}.`,
    beforeState: (before?.value as Prisma.InputJsonValue) ?? (DEFAULT_CARD_PRICING as unknown as Prisma.InputJsonValue),
    afterState: parsed.data as unknown as Prisma.InputJsonValue,
  });

  return ok(updatedSetting.value);
}
