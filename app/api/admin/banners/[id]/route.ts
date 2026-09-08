import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth/permissions";
import { updateBannerSchema } from "@/lib/validation/banners";
import { ok, fail } from "@/lib/api-response";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const gate = await requirePermission(req, "COMMERCIAL", "canRead");
  if (gate instanceof NextResponse) return gate;

  const { id } = await params;
  const banner = await db.sponsorBanner.findUnique({ where: { id } });
  if (!banner) return fail(404, "Banner not found");
  return ok(banner);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const gate = await requirePermission(req, "COMMERCIAL", "canWrite");
  if (gate instanceof NextResponse) return gate;

  const { id } = await params;
  const body = await req.json().catch(() => null);
  if (!body) return fail(400, "Invalid JSON body");
  const parsed = updateBannerSchema.safeParse(body);
  if (!parsed.success) return fail(400, "Validation failed", { issues: parsed.error.flatten() });

  const banner = await db.sponsorBanner.update({ where: { id }, data: parsed.data }).catch(() => null);
  if (!banner) return fail(404, "Banner not found");
  return ok(banner);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const gate = await requirePermission(req, "COMMERCIAL", "canDelete");
  if (gate instanceof NextResponse) return gate;

  const { id } = await params;
  await db.sponsorBanner.delete({ where: { id } }).catch(() => null);
  return ok({ deleted: true });
}
