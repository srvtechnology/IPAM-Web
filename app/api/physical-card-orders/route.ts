import type { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getAlumniSession } from "@/lib/auth/session";
import { createPhysicalCardOrderSchema } from "@/lib/validation/physical-card-orders";
import { ok, fail } from "@/lib/api-response";

function generateOrderNumber() {
  return `PVC-${Date.now().toString(36).toUpperCase()}`;
}

export async function GET() {
  const session = await getAlumniSession();
  if (!session) return fail(401, "You must be signed in to view your card orders");

  const orders = await db.physicalCardOrder.findMany({
    where: { alumniUserId: session.sub },
    orderBy: { createdAt: "desc" },
  });
  return ok(orders);
}

export async function POST(req: NextRequest) {
  const session = await getAlumniSession();
  if (!session) return fail(401, "You must be signed in to order a physical card");

  const body = await req.json().catch(() => null);
  if (!body) return fail(400, "Invalid JSON body");
  const parsed = createPhysicalCardOrderSchema.safeParse(body);
  if (!parsed.success) return fail(400, "Validation failed", { issues: parsed.error.flatten() });

  const order = await db.physicalCardOrder.create({
    data: {
      ...parsed.data,
      alumniUserId: session.sub,
      orderNumber: generateOrderNumber(),
    },
  });

  return ok(order, 201);
}
