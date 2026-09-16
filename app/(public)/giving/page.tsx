import { db } from "@/lib/db";
import GivingView from "@/components/public/GivingView";
import { GIVING_FUNDS } from "@/lib/public/giving-funds";

export default async function GivingPage() {
  const [fundStats, recentDonationRows] = await Promise.all([
    db.donation.groupBy({
      by: ["fund"],
      where: { status: "SUCCEEDED" },
      _sum: { amount: true },
      _count: { _all: true },
    }),
    db.donation.findMany({
      where: { status: "SUCCEEDED" },
      orderBy: { createdAt: "desc" },
      take: 12,
    }),
  ]);

  const statsByFund = new Map(
    fundStats.map((s) => [s.fund, { raised: Number(s._sum.amount ?? 0), donorsCount: s._count._all }])
  );

  const funds = GIVING_FUNDS.map((fund) => ({
    ...fund,
    raised: statsByFund.get(fund.title)?.raised ?? 0,
    donorsCount: statsByFund.get(fund.title)?.donorsCount ?? 0,
  }));

  const recentDonations = recentDonationRows.map((donation) => ({
    id: donation.id,
    donorName: donation.isAnonymous ? "Anonymous Donor" : donation.donorName,
    amount: Number(donation.amount),
    currency: donation.currency,
    fund: donation.fund,
    createdAt: donation.createdAt.toISOString(),
  }));

  return <GivingView funds={funds} recentDonations={recentDonations} />;
}
