import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth/permissions";
import { ok, fail } from "@/lib/api-response";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const gate = await requirePermission(req, "FINANCE", "canRead");
  if (gate instanceof NextResponse) return gate;

  const { id } = await params;
  const transaction = await db.transaction.findUnique({ where: { id }, include: { donation: true } });
  if (!transaction) return fail(404, "Transaction not found");
  return ok(transaction);
}
