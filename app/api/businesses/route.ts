import type { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getAlumniSession, getAdminSession } from "@/lib/auth/session";
import { createBusinessSchema } from "@/lib/validation/businesses";
import { ok, fail } from "@/lib/api-response";
import { writeAuditLog, requestMeta } from "@/lib/audit";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mine = searchParams.get("mine") === "true";
  const featured = searchParams.get("featured");
  const category = searchParams.get("category");
  const q = searchParams.get("q")?.trim();

  if (mine) {
    const session = await getAlumniSession();
    if (!session) return fail(401, "You must be signed in to view your businesses");

    const businesses = await db.alumniBusiness.findMany({
      where: { userId: session.sub },
      orderBy: { createdAt: "desc" },
    });
    return ok(businesses);
  }

  const businesses = await db.alumniBusiness.findMany({
    where: {
      status: "APPROVED",
      ...(featured === "true" ? { featured: true } : {}),
      ...(category && category !== "All" ? { category } : {}),
      ...(q
        ? {
            OR: [
              { name: { contains: q } },
              { founders: { contains: q } },
              { industry: { contains: q } },
              { tagline: { contains: q } },
              { description: { contains: q } },
              { location: { contains: q } },
            ],
          }
        : {}),
    },
    orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
  });

  return ok(businesses);
}

export async function POST(req: NextRequest) {
  const adminSession = await getAdminSession();
  const alumniSession = await getAlumniSession();

  if (!adminSession && !alumniSession) {
    return fail(401, "You must be signed in to submit a business");
  }

  const body = await req.json().catch(() => null);
  if (!body) return fail(400, "Invalid JSON body");
  const parsed = createBusinessSchema.safeParse(body);
  if (!parsed.success) {
    return fail(400, "Validation failed", { issues: parsed.error.flatten() });
  }

  if (adminSession) {
    const roleName = (await db.adminRoleDefinition.findUnique({
      where: { id: adminSession.roleId },
      select: { name: true },
    }))?.name ?? "Admin";

    const business = await db.alumniBusiness.create({
      data: {
        ...parsed.data,
        services: parsed.data.services ?? undefined,
        keyProducts: parsed.data.keyProducts ?? undefined,
        certifications: parsed.data.certifications ?? undefined,
        status: "APPROVED", // Admin added business does not need approval
        submittedByType: "ADMIN",
        userId: null,
        featured: parsed.data.featured ?? false,
      },
    });

    const adminUser = await db.adminUser.findUnique({
      where: { id: adminSession.sub },
      select: { name: true },
    });
    const actorName = adminUser?.name ?? "Administrator";

    const { ipAddress, location, deviceInfo } = requestMeta(req);
    await writeAuditLog({
      actorAdminId: adminSession.sub,
      actorName,
      actorEmail: adminSession.email,
      actorRole: roleName,
      action: "ALUMNI_BUSINESS_CREATED",
      actionLabel: "Admin Created Alumni Business Listing",
      category: "COMMERCIAL_FINANCE",
      target: `Business: ${business.name} (${business.id})`,
      targetType: "Alumni Business",
      status: "SUCCESS",
      severity: "INFO",
      ipAddress,
      location,
      deviceInfo,
      details: `Admin published alumni business "${business.name}" directly without approval requirement.`,
    });

    return ok(business, 201);
  }

  // Alumni submitted listing -> requires admin approval
  const business = await db.alumniBusiness.create({
    data: {
      ...parsed.data,
      services: parsed.data.services ?? undefined,
      keyProducts: parsed.data.keyProducts ?? undefined,
      certifications: parsed.data.certifications ?? undefined,
      status: "PENDING_APPROVAL", // Alumni submission requires approval
      submittedByType: "ALUMNI",
      userId: alumniSession!.sub,
      featured: false,
    },
  });

  return ok(business, 201);
}
