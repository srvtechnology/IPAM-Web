import { z } from "zod";

export const createBannerSchema = z.object({
  code: z.string().min(1),
  name: z.string().min(1),
  slot: z.string().min(1),
  contract: z.string().min(1),
  monthlyFee: z.coerce.number().nonnegative(),
  subscriptionCadence: z.enum(["MONTHLY", "HALF_YEARLY", "YEARLY"]).optional(),
  scheduleStatus: z.enum(["ACTIVE", "SCHEDULED", "EXPIRED", "PAUSED"]).optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  bannerImageUrl: z.string().optional(),
  targetUrl: z.string().optional(),
  industry: z.string().optional(),
  dimensions: z.string().optional(),
  contactName: z.string().optional(),
  contactEmail: z.string().email().optional().or(z.literal("")),
  contactPhone: z.string().optional(),
  contactTitle: z.string().optional(),
  contactAddress: z.string().optional(),
  contactTaxId: z.string().optional(),
  invoiceNumber: z.string().optional(),
  invoiceDate: z.coerce.date().optional(),
  invoiceDueDate: z.coerce.date().optional(),
  invoiceStatus: z.enum(["PAID", "PENDING", "OVERDUE"]).optional(),
  autoRenew: z.boolean().default(false),
  notes: z.string().optional(),
});

export const updateBannerSchema = createBannerSchema.partial();
