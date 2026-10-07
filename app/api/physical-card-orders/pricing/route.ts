import { getPhysicalCardPricing } from "@/lib/card-pricing";
import { ok } from "@/lib/api-response";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const pricing = await getPhysicalCardPricing();
  return ok(pricing);
}
