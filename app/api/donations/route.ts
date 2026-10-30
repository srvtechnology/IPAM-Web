import type { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getAlumniSession } from "@/lib/auth/session";
import { createDonationSchema } from "@/lib/validation/donations";
import { ok, fail } from "@/lib/api-response";
import { notifyDonationReceived } from "@/lib/notifications";

// No real payment gateway is integrated in this pass (out of scope per plan).
// Donations are recorded as immediately SUCCEEDED with a generated reference.
function generatePaymentRef() {
  return `DON-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mine = searchParams.get("mine") === "true";
  const session = await getAlumniSession();

  if (mine) {
    if (!session) return fail(401, "You must be signed in to view your giving history");
    const donations = await db.donation.findMany({
      where: { userId: session.sub },
      orderBy: { createdAt: "desc" },
    });
    return ok(donations);
  }

  const donations = await db.donation.findMany({ orderBy: { createdAt: "desc" }, take: 100 });
  return ok(donations);
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body) return fail(400, "Invalid JSON body");
  const parsed = createDonationSchema.safeParse(body);
  if (!parsed.success) return fail(400, "Validation failed", { issues: parsed.error.flatten() });

  const session = await getAlumniSession();

  const donation = await db.donation.create({
    data: {
      ...parsed.data,
      userId: session?.sub ?? null,
      paymentRef: generatePaymentRef(),
      status: "SUCCEEDED",
    },
  });

  // Finance treats every settled donation as a transaction so it stays the
  // single source of truth for money movement (see Milestone 4b notes).
  const currency = donation.currency === "SLE" ? "SLE" : "USD";
  await db.transaction.create({
    data: {
      refId: `TXN-${donation.paymentRef}`,
      method: "Online Giving",
      methodColor: "TERTIARY",
      amount: donation.amount,
      currency,
      tier: donation.fund,
      status: "SETTLED",
      alumniName: donation.donorName,
      donationId: donation.id,
    },
  });

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

  return ok(donation, 201);
}
