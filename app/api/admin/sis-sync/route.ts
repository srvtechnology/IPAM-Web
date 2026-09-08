import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth/permissions";
import { ok } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  const gate = await requirePermission(req, "SIS_SYNC", "canRead");
  if (gate instanceof NextResponse) return gate;

  const logs = await db.sisSyncLog.findMany({ orderBy: { timestamp: "desc" }, take: 200 });
  return ok(logs);
}
