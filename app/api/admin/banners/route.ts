import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth/permissions";
import { writeAuditLog, requestMeta } from "@/lib/audit";
import { createBannerSchema } from "@/lib/validation/banners";
import { ok, fail } from "@/lib/api-response";
import {
  parseBannerRecord,
  serializeBannerNotes,
  seedDefaultBannersIfEmpty,
} from "@/lib/commercial-banners";

export async function GET(req: NextRequest) {
  const gate = await requirePermission(req, "COMMERCIAL", "canRead");
  if (gate instanceof NextResponse) return gate;

  const url = new URL(req.url);
  const pageFilter = url.searchParams.get("page");
  const activeFilter = url.searchParams.get("active");

  const count = await db.sponsorBanner.count();
  if (count === 0) {
    await seedDefaultBannersIfEmpty();
  }

  const banners = await db.sponsorBanner.findMany({ orderBy: { name: "asc" } });
  let normalized = banners.map(parseBannerRecord);

  if (pageFilter && pageFilter !== "ALL") {
    normalized = normalized.filter(
      (b) => b.pages.includes("ALL") || b.pages.includes(pageFilter) || b.slot === pageFilter
    );
  }

  if (activeFilter === "true") {
    normalized = normalized.filter((b) => b.active);
  } else if (activeFilter === "false") {
    normalized = normalized.filter((b) => !b.active);
  }

  return ok(normalized);
}

export async function POST(req: NextRequest) {
  const gate = await requirePermission(req, "COMMERCIAL", "canWrite");
  if (gate instanceof NextResponse) return gate;
  const { admin } = gate;
  const roleName =
    (await db.adminRoleDefinition.findUnique({ where: { id: admin.roleId }, select: { name: true } }))?.name ??
    "Admin";

  const body = await req.json().catch(() => null);
  if (!body) return fail(400, "Invalid JSON body");
  const parsed = createBannerSchema.safeParse(body);
  if (!parsed.success) return fail(400, "Validation failed", { issues: parsed.error.flatten() });

  const {
    code,
    name,
    slot,
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
    headline,
    description,
    badge,
    ctaText,
    pages,
    order,
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

  // Generate unique code if not provided
  const bannerCode =
    code ||
    `BAN-${name.replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, 6) || "AD"}-${Date.now().toString(36).toUpperCase()}`;

  // Normalize pages and slot
  const targetPages = pages && pages.length > 0 ? pages : [slot];
  const finalSlot = targetPages.join(",");

  // Merge extra fields into notes JSON
  const notesJson = serializeBannerNotes({
    headline: headline || name,
    description: description || notes || "",
    badge: badge || industry || "Sponsored",
    ctaText: ctaText || "Learn More",
    order: typeof order === "number" ? order : 1,
    pages: targetPages,
  });

  const banner = await db.sponsorBanner
    .create({
      data: {
        code: bannerCode,
        name,
        slot: finalSlot,
        contract: contract || "IPAM-COMMERCIAL-2026",
        monthlyFee: monthlyFee ?? 150,
        subscriptionCadence: subscriptionCadence || "MONTHLY",
        scheduleStatus,
        startDate,
        endDate,
        bannerImageUrl: bannerImageUrl || "/images/sponsor_banking_banner.jpg",
        targetUrl: targetUrl || "#",
        industry: industry || badge || "Commercial",
        dimensions: dimensions || "RESPONSIVE_BANNER",
        active: active ?? true,
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
        autoRenew: autoRenew ?? false,
        notes: notesJson,
      },
    })
    .catch((e) => {
      if (e?.code === "P2002") return null;
      throw e;
    });

  if (!banner) return fail(409, "A banner with this code already exists");

  const { ipAddress, location, deviceInfo } = requestMeta(req);
  await writeAuditLog({
    actorAdminId: admin.id,
    actorName: admin.name,
    actorEmail: admin.email,
    actorRole: roleName,
    action: "SPONSOR_BANNER_CREATED",
    actionLabel: "Commercial Banner Created",
    category: "COMMERCIAL_FINANCE",
    target: `Banner: ${banner.name} (${banner.code})`,
    targetType: "Sponsor Banner",
    status: "SUCCESS",
    severity: "INFO",
    ipAddress,
    location,
    deviceInfo,
    details: `Commercial banner "${banner.name}" created for placement [${finalSlot}] at $${banner.monthlyFee}/mo.`,
    afterState: { id: banner.id, slot: banner.slot, active: banner.active } as any,
  });

  return ok(parseBannerRecord(banner), 201);
}
