import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth/permissions";
import { getAllAdminHeroSlides, saveHeroSlides, type HeroSlide } from "@/lib/hero-slides";
import { heroSlideSchema } from "@/lib/validation/hero-carousel";
import { writeAuditLog, requestMeta } from "@/lib/audit";
import { ok, fail } from "@/lib/api-response";
import { randomUUID } from "crypto";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const gate = await requirePermission(req, "SYSTEM_SETTINGS", "canRead");
  if (gate instanceof NextResponse) return gate;

  const slides = await getAllAdminHeroSlides();
  return ok(slides);
}

export async function POST(req: NextRequest) {
  const gate = await requirePermission(req, "SYSTEM_SETTINGS", "canWrite");
  if (gate instanceof NextResponse) return gate;
  const { admin } = gate;

  const body = await req.json().catch(() => null);
  if (!body) return fail(400, "Invalid JSON body");

  const parsed = heroSlideSchema.safeParse(body);
  if (!parsed.success) {
    return fail(400, "Validation failed", { issues: parsed.error.flatten() });
  }

  const existingSlides = await getAllAdminHeroSlides();
  const maxOrder = existingSlides.reduce((max, s) => Math.max(max, s.order ?? 0), 0);

  const newSlide: HeroSlide = {
    id: `slide-${randomUUID().slice(0, 8)}`,
    ...parsed.data,
    order: parsed.data.order || maxOrder + 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const updatedSlides = [...existingSlides, newSlide];
  await saveHeroSlides(updatedSlides);

  const admin2 = await db.adminUser.findUnique({ where: { id: admin.id }, include: { role: true } });
  const { ipAddress, location, deviceInfo } = requestMeta(req);
  await writeAuditLog({
    actorAdminId: admin.id,
    actorName: admin2?.name ?? admin.name,
    actorEmail: admin2?.email ?? admin.email,
    actorRole: admin2?.role.name ?? "Admin",
    action: "HERO_SLIDE_CREATED",
    actionLabel: "Home Hero Slide Created",
    category: "SYSTEM_CORE",
    target: `Slide: ${newSlide.title}`,
    targetType: "Hero Slide",
    status: "SUCCESS",
    severity: "INFO",
    ipAddress,
    location,
    deviceInfo,
    details: `Added new hero carousel slide "${newSlide.title}" with order ${newSlide.order}.`,
    afterState: newSlide as any,
  });

  return ok(newSlide, 201);
}
