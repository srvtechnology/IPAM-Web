import { db } from "@/lib/db";
import { GIVING_FUNDS } from "@/lib/public/giving-funds";
import { getBannersForPage } from "@/lib/commercial-banners";
import { ok } from "@/lib/api-response";

export const dynamic = "force-dynamic";

/**
 * GET /api/giving
 * Returns complete Giving & Endowment hub data for mobile and web:
 * - funds (with real raised totals & donor counts)
 * - stats (totalContributed, giftsRecorded)
 * - recentDonations (community honor roll)
 * - bottomBanners (page banners for /giving)
 */
export async function GET() {
  const [fundStats, recentDonationRows, bottomBanners] = await Promise.all([
    db.donation.groupBy({
      by: ["fund"],
      where: { status: "SUCCEEDED" },
      _sum: { amount: true },
      _count: { _all: true },
    }),
    db.donation.findMany({
      where: { status: "SUCCEEDED" },
      orderBy: { createdAt: "desc" },
      take: 15,
    }),
    getBannersForPage("/giving"),
  ]);

  const statsByFund = new Map(
    fundStats.map((s) => [s.fund, { raised: Number(s._sum.amount ?? 0), donorsCount: s._count._all }])
  );

  const funds = GIVING_FUNDS.map((fund) => ({
    ...fund,
    raised: statsByFund.get(fund.title)?.raised ?? 0,
    donorsCount: statsByFund.get(fund.title)?.donorsCount ?? 0,
  }));

  return ok({
    funds,
    stats: {
      totalContributed: funds.reduce((sum, f) => sum + f.raised, 0),
      giftsRecorded: funds.reduce((sum, f) => sum + f.donorsCount, 0),
      directToStudentPrograms: "100%",
    },
    recentDonations: recentDonationRows.map((donation) => ({
      id: donation.id,
      donorName: donation.isAnonymous ? "Anonymous Donor" : donation.donorName,
      amount: Number(donation.amount),
      currency: donation.currency,
      fund: donation.fund,
      createdAt: donation.createdAt.toISOString(),
    })),
    bottomBanners,
  });
}
