import { z } from "zod";

export const alumniRegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  studentId: z.string().min(1, "Student/registration ID is required"),
  name: z.string().min(1, "Full name is required"),
  classYear: z.coerce.number().int().gte(1960).lte(2100),
  degree: z.string().min(1),
  major: z.string().min(1),
  currentRole: z.string().default("Alumni"),
  company: z.string().default(""),
  location: z.string().default(""),
  country: z.string().default(""),
  industry: z.string().default("General"),
  bio: z.string().default(""),
});

export const alumniLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const adminLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});
