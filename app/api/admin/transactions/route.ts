import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth/permissions";
import { ok } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  const gate = await requirePermission(req, "FINANCE", "canRead");
  if (gate instanceof NextResponse) return gate;

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");

  const transactions = await db.transaction.findMany({
    where: status ? { status: status as "SETTLED" | "PENDING" | "RECONCILED" } : undefined,
    orderBy: { date: "desc" },
    include: { donation: true },
  });
  return ok(transactions);
}
