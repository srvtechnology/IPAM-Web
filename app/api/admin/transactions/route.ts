import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth/permissions";
import { ok } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  const gate = await requirePermission(req, "FINANCE", "canRead");
  if (gate instanceof NextResponse) return gate;

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const type = searchParams.get("type");
  const q = searchParams.get("q");

  const whereClause: Record<string, unknown> = {};

  if (status && status !== "ALL") {
    whereClause.status = status as "SETTLED" | "PENDING" | "RECONCILED";
  }

  if (type && type !== "ALL") {
    whereClause.tier = { contains: type };
  }

  if (q && q.trim()) {
    whereClause.OR = [
      { refId: { contains: q } },
      { alumniName: { contains: q } },
      { tier: { contains: q } },
      { method: { contains: q } },
    ];
  }

  const transactions = await db.transaction.findMany({
    where: Object.keys(whereClause).length > 0 ? whereClause : undefined,
    orderBy: { date: "desc" },
    include: { donation: true, cardOrder: true },
  });
  return ok(transactions);
}
