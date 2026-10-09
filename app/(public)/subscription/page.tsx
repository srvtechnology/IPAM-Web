import { redirect } from "next/navigation";
import { getAlumniSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import SubscriptionManagementView from "@/components/public/SubscriptionManagementView";

export const metadata = {
  title: "Membership & Subscription | IPAM Alumni Association",
  description: "Manage your alumni patronage tier, unlock executive perks, and view membership history.",
};

export default async function SubscriptionPage() {
  const session = await getAlumniSession();
  if (!session) {
    redirect("/login?next=/subscription");
  }

  const user = await db.alumniUser.findUnique({
    where: { id: session.sub },
    include: {
      subscriptions: {
        orderBy: { createdAt: "desc" },
        take: 10,
      },
      profile: true,
    },
  });

  if (!user || user.status !== "APPROVED") {
    redirect("/");
  }

  return (
    <div className="min-h-screen bg-slate-950 py-10">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <SubscriptionManagementView
          initialUser={{
            id: user.id,
            email: user.email,
            studentId: user.studentId,
            membershipTier: user.membershipTier,
            membershipValidUntil: user.membershipValidUntil ? user.membershipValidUntil.toISOString() : null,
            subscriptionBillingCycle: user.subscriptionBillingCycle || "ANNUAL",
            subscriptionAutoRenew: user.subscriptionAutoRenew,
            profileName: user.profile?.name || user.email,
          }}
          initialHistory={user.subscriptions.map((s) => ({
            id: s.id,
            tier: s.tier,
            billingCycle: s.billingCycle,
            amountPaid: s.amountPaid,
            currency: s.currency,
            status: s.status,
            paymentMethod: s.paymentMethod,
            paymentReference: s.paymentReference,
            createdAt: s.createdAt.toISOString(),
          }))}
        />
      </div>
    </div>
  );
}
