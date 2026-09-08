import { z } from "zod";

export const createBusinessSchema = z.object({
  name: z.string().min(1),
  founders: z.string().min(1),
  classYear: z.string().min(1),
  category: z.string().min(1),
  industry: z.string().min(1),
  tagline: z.string().optional(),
  description: z.string().min(1),
  about: z.string().optional(),
  services: z.array(z.string()).optional(),
  yearFounded: z.coerce.number().int().optional(),
  companySize: z.string().optional(),
  website: z.string().min(1),
  image: z.string().optional(),
  logo: z.string().optional(),
  location: z.string().min(1),
  contactEmail: z.string().email(),
  contactPhone: z.string().optional(),
  linkedin: z.string().optional(),
  certifications: z.array(z.string()).optional(),
});
