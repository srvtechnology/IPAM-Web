import { z } from "zod";

export const createBusinessSchema = z.object({
  name: z.string().min(1, "Business name is required"),
  founders: z.string().min(1, "Founder(s) is required"),
  classYear: z.string().min(1, "Graduation class year is required"),
  category: z.string().min(1, "Category is required"),
  industry: z.string().min(1, "Industry is required"),
  tagline: z.string().optional().nullable(),
  description: z.string().min(1, "Description is required"),
  about: z.string().optional().nullable(),
  services: z.array(z.string()).optional().nullable(),
  keyProducts: z.array(z.object({ name: z.string(), description: z.string() })).optional().nullable(),
  yearFounded: z.coerce.number().int().optional().nullable(),
  companySize: z.string().optional().nullable(),
  website: z.string().min(1, "Website or URL is required"),
  image: z.string().optional().nullable(),
  logo: z.string().optional().nullable(),
  bannerImage: z.string().optional().nullable(),
  location: z.string().min(1, "Location is required"),
  contactEmail: z.string().email("Valid contact email is required"),
  contactPhone: z.string().optional().nullable(),
  linkedin: z.string().optional().nullable(),
  certifications: z.array(z.string()).optional().nullable(),
  featured: z.boolean().optional(),
});

export const updateBusinessSchema = createBusinessSchema.partial().extend({
  status: z.enum(["PENDING_APPROVAL", "APPROVED", "REJECTED"]).optional(),
  rejectionReason: z.string().optional().nullable(),
  featured: z.boolean().optional(),
});

export const adminBusinessReviewSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED", "PENDING_APPROVAL"]),
  rejectionReason: z.string().optional().nullable(),
  featured: z.boolean().optional(),
});
