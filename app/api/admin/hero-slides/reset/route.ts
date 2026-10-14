import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth/permissions";
import { DEFAULT_HERO_SLIDES, saveHeroSlides } from "@/lib/hero-slides";
import { writeAuditLog, requestMeta } from "@/lib/audit";
import { ok } from "@/lib/api-response";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const gate = await requirePermission(req, "SYSTEM_SETTINGS", "canWrite");
  if (gate instanceof NextResponse) return gate;
  const { admin } = gate;

  const resetSlides = DEFAULT_HERO_SLIDES.map((s, idx) => ({
    ...s,
    order: idx + 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }));

  await saveHeroSlides(resetSlides);

  const admin2 = await db.adminUser.findUnique({ where: { id: admin.id }, include: { role: true } });
  const { ipAddress, location, deviceInfo } = requestMeta(req);
  await writeAuditLog({
    actorAdminId: admin.id,
    actorName: admin2?.name ?? admin.name,
    actorEmail: admin2?.email ?? admin.email,
    actorRole: admin2?.role.name ?? "Admin",
    action: "HERO_SLIDES_RESET",
    actionLabel: "Home Hero Slides Reset to Defaults",
    category: "SYSTEM_CORE",
    target: "Hero Carousel Slides",
    targetType: "Hero Slides",
    status: "SUCCESS",
    severity: "WARNING",
    ipAddress,
    location,
    deviceInfo,
    details: "Reset home hero carousel to default institutional slide configuration.",
  });

  return ok(resetSlides);
}
