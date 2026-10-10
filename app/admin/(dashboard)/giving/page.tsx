import { db } from "@/lib/db";
import AdminGivingDeskView from "@/components/admin/giving/AdminGivingDeskView";

export const dynamic = "force-dynamic";

export default async function AdminGivingPage() {
  const donations = await db.donation.findMany({
    include: {
      user: {
        select: {
          id: true,
          email: true,
          studentId: true,
          membershipTier: true,
          profile: {
            select: {
              name: true,
              avatar: true,
              classYear: true,
            },
          },
        },
      },
      transaction: {
        select: {
          id: true,
          refId: true,
          status: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 300,
  });

  const formattedDonations = donations.map((d) => ({
    id: d.id,
    paymentRef: d.paymentRef,
    donorName: d.donorName,
    donorEmail: d.donorEmail,
    donorPhone: d.donorPhone,
    donorClass: d.donorClass,
    amount: Number(d.amount),
    currency: d.currency,
    fund: d.fund,
    frequency: d.frequency ?? "ONE_TIME",
    paymentMethod: d.paymentMethod ?? "CARD",
    isDedication: d.isDedication,
    dedicationName: d.dedicationName,
    isAnonymous: d.isAnonymous,
    status: d.status,
    createdAt: d.createdAt.toISOString(),
    isGuest: !d.userId,
    user: d.user
      ? {
          id: d.user.id,
          email: d.user.email,
          studentId: d.user.studentId,
          tier: d.user.membershipTier,
          name: d.user.profile?.name ?? d.donorName,
          avatar: d.user.profile?.avatar ?? null,
          classYear: d.user.profile?.classYear ?? null,
        }
      : null,
    transactionRef: d.transaction?.refId ?? null,
  }));

  return <AdminGivingDeskView initialDonations={formattedDonations} />;
}
