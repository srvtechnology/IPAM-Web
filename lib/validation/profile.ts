import { z } from "zod";

export const updateProfileSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  avatar: z.string().nullable().optional(),
  currentRole: z.string().max(100).optional().default(""),
  company: z.string().max(100).optional().default(""),
  industry: z.string().max(100).optional().default("General"),
  location: z.string().max(100).optional().default(""),
  country: z.string().max(100).optional().default(""),
  degree: z.string().max(100).optional().default(""),
  major: z.string().max(100).optional().default(""),
  classYear: z.coerce.number().int().min(1950).max(2040).optional().default(new Date().getFullYear()),
  bio: z.string().max(5000).optional().default(""),
  linkedin: z.string().max(255).optional().nullable().transform((val) => {
    if (!val || val.trim() === "") return null;
    const trimmed = val.trim();
    return trimmed.startsWith("http://") || trimmed.startsWith("https://") ? trimmed : `https://${trimmed}`;
  }),
  isMentor: z.boolean().default(false),
  skills: z.array(z.string()).optional().default([]),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
