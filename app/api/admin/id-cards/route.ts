import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth/permissions";
import { createIdCardOrderSchema } from "@/lib/validation/idcards";
import { ok, fail } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  const gate = await requirePermission(req, "ID_CARDS", "canRead");
  if (gate instanceof NextResponse) return gate;

  const orders = await db.idCardOrder.findMany({ orderBy: { submittedDate: "desc" } });
  return ok(orders);
}

export async function POST(req: NextRequest) {
  const gate = await requirePermission(req, "ID_CARDS", "canWrite");
  if (gate instanceof NextResponse) return gate;

  const body = await req.json().catch(() => null);
  if (!body) return fail(400, "Invalid JSON body");
  const parsed = createIdCardOrderSchema.safeParse(body);
  if (!parsed.success) return fail(400, "Validation failed", { issues: parsed.error.flatten() });

  const orderNumber = `IDC-${Date.now().toString(36).toUpperCase()}`;
  const order = await db.idCardOrder.create({ data: { ...parsed.data, orderNumber } });
  return ok(order, 201);
}
