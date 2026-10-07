import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth/permissions";
import { createIdCardOrderSchema } from "@/lib/validation/idcards";
import { ok, fail } from "@/lib/api-response";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: NextRequest) {
  const gate = await requirePermission(req, "ID_CARDS", "canRead");
  if (gate instanceof NextResponse) return gate;

  const [registrarOrders, alumniOrders] = await Promise.all([
    db.idCardOrder.findMany({ orderBy: { submittedDate: "desc" } }),
    db.physicalCardOrder.findMany({
      include: {
        alumniUser: {
          include: { profile: true },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const mappedRegistrar = registrarOrders.map((o) => ({
    id: o.id,
    orderNumber: o.orderNumber,
    studentName: o.studentName,
    regNo: o.regNo,
    deliveryAddress: o.deliveryAddress,
    courierType: o.courierType,
    status: o.status,
    cardTier: o.cardTier,
    trackingCode: o.trackingCode,
    submittedDate: o.submittedDate.toISOString(),
    sourceType: "REGISTRAR",
    paymentMethod: null,
    paymentStatus: null,
  }));

  const mappedAlumni = alumniOrders.map((p) => ({
    id: p.id,
    orderNumber: p.orderNumber,
    studentName: p.recipientName || p.alumniUser.profile?.name || p.alumniUser.email,
    regNo: p.alumniUser.studentId || "Alumni Portal",
    deliveryAddress: p.deliveryAddress,
    courierType: p.paymentMethod === "COD" ? "LOCAL_COURIER_COD" : "DHL_EXPRESS_RUSH",
    status: p.status,
    cardTier: p.cardTier,
    trackingCode: p.trackingCode,
    submittedDate: p.createdAt.toISOString(),
    sourceType: "ALUMNI_PORTAL",
    amount: p.amount.toString(),
    currency: p.currency,
    paymentMethod: p.paymentMethod,
    paymentStatus: p.paymentStatus,
    recipientPhone: p.recipientPhone,
  }));

  const allOrders = [...mappedAlumni, ...mappedRegistrar].sort(
    (a, b) => new Date(b.submittedDate).getTime() - new Date(a.submittedDate).getTime()
  );

  return ok(allOrders);
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
