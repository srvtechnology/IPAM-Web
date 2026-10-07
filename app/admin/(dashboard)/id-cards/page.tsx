import { db } from "@/lib/db";
import IdCardIssuanceDeskView from "@/components/admin/id-cards/IdCardIssuanceDeskView";
import type { IdCardOrderRow } from "@/components/admin/id-cards/IdCardIssuanceDeskView";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function IdCardsPage() {
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

  const mappedRegistrar: IdCardOrderRow[] = registrarOrders.map((o) => ({
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

  const mappedAlumni: IdCardOrderRow[] = alumniOrders.map((p) => ({
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
    paymentStatus: p.paymentStatus as IdCardOrderRow["paymentStatus"],
    recipientPhone: p.recipientPhone,
  }));

  // Combine and sort by submission date descending
  const allOrders = [...mappedAlumni, ...mappedRegistrar].sort(
    (a, b) => new Date(b.submittedDate).getTime() - new Date(a.submittedDate).getTime()
  );

  return <IdCardIssuanceDeskView orders={allOrders} />;
}
