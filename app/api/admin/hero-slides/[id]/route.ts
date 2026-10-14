import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth/permissions";
import { getAllAdminHeroSlides, saveHeroSlides } from "@/lib/hero-slides";
import { updateHeroSlideSchema } from "@/lib/validation/hero-carousel";
import { writeAuditLog, requestMeta } from "@/lib/audit";
import { ok, fail } from "@/lib/api-response";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const gate = await requirePermission(req, "SYSTEM_SETTINGS", "canRead");
  if (gate instanceof NextResponse) return gate;

  const { id } = await params;
  const slides = await getAllAdminHeroSlides();
  const slide = slides.find((s) => s.id === id);
  if (!slide) return fail(404, "Slide not found");

  return ok(slide);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const gate = await requirePermission(req, "SYSTEM_SETTINGS", "canWrite");
  if (gate instanceof NextResponse) return gate;
  const { admin } = gate;

  const { id } = await params;
  const body = await req.json().catch(() => null);
  if (!body) return fail(400, "Invalid JSON body");

  const parsed = updateHeroSlideSchema.safeParse(body);
  if (!parsed.success) {
    return fail(400, "Validation failed", { issues: parsed.error.flatten() });
  }

  const slides = await getAllAdminHeroSlides();
  const index = slides.findIndex((s) => s.id === id);
  if (index === -1) return fail(404, "Slide not found");

  const before = slides[index];
  const updated = {
    ...before,
    ...parsed.data,
    updatedAt: new Date().toISOString(),
  };

  slides[index] = updated;
  await saveHeroSlides(slides);

  const admin2 = await db.adminUser.findUnique({ where: { id: admin.id }, include: { role: true } });
  const { ipAddress, location, deviceInfo } = requestMeta(req);
  await writeAuditLog({
    actorAdminId: admin.id,
    actorName: admin2?.name ?? admin.name,
    actorEmail: admin2?.email ?? admin.email,
    actorRole: admin2?.role.name ?? "Admin",
    action: "HERO_SLIDE_UPDATED",
    actionLabel: "Home Hero Slide Updated",
    category: "SYSTEM_CORE",
    target: `Slide: ${updated.title}`,
    targetType: "Hero Slide",
    status: "SUCCESS",
    severity: "INFO",
    ipAddress,
    location,
    deviceInfo,
    details: `Updated hero slide "${updated.title}" (ID: ${id}).`,
    beforeState: before as any,
    afterState: updated as any,
  });

  return ok(updated);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const gate = await requirePermission(req, "SYSTEM_SETTINGS", "canDelete");
  if (gate instanceof NextResponse) return gate;
  const { admin } = gate;

  const { id } = await params;
  const slides = await getAllAdminHeroSlides();
  const slide = slides.find((s) => s.id === id);
  if (!slide) return fail(404, "Slide not found");

  const remaining = slides.filter((s) => s.id !== id);
  await saveHeroSlides(remaining);

  const admin2 = await db.adminUser.findUnique({ where: { id: admin.id }, include: { role: true } });
  const { ipAddress, location, deviceInfo } = requestMeta(req);
  await writeAuditLog({
    actorAdminId: admin.id,
    actorName: admin2?.name ?? admin.name,
    actorEmail: admin2?.email ?? admin.email,
    actorRole: admin2?.role.name ?? "Admin",
    action: "HERO_SLIDE_DELETED",
    actionLabel: "Home Hero Slide Deleted",
    category: "SYSTEM_CORE",
    target: `Slide: ${slide.title}`,
    targetType: "Hero Slide",
    status: "SUCCESS",
    severity: "WARNING",
    ipAddress,
    location,
    deviceInfo,
    details: `Deleted hero slide "${slide.title}" (ID: ${id}).`,
    beforeState: slide as any,
  });

  return ok({ deleted: true, id });
}
