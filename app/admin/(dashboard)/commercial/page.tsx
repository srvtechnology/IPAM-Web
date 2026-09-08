import { db } from "@/lib/db";
import CommercialBannersView from "@/components/admin/commercial/CommercialBannersView";

export default async function CommercialPage() {
  const banners = await db.sponsorBanner.findMany({ orderBy: { name: "asc" } });

  return (
    <CommercialBannersView
      banners={banners.map((b) => ({
        id: b.id,
        code: b.code,
        name: b.name,
        slot: b.slot,
        contract: b.contract,
        monthlyFee: b.monthlyFee.toString(),
        subscriptionCadence: b.subscriptionCadence,
        active: b.active,
        invoiceNumber: b.invoiceNumber,
        invoiceStatus: b.invoiceStatus,
      }))}
    />
  );
}
