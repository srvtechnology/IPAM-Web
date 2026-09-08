import { db } from "@/lib/db";
import IdCardIssuanceDeskView from "@/components/admin/id-cards/IdCardIssuanceDeskView";

export default async function IdCardsPage() {
  const orders = await db.idCardOrder.findMany({ orderBy: { submittedDate: "desc" } });

  return (
    <IdCardIssuanceDeskView
      orders={orders.map((o) => ({
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
      }))}
    />
  );
}
