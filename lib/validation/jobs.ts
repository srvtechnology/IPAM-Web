import { z } from "zod";

export const applyToJobSchema = z.object({
  linkedinUrl: z.string().max(500).optional(),
  coverNote: z.string().max(2000).optional(),
});

export const createJobSchema = z.object({
  title: z.string().min(1),
  company: z.string().min(1),
  companyLogo: z.string().optional(),
  location: z.string().min(1),
  type: z.enum(["FULL_TIME", "PART_TIME", "CONTRACT", "REMOTE"]),
  workplaceType: z.enum(["REMOTE", "HYBRID", "ON_SITE"]).optional(),
  salary: z.string().min(1),
  category: z.enum([
    "ENGINEERING",
    "DATA_AI",
    "FINANCE_BANKING",
    "OPERATIONS",
    "PRODUCT_DESIGN",
    "LEGAL_PUBLIC_POLICY",
  ]),
  description: z.string().min(1),
  responsibilities: z.array(z.string()).optional(),
  requirements: z.array(z.string()).min(1),
  benefits: z.array(z.string()).optional(),
  aboutCompany: z.string().optional(),
  deadline: z.coerce.date(),
  applyUrl: z.string().optional(),
});
