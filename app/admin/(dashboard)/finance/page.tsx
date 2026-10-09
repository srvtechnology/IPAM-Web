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

  const [transactions, users] = await Promise.all([
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
    />
  );
}
