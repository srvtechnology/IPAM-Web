import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth/permissions";
import { writeAuditLog, requestMeta } from "@/lib/audit";
import { createBannerSchema } from "@/lib/validation/banners";
import { ok, fail } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  const gate = await requirePermission(req, "COMMERCIAL", "canRead");
  if (gate instanceof NextResponse) return gate;

  const banners = await db.sponsorBanner.findMany({ orderBy: { name: "asc" } });
  return ok(banners);
}

export async function POST(req: NextRequest) {
  const gate = await requirePermission(req, "COMMERCIAL", "canWrite");
  if (gate instanceof NextResponse) return gate;
  const { admin } = gate;
  const roleName = (await db.adminRoleDefinition.findUnique({ where: { id: admin.roleId }, select: { name: true } }))?.name ?? "Admin";

  const body = await req.json().catch(() => null);
  if (!body) return fail(400, "Invalid JSON body");
  const parsed = createBannerSchema.safeParse(body);
  if (!parsed.success) return fail(400, "Validation failed", { issues: parsed.error.flatten() });

  const banner = await db.sponsorBanner.create({ data: parsed.data }).catch((e) => {
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
    details: `New sponsor banner "${banner.name}" created for slot ${banner.slot} at ${banner.monthlyFee}/mo.`,
    afterState: { active: banner.active, monthlyFee: banner.monthlyFee.toString() },
  });

  return ok(banner, 201);
}
