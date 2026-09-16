import { z } from "zod";

export const createDonationSchema = z.object({
  donorName: z.string().min(1),
  donorEmail: z.string().email(),
  amount: z.coerce.number().positive(),
  currency: z.string().default("USD"),
  fund: z.string().min(1),
  frequency: z.enum(["ONE_TIME", "MONTHLY"]).optional(),
  paymentMethod: z.enum(["CARD", "MOMO", "BANK", "PAYPAL"]).optional(),
  isDedication: z.boolean().optional(),
  dedicationName: z.string().optional(),
  isAnonymous: z.boolean().optional(),
});
