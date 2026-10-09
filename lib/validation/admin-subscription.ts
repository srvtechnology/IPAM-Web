import { z } from "zod";

export const updateTierConfigSchema = z.object({
  name: z.string().min(1, "Plan name is required").max(100),
  tagline: z.string().max(200).optional().default(""),
  description: z.string().max(2000).optional().default(""),
  badgeText: z.string().max(50).nullable().optional(),
  isFree: z.boolean().default(false),
  annualPrice: z.coerce.number().min(0, "Price cannot be negative"),
  lifetimePrice: z.coerce.number().min(0, "Price cannot be negative"),
  monthlyPrice: z.coerce.number().min(0, "Price cannot be negative"),
  currency: z.string().default("USD"),
  isActive: z.boolean().default(true),
  sortOrder: z.coerce.number().int().default(0),
  perks: z.array(z.string()).default([]),
  accentColor: z.string().default("emerald"),
});

export const grantSubscriptionSchema = z.object({
  userId: z.string().min(1, "Alumni User ID is required"),
  tier: z.enum(["STANDARD", "SILVER_LIFETIME", "GOLD_PATRON"]),
  billingCycle: z.enum(["ANNUAL", "LIFETIME", "MONTHLY"]).default("ANNUAL"),
  validUntil: z.string().datetime().nullable().optional(),
  notes: z.string().max(500).optional(),
});

export type UpdateTierConfigInput = z.infer<typeof updateTierConfigSchema>;
export type GrantSubscriptionInput = z.infer<typeof grantSubscriptionSchema>;
