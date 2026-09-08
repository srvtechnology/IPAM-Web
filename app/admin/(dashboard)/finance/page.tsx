import { db } from "@/lib/db";
import FinanceView from "@/components/admin/finance/FinanceView";

export default async function FinancePage() {
  const transactions = await db.transaction.findMany({ orderBy: { date: "desc" } });

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
    />
  );
}
