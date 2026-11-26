import { ok } from "@/lib/api-response";
import { getPhysicalCardPricing } from "@/lib/card-pricing";
import { getDynamicSubscriptionTiers } from "@/lib/subscription-service";
import { getUsdToSleRate, sleToUsd } from "@/lib/payments/currency";

export const dynamic = "force-dynamic";

/**
 * GET /api/payments/flot/config
 * Returns Flot payment gateway configuration, exchange rate, allowed payment types per currency,
 * and dynamic pricing in both SLE and USD for mobile apps.
 */
export async function GET() {
  const [cardPricing, subscriptionTiers] = await Promise.all([
    getPhysicalCardPricing(),
    getDynamicSubscriptionTiers(),
  ]);

  const usdToSleRate = getUsdToSleRate();

  return ok({
    gateway: "FLOT",
    currencies: ["SLE", "USD"],
    defaultCurrency: "SLE",
    usdToSleRate,
    methodsByCurrency: {
      SLE: [
        { id: "in-app", label: "Flot App", description: "Open Flot app or scan QR code" },
        { id: "momo", label: "Mobile Money", description: "Dial *715*...# USSD code" },
        { id: "card", label: "Bank Card", description: "Visa / Mastercard via Flot secure page" },
      ],
      USD: [
        { id: "card", label: "Bank Card", description: "USD payments accept Bank Card only" },
      ],
    },
    pollingIntervalMs: 3000,
    cardPricing: {
      baseCurrency: cardPricing.currency,
      shippingFeeSle: cardPricing.shippingFee,
      shippingFeeUsd: sleToUsd(cardPricing.shippingFee),
      codEnabled: cardPricing.codEnabled,
      flotEnabled: cardPricing.flotEnabled,
      tiers: Object.fromEntries(
        Object.entries(cardPricing.tiers).map(([key, tier]) => [
          key,
          {
            ...tier,
            totalSle: tier.price + cardPricing.shippingFee,
            totalUsd: sleToUsd(tier.price + cardPricing.shippingFee),
          },
        ])
      ),
    },
    subscriptionTiers: Object.fromEntries(
      Object.entries(subscriptionTiers).map(([key, plan]) => [
        key,
        {
          id: plan.id,
          name: plan.name,
          badge: plan.badge,
          isFree: plan.isFree,
          annualPriceSle: plan.annualPrice,
          annualPriceUsd: sleToUsd(plan.annualPrice),
          monthlyPriceSle: plan.monthlyPrice,
          monthlyPriceUsd: sleToUsd(plan.monthlyPrice),
          lifetimePriceSle: plan.lifetimePrice,
          lifetimePriceUsd: sleToUsd(plan.lifetimePrice),
        },
      ])
    ),
  });
}
