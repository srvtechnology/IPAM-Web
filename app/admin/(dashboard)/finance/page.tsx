import { db } from "@/lib/db";
import FinanceView from "@/components/admin/finance/FinanceView";
import { seedDefaultSubscriptionTiers } from "@/lib/subscription-service";
import { type MembershipTierKey } from "@/lib/subscription-pricing";

export const dynamic = "force-dynamic";

export default async function FinancePage() {
  let plans = await db.subscriptionTierConfig.findMany({
    orderBy: { sortOrder: "asc" },
  });

  if (plans.length === 0) {
    await seedDefaultSubscriptionTiers();
    plans = await db.subscriptionTierConfig.findMany({
      orderBy: { sortOrder: "asc" },
    });
  }

  const [transactions, users, donations] = await Promise.all([
    db.transaction.findMany({ orderBy: { date: "desc" }, take: 100 }),
    db.alumniUser.findMany({
      where: { status: "APPROVED" },
      include: {
        profile: true,
        subscriptions: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    db.donation.findMany({
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
      take: 200,
    }),
  ]);

  const formattedPlans = plans.map((p) => {
    let perksList: string[] = [];
    if (Array.isArray(p.perks)) {
      perksList = p.perks as string[];
    } else if (typeof p.perks === "string") {
      try {
        perksList = JSON.parse(p.perks);
      } catch {
        perksList = [];
      }
    }

    return {
      id: p.id,
      tier: p.tier as MembershipTierKey,
      name: p.name,
      tagline: p.tagline,
      description: p.description,
      badgeText: p.badgeText,
      isFree: p.isFree,
      annualPrice: p.annualPrice,
      lifetimePrice: p.lifetimePrice,
      monthlyPrice: p.monthlyPrice,
      currency: p.currency,
      isActive: p.isActive,
      sortOrder: p.sortOrder,
      perks: perksList,
      accentColor: p.accentColor || "emerald",
    };
  });

  const formattedSubscribers = users.map((u) => {
    const latestSub = u.subscriptions[0];
    return {
      userId: u.id,
      email: u.email,
      studentId: u.studentId,
      name: u.profile?.name || u.email,
      avatar: u.profile?.avatar || null,
      company: u.profile?.company || "",
      currentRole: u.profile?.currentRole || "",
      tier: u.membershipTier,
      validUntil: u.membershipValidUntil ? u.membershipValidUntil.toISOString() : null,
      billingCycle: u.subscriptionBillingCycle || "ANNUAL",
      autoRenew: u.subscriptionAutoRenew,
      latestAmountPaid: latestSub?.amountPaid ?? 0,
      latestPaymentDate: latestSub?.createdAt ? latestSub.createdAt.toISOString() : null,
      latestPaymentMethod: latestSub?.paymentMethod ?? "CARD",
      latestRef: latestSub?.paymentReference ?? null,
    };
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

  return (
    <FinanceView
      transactions={transactions.map((t) => ({
        id: t.id,
        refId: t.refId,
        method: t.method,
        amount: t.amount.toString(),
        currency: t.currency,
        tier: t.tier,
        status: t.status,
        date: t.date.toISOString(),
        alumniName: t.alumniName,
      }))}
      initialPlans={formattedPlans}
      initialSubscribers={formattedSubscribers}
      initialDonations={formattedDonations}
    />
  );
}
