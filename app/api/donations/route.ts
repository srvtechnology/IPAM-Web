import type { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getAlumniSession } from "@/lib/auth/session";
import { createDonationSchema } from "@/lib/validation/donations";
import { GIVING_FUNDS } from "@/lib/public/giving-funds";
import { ok, fail } from "@/lib/api-response";
import { notifyDonationReceived } from "@/lib/notifications";

function generatePaymentRef() {
  return `DON-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mine = searchParams.get("mine") === "true";
  const summary = searchParams.get("summary") === "true";
  const session = await getAlumniSession(req);

  if (mine) {
    if (!session) return fail(401, "You must be signed in to view your giving history");
    const donations = await db.donation.findMany({
      where: { userId: session.sub },
      orderBy: { createdAt: "desc" },
    });
    return ok(
      donations.map((d) => ({
        ...d,
        amount: Number(d.amount),
      }))
    );
  }

  if (summary) {
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
        take: 15,
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

    return ok({
      funds,
      stats: {
        totalContributed: funds.reduce((sum, f) => sum + f.raised, 0),
        giftsRecorded: funds.reduce((sum, f) => sum + f.donorsCount, 0),
      },
      recentDonations: recentDonationRows.map((d) => ({
        id: d.id,
        donorName: d.isAnonymous ? "Anonymous Donor" : d.donorName,
        amount: Number(d.amount),
        currency: d.currency,
        fund: d.fund,
        createdAt: d.createdAt.toISOString(),
      })),
    });
  }

  const donations = await db.donation.findMany({
    where: { status: "SUCCEEDED" },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  return ok(
    donations.map((d) => ({
      ...d,
      donorName: d.isAnonymous ? "Anonymous Donor" : d.donorName,
      amount: Number(d.amount),
    }))
  );
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body) return fail(400, "Invalid JSON body");
  const parsed = createDonationSchema.safeParse(body);
  if (!parsed.success) return fail(400, "Validation failed", { issues: parsed.error.flatten() });

  const session = await getAlumniSession(req);
  const { paymentRef: incomingRef, paymentMethod, ...rest } = parsed.data;
  const finalRef = incomingRef || generatePaymentRef();
  const finalMethod = paymentMethod || "FLOT";
  const currency = rest.currency === "SLE" ? "SLE" : "USD";

  // Check if a PENDING or existing donation with this paymentRef already exists (e.g. from mobile Flot link creation)
  const existing = incomingRef
    ? await db.donation.findFirst({ where: { paymentRef: incomingRef } })
    : null;

  let donation;
  if (existing) {
    donation = await db.donation.update({
      where: { id: existing.id },
      data: {
        status: "SUCCEEDED",
        paymentMethod: finalMethod,
        amount: rest.amount,
        currency,
      },
    });

    await db.transaction.updateMany({
      where: { OR: [{ donationId: existing.id }, { refId: `TXN-${existing.paymentRef}` }] },
      data: {
        status: "SETTLED",
        method: finalMethod === "FLOT" ? "Flot Online Giving" : "Online Giving",
        methodColor: "TERTIARY",
        tier: `University Giving - ${donation.fund}`,
      },
    });
  } else {
    donation = await db.donation.create({
      data: {
        ...rest,
        currency,
        paymentMethod: finalMethod,
        userId: session?.sub ?? null,
        paymentRef: finalRef,
        status: "SUCCEEDED",
      },
    });

    await db.transaction.create({
      data: {
        refId: `TXN-${donation.paymentRef}`,
        method: finalMethod === "FLOT" ? "Flot Online Giving" : "Online Giving",
        methodColor: "TERTIARY",
        amount: donation.amount,
        currency,
        tier: `University Giving - ${donation.fund}`,
        status: "SETTLED",
        alumniName: donation.donorName,
        donationId: donation.id,
      },
    });
  }

  // Dispatch ALL details of donor to admin email & official tax receipt to donor
  notifyDonationReceived({
    donorName: donation.donorName,
    donorEmail: donation.donorEmail,
    donorPhone: donation.donorPhone,
    donorDegree: donation.donorClass || "Alumnus / Supporter",
    amount: Number(donation.amount),
    currency: donation.currency,
    fund: donation.fund,
    frequency: donation.frequency || "ONE_TIME",
    anonymous: donation.isAnonymous,
    paymentRef: donation.paymentRef,
    message: donation.isDedication ? `Dedicated to: ${donation.dedicationName || "Honoree"}` : null,
    donatedAt: donation.createdAt,
    userId: session?.sub ?? null,
  }).catch((err) => console.error("[Donations] Notification dispatch error:", err));

  return ok(
    {
      ...donation,
      amount: Number(donation.amount),
    },
    201
  );
}
