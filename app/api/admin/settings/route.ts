import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth/permissions";
import { updateSettingsSchema } from "@/lib/validation/settings";
import { writeAuditLog, requestMeta } from "@/lib/audit";
import { ok, fail } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  const gate = await requirePermission(req, "SYSTEM_SETTINGS", "canRead");
  if (gate instanceof NextResponse) return gate;

  const rows = await db.systemSetting.findMany();
  const settings = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  return ok(settings);
}

export async function PUT(req: NextRequest) {
  const gate = await requirePermission(req, "SYSTEM_SETTINGS", "canWrite");
  if (gate instanceof NextResponse) return gate;
  const { admin } = gate;

  const body = await req.json().catch(() => null);
  if (!body) return fail(400, "Invalid JSON body");
  const parsed = updateSettingsSchema.safeParse(body);
  if (!parsed.success) return fail(400, "Validation failed", { issues: parsed.error.flatten() });

  const before = await db.systemSetting.findUnique({ where: { key: "default_theme" } });

  if (parsed.data.defaultTheme) {
    await db.systemSetting.upsert({
      where: { key: "default_theme" },
      create: { key: "default_theme", value: parsed.data.defaultTheme },
      update: { value: parsed.data.defaultTheme },
    });
  }

  const admin2 = await db.adminUser.findUnique({ where: { id: admin.id }, include: { role: true } });
  const { ipAddress, location, deviceInfo } = requestMeta(req);
  await writeAuditLog({
    actorAdminId: admin.id,
    actorName: admin2?.name ?? admin.name,
    actorEmail: admin2?.email ?? admin.email,
    actorRole: admin2?.role.name ?? "Admin",
    action: "SYSTEM_SETTINGS_UPDATED",
    actionLabel: "System Settings Updated",
    category: "SYSTEM_CORE",
    target: "System Settings",
    targetType: "System Setting",
    status: "SUCCESS",
    severity: "INFO",
    ipAddress,
    location,
    deviceInfo,
    details: `Updated org-wide default theme to "${parsed.data.defaultTheme}".`,
    beforeState: { defaultTheme: before?.value ?? null },
    afterState: { defaultTheme: parsed.data.defaultTheme ?? null },
  });

  const rows = await db.systemSetting.findMany();
  return ok(Object.fromEntries(rows.map((r) => [r.key, r.value])));
}
