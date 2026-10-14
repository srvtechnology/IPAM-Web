import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth/permissions";
import { getAllAdminHeroSlides, saveHeroSlides } from "@/lib/hero-slides";
import { reorderHeroSlidesSchema } from "@/lib/validation/hero-carousel";
import { writeAuditLog, requestMeta } from "@/lib/audit";
import { ok, fail } from "@/lib/api-response";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const gate = await requirePermission(req, "SYSTEM_SETTINGS", "canWrite");
  if (gate instanceof NextResponse) return gate;
  const { admin } = gate;

  const body = await req.json().catch(() => null);
  if (!body) return fail(400, "Invalid JSON body");

  const parsed = reorderHeroSlidesSchema.safeParse(body);
  if (!parsed.success) {
    return fail(400, "Validation failed", { issues: parsed.error.flatten() });
  }

  const slides = await getAllAdminHeroSlides();
  const slideMap = new Map(slides.map((s) => [s.id, s]));

  const reordered: typeof slides = [];
  parsed.data.slideIds.forEach((id, idx) => {
    const slide = slideMap.get(id);
    if (slide) {
      reordered.push({
        ...slide,
        order: idx + 1,
        updatedAt: new Date().toISOString(),
      });
      slideMap.delete(id);
    }
  });

  // Append any remaining slides that weren't in the id list
  let nextOrder = reordered.length + 1;
  slideMap.forEach((slide) => {
    reordered.push({
      ...slide,
      order: nextOrder++,
      updatedAt: new Date().toISOString(),
    });
  });

  await saveHeroSlides(reordered);

  const admin2 = await db.adminUser.findUnique({ where: { id: admin.id }, include: { role: true } });
  const { ipAddress, location, deviceInfo } = requestMeta(req);
  await writeAuditLog({
    actorAdminId: admin.id,
    actorName: admin2?.name ?? admin.name,
    actorEmail: admin2?.email ?? admin.email,
    actorRole: admin2?.role.name ?? "Admin",
    action: "HERO_SLIDES_REORDERED",
    actionLabel: "Home Hero Slides Reordered",
    category: "SYSTEM_CORE",
    target: "Hero Carousel Slides",
    targetType: "Hero Slides",
    status: "SUCCESS",
    severity: "INFO",
    ipAddress,
    location,
    deviceInfo,
    details: `Reordered ${reordered.length} hero carousel slides.`,
  });

  return ok(reordered);
}
