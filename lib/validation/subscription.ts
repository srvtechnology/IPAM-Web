import { z } from "zod";

export const updateSubscriptionSchema = z.object({
  tier: z.enum(["STANDARD", "SILVER_LIFETIME", "GOLD_PATRON"]),
  billingCycle: z.enum(["ANNUAL", "LIFETIME", "MONTHLY"]).default("ANNUAL"),
  paymentMethod: z.enum(["CARD", "FLOT", "STRIPE", "SIMULATED", "COMPLIMENTARY"]).default("FLOT"),
  paymentReference: z.string().optional(),
});

export const toggleAutoRenewSchema = z.object({
  autoRenew: z.boolean(),
});
