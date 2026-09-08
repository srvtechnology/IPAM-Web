import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth/permissions";
import { ok } from "@/lib/api-response";

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const gate = await requirePermission(req, "BROADCAST", "canDelete");
  if (gate instanceof NextResponse) return gate;

  const { id } = await params;
  await db.targetAudienceGroup.delete({ where: { id } }).catch(() => null);
  return ok({ deleted: true });
}
