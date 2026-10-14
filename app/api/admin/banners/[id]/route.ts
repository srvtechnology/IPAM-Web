import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth/permissions";
import { updateBannerSchema } from "@/lib/validation/banners";
import { ok, fail } from "@/lib/api-response";
import { writeAuditLog, requestMeta } from "@/lib/audit";
import { parseBannerRecord, serializeBannerNotes } from "@/lib/commercial-banners";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const gate = await requirePermission(req, "COMMERCIAL", "canRead");
  if (gate instanceof NextResponse) return gate;

  const { id } = await params;
  const banner = await db.sponsorBanner.findUnique({ where: { id } });
  if (!banner) return fail(404, "Banner not found");
  return ok(parseBannerRecord(banner));
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const gate = await requirePermission(req, "COMMERCIAL", "canWrite");
  if (gate instanceof NextResponse) return gate;
  const { admin } = gate;
  const roleName =
    (await db.adminRoleDefinition.findUnique({ where: { id: admin.roleId }, select: { name: true } }))?.name ??
    "Admin";

  const { id } = await params;
  const body = await req.json().catch(() => null);
  if (!body) return fail(400, "Invalid JSON body");
  const parsed = updateBannerSchema.safeParse(body);
  if (!parsed.success) return fail(400, "Validation failed", { issues: parsed.error.flatten() });

  const existing = await db.sponsorBanner.findUnique({ where: { id } });
  if (!existing) return fail(404, "Banner not found");

  const existingParsed = parseBannerRecord(existing);

  const {
    headline,
    description,
    badge,
    ctaText,
    pages,
    order,
    slot,
    code,
    name,
    contract,
    monthlyFee,
    subscriptionCadence,
    scheduleStatus,
    startDate,
    endDate,
    bannerImageUrl,
    targetUrl,
    industry,
    dimensions,
    active,
    contactName,
    contactEmail,
    contactPhone,
    contactTitle,
    contactAddress,
    contactTaxId,
    invoiceNumber,
    invoiceDate,
    invoiceDueDate,
    invoiceStatus,
    autoRenew,
    notes,
  } = parsed.data;

  // Compute updated pages and slot
  let finalPages = pages !== undefined ? pages : existingParsed.pages;
  let finalSlot = slot !== undefined ? slot : (finalPages.length > 0 ? finalPages.join(",") : existing.slot);
  if (pages !== undefined && pages.length > 0) {
    finalSlot = pages.join(",");
  }

  // Update notes JSON
  const updatedHeadline = headline !== undefined ? headline : existingParsed.headline;
  const updatedDesc = description !== undefined ? description : (notes !== undefined ? notes : existingParsed.description);
  const updatedBadge = badge !== undefined ? badge : existingParsed.badge;
  const updatedCtaText = ctaText !== undefined ? ctaText : existingParsed.ctaText;
  const updatedOrder = order !== undefined ? order : existingParsed.order;

  const notesJson = serializeBannerNotes({
    headline: updatedHeadline,
    description: updatedDesc,
    badge: updatedBadge,
    ctaText: updatedCtaText,
    order: updatedOrder,
    pages: finalPages,
  });

  const updated = await db.sponsorBanner
    .update({
      where: { id },
      data: {
        ...(code !== undefined && { code }),
        ...(name !== undefined && { name }),
        slot: finalSlot,
        ...(contract !== undefined && { contract }),
        ...(monthlyFee !== undefined && { monthlyFee }),
        ...(subscriptionCadence !== undefined && { subscriptionCadence }),
        ...(scheduleStatus !== undefined && { scheduleStatus }),
        ...(startDate !== undefined && { startDate }),
        ...(endDate !== undefined && { endDate }),
        ...(bannerImageUrl !== undefined && { bannerImageUrl }),
        ...(targetUrl !== undefined && { targetUrl }),
        ...(industry !== undefined && { industry }),
        ...(dimensions !== undefined && { dimensions }),
        ...(active !== undefined && { active }),
        ...(contactName !== undefined && { contactName }),
        ...(contactEmail !== undefined && { contactEmail }),
        ...(contactPhone !== undefined && { contactPhone }),
        ...(contactTitle !== undefined && { contactTitle }),
        ...(contactAddress !== undefined && { contactAddress }),
        ...(contactTaxId !== undefined && { contactTaxId }),
        ...(invoiceNumber !== undefined && { invoiceNumber }),
        ...(invoiceDate !== undefined && { invoiceDate }),
        ...(invoiceDueDate !== undefined && { invoiceDueDate }),
        ...(invoiceStatus !== undefined && { invoiceStatus }),
        ...(autoRenew !== undefined && { autoRenew }),
        notes: notesJson,
      },
    })
    .catch((e) => {
      console.error("Error updating banner:", e);
      return null;
    });

  if (!updated) return fail(404, "Banner update failed");

  const { ipAddress, location, deviceInfo } = requestMeta(req);
  await writeAuditLog({
    actorAdminId: admin.id,
    actorName: admin.name,
    actorEmail: admin.email,
    actorRole: roleName,
    action: "SPONSOR_BANNER_UPDATED",
    actionLabel: "Commercial Banner Updated",
    category: "COMMERCIAL_FINANCE",
    target: `Banner: ${updated.name} (${updated.code})`,
    targetType: "Sponsor Banner",
    status: "SUCCESS",
    severity: "INFO",
    ipAddress,
    location,
    deviceInfo,
    details: `Commercial banner "${updated.name}" updated. Placement: [${finalSlot}], Active: ${updated.active}.`,
    beforeState: { slot: existing.slot, active: existing.active } as any,
    afterState: { slot: updated.slot, active: updated.active } as any,
  });

  return ok(parseBannerRecord(updated));
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const gate = await requirePermission(req, "COMMERCIAL", "canDelete");
  if (gate instanceof NextResponse) return gate;
  const { admin } = gate;
  const roleName =
    (await db.adminRoleDefinition.findUnique({ where: { id: admin.roleId }, select: { name: true } }))?.name ??
    "Admin";

  const { id } = await params;
  const existing = await db.sponsorBanner.findUnique({ where: { id } });
  if (!existing) return fail(404, "Banner not found");

  await db.sponsorBanner.delete({ where: { id } }).catch(() => null);

  const { ipAddress, location, deviceInfo } = requestMeta(req);
  await writeAuditLog({
    actorAdminId: admin.id,
    actorName: admin.name,
    actorEmail: admin.email,
    actorRole: roleName,
    action: "SPONSOR_BANNER_DELETED",
    actionLabel: "Commercial Banner Deleted",
    category: "COMMERCIAL_FINANCE",
    target: `Banner: ${existing.name} (${existing.code})`,
    targetType: "Sponsor Banner",
    status: "SUCCESS",
    severity: "WARNING",
    ipAddress,
    location,
    deviceInfo,
    details: `Commercial banner "${existing.name}" (${existing.code}) was deleted by administrator.`,
    beforeState: { id: existing.id, code: existing.code, name: existing.name } as any,
  });

  return ok({ deleted: true, id });
}
