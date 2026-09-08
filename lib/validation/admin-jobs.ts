import { z } from "zod";

export const createEmployerSchema = z.object({
  name: z.string().min(1),
  logoUrl: z.string().optional(),
  industry: z.string().min(1),
  headquarters: z.string().min(1),
  website: z.string().min(1),
  companySize: z.string().min(1),
  description: z.string().min(1),
  verifiedPartner: z.boolean().default(false),
  partnershipTier: z.enum([
    "PLATINUM_CORPORATE",
    "GOLD_CAREER_AFFILIATE",
    "UNIVERSITY_CORE_PARTNER",
    "SILVER_INDUSTRY_ASSOCIATE",
  ]),
  establishedYear: z.coerce.number().int().optional(),
  contactName: z.string().min(1),
  contactTitle: z.string().min(1),
  contactEmail: z.string().email(),
  contactPhone: z.string().min(1),
  contactLinkedIn: z.string().optional(),
});

export const updateEmployerSchema = createEmployerSchema.partial();

export const createAdminJobSchema = z.object({
  title: z.string().min(1),
  company: z.string().min(1),
  employerId: z.string().optional(),
  location: z.string().min(1),
  workMode: z.enum(["ON_SITE", "HYBRID", "REMOTE"]).optional(),
  type: z.enum(["FULL_TIME", "CONTRACT", "EXECUTIVE", "INTERNSHIP"]),
  department: z.string().optional(),
  experienceLevel: z.string().optional(),
  salaryRange: z.string().min(1),
  status: z
    .enum(["ACTIVE", "REVIEWING", "SHORTLISTING", "INTERVIEWING", "OFFER_EXTENDED", "CLOSED"])
    .default("ACTIVE"),
  closingDate: z.coerce.date(),
  verifiedOnly: z.boolean().default(false),
  description: z.string().optional(),
  requirements: z.array(z.string()).optional(),
  skillsRequired: z.array(z.string()).optional(),
  benefits: z.array(z.string()).optional(),
});

export const updateAdminJobSchema = createAdminJobSchema.partial();

export const createJobApplicationSchema = z.object({
  candidateName: z.string().min(1),
  regNo: z.string().optional(),
  degree: z.string().min(1),
  faculty: z.string().min(1),
  gradYear: z.coerce.number().int(),
  email: z.string().email(),
  phone: z.string().min(1),
  gpa: z.string().optional(),
  coverNote: z.string().optional(),
  experienceYears: z.coerce.number().int().default(0),
  skills: z.array(z.string()).optional(),
  verifiedAlumnus: z.boolean().default(false),
});

export const updateJobApplicationSchema = z.object({
  status: z
    .enum(["APPLIED", "REVIEWING", "SHORTLISTED", "INTERVIEW_SCHEDULED", "SELECTED", "REJECTED"])
    .optional(),
  matchScore: z.coerce.number().int().optional(),
  interviewDate: z.coerce.date().optional(),
  notes: z.string().optional(),
});

export const selectApplicationSchema = z.object({
  offerSalary: z.string().min(1),
  startDate: z.coerce.date(),
  decisionStatus: z.enum(["OFFER_EXTENDED", "OFFER_ACCEPTED", "PLACEMENT_CONFIRMED"]),
  recruiterRemarks: z.string().optional(),
});
