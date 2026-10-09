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
  const tier = url.searchParams.get("tier");

  const whereUser: Record<string, unknown> = {
    status: "APPROVED",
  };

  if (tier && tier !== "ALL") {
    whereUser.membershipTier = tier;
  }

  if (q) {
    whereUser.OR = [
      { email: { contains: q } },
      { studentId: { contains: q } },
      { profile: { name: { contains: q } } },
      { profile: { company: { contains: q } } },
    ];
  }

  const [users, subscriptions] = await Promise.all([
    db.alumniUser.findMany({
      where: whereUser,
      include: {
        profile: {
          select: {
            id: true,
            name: true,
            avatar: true,
            company: true,
            currentRole: true,
          },
        },
        subscriptions: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    db.membershipSubscription.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            studentId: true,
            profile: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    }),
  ]);

  const subscribers = users.map((u) => {
    const latestSub = u.subscriptions[0];
    return {
      id: u.id,
      userId: u.id,
      email: u.email,
      studentId: u.studentId,
      name: u.profile?.name || u.email,
      avatar: u.profile?.avatar || null,
      company: u.profile?.company || "",
      currentRole: u.profile?.currentRole || "",
      tier: u.membershipTier,
      validUntil: u.membershipValidUntil,
      billingCycle: u.subscriptionBillingCycle || "ANNUAL",
      autoRenew: u.subscriptionAutoRenew,
      latestAmountPaid: latestSub?.amountPaid ?? 0,
      latestPaymentDate: latestSub?.createdAt ?? null,
      latestPaymentMethod: latestSub?.paymentMethod ?? "CARD",
      latestRef: latestSub?.paymentReference ?? null,
    };
  });

  return ok({
    subscribers,
    recentInvoices: subscriptions.map((s) => ({
      id: s.id,
      userId: s.userId,
      alumniName: s.user.profile?.name || s.user.email,
      email: s.user.email,
      studentId: s.user.studentId,
      tier: s.tier,
      billingCycle: s.billingCycle,
      amountPaid: s.amountPaid,
      currency: s.currency,
      status: s.status,
      paymentMethod: s.paymentMethod,
      paymentReference: s.paymentReference,
      createdAt: s.createdAt,
      validUntil: s.validUntil,
    })),
  });
}
