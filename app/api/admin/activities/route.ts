import { type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getAdminSession } from "@/lib/auth/session";
import { ok, fail } from "@/lib/api-response";
import { createActivitySchema, normalizeActivityPhotos } from "@/lib/validation/activities";
import { writeAuditLog, requestMeta } from "@/lib/audit";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: NextRequest) {
  const session = await getAdminSession(req);
  if (!session) return fail(401, "Unauthorized");

  const activities = await db.alumniActivity.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
  });

  return ok(
    activities.map((a) => ({
      id: a.id,
      title: a.title,
      description: a.description,
      status: a.status,
      displayDate: a.displayDate,
      location: a.location,
      category: a.category,
      photos: normalizeActivityPhotos(a.photos),
      featured: a.featured,
      sortOrder: a.sortOrder,
      createdAt: a.createdAt.toISOString(),
      updatedAt: a.updatedAt.toISOString(),
    }))
  );
}

export async function POST(req: NextRequest) {
  const session = await getAdminSession(req);
  if (!session) return fail(401, "Unauthorized");

  const body = await req.json().catch(() => null);
  if (!body) return fail(400, "Invalid JSON body");

  const parsed = createActivitySchema.safeParse(body);
  if (!parsed.success) {
    return fail(400, "Validation failed", { issues: parsed.error.flatten() });
  }

  const created = await db.alumniActivity.create({
    data: {
      title: parsed.data.title,
      description: parsed.data.description,
      status: parsed.data.status,
      displayDate: parsed.data.displayDate || null,
      location: parsed.data.location || null,
      category: parsed.data.category || null,
      photos: parsed.data.photos,
      featured: parsed.data.featured ?? false,
      sortOrder: parsed.data.sortOrder ?? 0,
    },
  });

  try {
    const adminUser = await db.adminUser.findUnique({
      where: { id: session.sub },
      include: { role: true },
    });
    const { ipAddress, location, deviceInfo } = requestMeta(req);
    await writeAuditLog({
      actorAdminId: session.sub,
      actorName: adminUser?.name ?? "Admin",
      actorEmail: session.email,
      actorRole: adminUser?.role?.name ?? "Admin",
      action: "ACTIVITY_CREATED",
      actionLabel: "Activity Gallery Created",
      category: "SYSTEM_CORE",
      target: `Activity: ${created.title} (${created.id})`,
      targetType: "AlumniActivity",
      status: "SUCCESS",
      severity: "INFO",
      ipAddress,
      location,
      deviceInfo,
      details: `Created ${created.status} activity "${created.title}" with ${parsed.data.photos.length} photo(s).`,
      afterState: {
        id: created.id,
        title: created.title,
        status: created.status,
        photosCount: parsed.data.photos.length,
      },
    });
  } catch (err) {
    console.error("Failed to write audit log for activity create:", err);
  }

  return ok(
    {
      ...created,
      photos: normalizeActivityPhotos(created.photos),
      createdAt: created.createdAt.toISOString(),
      updatedAt: created.updatedAt.toISOString(),
    },
    201
  );
}
