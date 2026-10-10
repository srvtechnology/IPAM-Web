import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth/permissions";
import { ok } from "@/lib/api-response";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const gate = await requirePermission(req, "FINANCE", "canRead");
  if (gate instanceof NextResponse) return gate;

  const url = new URL(req.url);
  const q = url.searchParams.get("q")?.trim();
  const fund = url.searchParams.get("fund")?.trim();
  const method = url.searchParams.get("method")?.trim();
  const donorType = url.searchParams.get("donorType")?.trim(); // "ALL" | "GUEST" | "ALUMNI"

  const where: Record<string, unknown> = {};

  if (fund && fund !== "ALL") {
    where.fund = fund;
  }

  if (method && method !== "ALL") {
    where.paymentMethod = method;
  }

  if (donorType === "GUEST") {
    where.userId = null;
  } else if (donorType === "ALUMNI") {
    where.userId = { not: null };
  }

  if (q) {
    where.OR = [
      { donorName: { contains: q } },
      { donorEmail: { contains: q } },
      { donorPhone: { contains: q } },
      { paymentRef: { contains: q } },
      { dedicationName: { contains: q } },
      { fund: { contains: q } },
    ];
  }

  const donations = await db.donation.findMany({
    where,
    include: {
      user: {
        select: {
          id: true,
          email: true,
          membershipTier: true,
          studentId: true,
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
          method: true,
          date: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 300,
  });

  const totalUSD = donations
    .filter((d) => d.currency === "USD")
    .reduce((sum, d) => sum + Number(d.amount), 0);

  const totalSLE = donations
    .filter((d) => d.currency === "SLE")
    .reduce((sum, d) => sum + Number(d.amount), 0);

  const guestCount = donations.filter((d) => !d.userId).length;
  const alumniCount = donations.filter((d) => !!d.userId).length;

  return ok({
    donations: donations.map((d) => ({
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
    })),
    stats: {
      totalCount: donations.length,
      totalUSD,
      totalSLE,
      guestCount,
      alumniCount,
    },
  });
}
