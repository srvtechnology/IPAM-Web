import { db } from "@/lib/db";
import {
  type MembershipTierKey,
  type SubscriptionTierPlan,
  SUBSCRIPTION_TIERS,
} from "./subscription-pricing";

export async function getDynamicSubscriptionTiers(): Promise<Record<MembershipTierKey, SubscriptionTierPlan>> {
  try {
    const configs = await db.subscriptionTierConfig.findMany({
      orderBy: { sortOrder: "asc" },
    });

    if (configs.length === 0) {
      await seedDefaultSubscriptionTiers();
      return SUBSCRIPTION_TIERS;
    }

    const result: Record<MembershipTierKey, SubscriptionTierPlan> = { ...SUBSCRIPTION_TIERS };

    for (const c of configs) {
      const key = c.tier as MembershipTierKey;
      const baseColor = SUBSCRIPTION_TIERS[key]?.color || SUBSCRIPTION_TIERS.STANDARD.color;
      let perksList: string[] = [];

      if (Array.isArray(c.perks)) {
        perksList = c.perks as string[];
      } else if (typeof c.perks === "string") {
        try {
          perksList = JSON.parse(c.perks);
        } catch {
          perksList = [];
        }
      }

      if (perksList.length === 0 && SUBSCRIPTION_TIERS[key]) {
        perksList = SUBSCRIPTION_TIERS[key].features;
      }

      result[key] = {
        id: key,
        name: c.name,
        badge: c.badgeText || SUBSCRIPTION_TIERS[key]?.badge || "Member",
        tagline: c.tagline,
        annualPrice: c.annualPrice,
        monthlyPrice: c.monthlyPrice,
        lifetimePrice: c.lifetimePrice,
        isFree: c.isFree,
        popular: Boolean(c.badgeText),
        description: c.description,
        features: perksList,
        color: baseColor,
      };
    }

    return result;
  } catch (error) {
    console.error("Error loading dynamic subscription tiers:", error);
    return SUBSCRIPTION_TIERS;
  }
}

export async function seedDefaultSubscriptionTiers() {
  const defaultList: {
    tier: MembershipTierKey;
    sortOrder: number;
    accentColor: string;
    badgeText?: string;
  }[] = [
    { tier: "STANDARD", sortOrder: 1, accentColor: "slate" },
    { tier: "SILVER_LIFETIME", sortOrder: 2, accentColor: "slate" },
    { tier: "GOLD_PATRON", sortOrder: 3, accentColor: "amber", badgeText: "EXECUTIVE CHOICE" },
  ];

  for (const item of defaultList) {
    const def = SUBSCRIPTION_TIERS[item.tier];
    if (!def) continue;

    await db.subscriptionTierConfig.upsert({
      where: { tier: item.tier },
      update: {},
      create: {
        tier: item.tier,
        name: def.name,
        tagline: def.tagline,
        description: def.description,
        badgeText: item.badgeText || null,
        isFree: def.isFree,
        annualPrice: def.annualPrice,
        lifetimePrice: def.lifetimePrice,
        monthlyPrice: def.monthlyPrice,
        currency: "USD",
        isActive: true,
        sortOrder: item.sortOrder,
        perks: def.features,
        accentColor: item.accentColor,
      },
    });
  }
}
