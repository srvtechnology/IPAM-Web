import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth/permissions";
import { writeAuditLog, requestMeta } from "@/lib/audit";
import { createBusinessSchema } from "@/lib/validation/businesses";
import { ok, fail } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  const gate = await requirePermission(req, "COMMERCIAL", "canRead");
  if (gate instanceof NextResponse) return gate;

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const q = searchParams.get("q")?.trim();

  const whereClause: Record<string, unknown> = {};

  if (status && status !== "ALL") {
    whereClause.status = status;
  }

  if (q) {
    whereClause.OR = [
      { name: { contains: q } },
      { founders: { contains: q } },
      { industry: { contains: q } },
      { category: { contains: q } },
      { location: { contains: q } },
      { contactEmail: { contains: q } },
    ];
  }

  const [businesses, totalCount, pendingCount, approvedCount, rejectedCount] = await Promise.all([
    db.alumniBusiness.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            email: true,
            studentId: true,
            profile: {
              select: {
                name: true,
                avatar: true,
                company: true,
              },
            },
          },
        },
      },
      orderBy: [{ createdAt: "desc" }],
    }),
    db.alumniBusiness.count(),
    db.alumniBusiness.count({ where: { status: "PENDING_APPROVAL" } }),
    db.alumniBusiness.count({ where: { status: "APPROVED" } }),
    db.alumniBusiness.count({ where: { status: "REJECTED" } }),
  ]);

  return ok({
    businesses,
    counts: {
      total: totalCount,
      pending: pendingCount,
      approved: approvedCount,
      rejected: rejectedCount,
    },
  });
}

export async function POST(req: NextRequest) {
  const gate = await requirePermission(req, "COMMERCIAL", "canWrite");
  if (gate instanceof NextResponse) return gate;
  const { admin } = gate;

  const roleName =
    (await db.adminRoleDefinition.findUnique({
      where: { id: admin.roleId },
      select: { name: true },
    }))?.name ?? "Admin";

  const body = await req.json().catch(() => null);
  if (!body) return fail(400, "Invalid JSON body");
  const parsed = createBusinessSchema.safeParse(body);
  if (!parsed.success) {
    return fail(400, "Validation failed", { issues: parsed.error.flatten() });
  }

  // Admin added business doesn't need approval -> automatically APPROVED
  const business = await db.alumniBusiness.create({
    data: {
      ...parsed.data,
      services: parsed.data.services ?? undefined,
      keyProducts: parsed.data.keyProducts ?? undefined,
      certifications: parsed.data.certifications ?? undefined,
      status: "APPROVED",
      submittedByType: "ADMIN",
      userId: null,
      featured: parsed.data.featured ?? false,
    },
  });

  const { ipAddress, location, deviceInfo } = requestMeta(req);
  await writeAuditLog({
    actorAdminId: admin.id,
    actorName: admin.name,
    actorEmail: admin.email,
    actorRole: roleName,
    action: "ALUMNI_BUSINESS_CREATED",
    actionLabel: "Admin Added Alumni Enterprise",
    category: "COMMERCIAL_FINANCE",
    target: `Business: ${business.name} (${business.id})`,
    targetType: "Alumni Business",
    status: "SUCCESS",
    severity: "INFO",
    ipAddress,
    location,
    deviceInfo,
    details: `Admin published alumni business "${business.name}" immediately without pending approval stage.`,
  });

  return ok(business, 201);
}
