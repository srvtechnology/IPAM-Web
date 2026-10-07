import { z } from "zod";

export const createPhysicalCardOrderSchema = z.object({
  cardTier: z.enum(["STANDARD_PVC", "GOLD_RFID_SMART", "EXECUTIVE_TITANIUM"]).default("STANDARD_PVC"),
  deliveryAddress: z.string().min(3, "Delivery address is required"),
  recipientName: z.string().min(2, "Recipient name is required"),
  recipientPhone: z.string().min(5, "Contact phone number is required"),
  paymentMethod: z.enum(["COD", "STRIPE"]).default("COD"),
  paymentRef: z.string().optional(),
});

export const cardTierPricingSchema = z.object({
  name: z.string().min(2),
  price: z.number().min(0),
  description: z.string(),
  features: z.array(z.string()),
  enabled: z.boolean(),
});

export const updatePhysicalCardPricingSchema = z.object({
  currency: z.enum(["USD", "SLE"]).default("USD"),
  shippingFee: z.number().min(0).default(0),
  codEnabled: z.boolean().default(true),
  stripeEnabled: z.boolean().default(true),
  tiers: z.object({
    STANDARD_PVC: cardTierPricingSchema,
    GOLD_RFID_SMART: cardTierPricingSchema,
    EXECUTIVE_TITANIUM: cardTierPricingSchema,
  }),
});
