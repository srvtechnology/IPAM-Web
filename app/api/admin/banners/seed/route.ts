import { NextResponse, type NextRequest } from "next/server";
import { requirePermission } from "@/lib/auth/permissions";
import { seedDefaultBannersIfEmpty, DEFAULT_COMMERCIAL_BANNERS_DATA, serializeBannerNotes, parseBannerRecord } from "@/lib/commercial-banners";
import { db } from "@/lib/db";
import { ok, fail } from "@/lib/api-response";
import { writeAuditLog, requestMeta } from "@/lib/audit";

export async function POST(req: NextRequest) {
  const gate = await requirePermission(req, "COMMERCIAL", "canWrite");
  if (gate instanceof NextResponse) return gate;
  const { admin } = gate;
  const roleName =
    (await db.adminRoleDefinition.findUnique({ where: { id: admin.roleId }, select: { name: true } }))?.name ??
    "Admin";

  const url = new URL(req.url);
  const force = url.searchParams.get("force") === "true";

  if (force) {
    // Delete existing banners
    await db.sponsorBanner.deleteMany({});
  }

  for (const item of DEFAULT_COMMERCIAL_BANNERS_DATA) {
    const notesJson = serializeBannerNotes({
      headline: item.headline,
      description: item.description,
      badge: item.badge,
      ctaText: item.ctaText,
      order: item.order,
      pages: item.pages,
    });

    await db.sponsorBanner.upsert({
      where: { code: item.code },
      update: {
        name: item.name,
        slot: item.pages.join(","),
        contract: item.contract,
        monthlyFee: item.monthlyFee,
        active: item.active,
        bannerImageUrl: item.bannerImageUrl,
        targetUrl: item.targetUrl,
        industry: item.industry,
        contactName: item.contactName,
        contactEmail: item.contactEmail,
        notes: notesJson,
      },
      create: {
        code: item.code,
        name: item.name,
        slot: item.pages.join(","),
        contract: item.contract,
        monthlyFee: item.monthlyFee,
        active: item.active,
        bannerImageUrl: item.bannerImageUrl,
        targetUrl: item.targetUrl,
        industry: item.industry,
        contactName: item.contactName,
        contactEmail: item.contactEmail,
        notes: notesJson,
      },
    }).catch((e) => {
      console.error("Upsert banner error:", e);
    });
  }

  const all = await db.sponsorBanner.findMany({ orderBy: { name: "asc" } });

  const { ipAddress, location, deviceInfo } = requestMeta(req);
  await writeAuditLog({
    actorAdminId: admin.id,
    actorName: admin.name,
    actorEmail: admin.email,
    actorRole: roleName,
    action: "SPONSOR_BANNERS_SEEDED",
    actionLabel: "Default Commercial Banners Seeded",
    category: "COMMERCIAL_FINANCE",
    target: "Sponsor Banners Catalog",
    targetType: "Commercial Banners",
    status: "SUCCESS",
    severity: "INFO",
    ipAddress,
    location,
    deviceInfo,
    details: `Seeded ${DEFAULT_COMMERCIAL_BANNERS_DATA.length} default commercial banners across all pages.`,
  });

  return ok(all.map(parseBannerRecord));
}
