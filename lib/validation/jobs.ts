import { z } from "zod";

export const applyToJobSchema = z.object({
  candidateName: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  degree: z.string().optional(),
  faculty: z.string().optional(),
  gradYear: z.coerce.number().int().optional(),
  experienceYears: z.coerce.number().int().min(0).default(0),
  linkedinUrl: z.string().max(500).optional(),
  coverNote: z.string().max(2000).optional(),
  skills: z.array(z.string()).optional(),
});

export const createJobSchema = z.object({
  title: z.string().min(1, "Job title is required"),
  company: z.string().min(1, "Company / Employer name is required"),
  companyLogo: z.string().optional(),
  country: z.string().optional(),
  state: z.string().optional(),
  city: z.string().optional(),
  location: z.string().optional(),
  type: z.enum(["FULL_TIME", "PART_TIME", "CONTRACT", "REMOTE"]).default("FULL_TIME"),
  workplaceType: z.enum(["REMOTE", "HYBRID", "ON_SITE"]).optional(),
  salary: z.string().optional(),
  salaryMin: z.coerce.number().optional(),
  salaryMax: z.coerce.number().optional(),
  currency: z.string().optional(),
  category: z
    .enum([
      "ENGINEERING",
      "DATA_AI",
      "FINANCE_BANKING",
      "OPERATIONS",
      "PRODUCT_DESIGN",
      "LEGAL_PUBLIC_POLICY",
    ])
    .default("ENGINEERING"),
  description: z.string().min(1, "Description is required"),
  responsibilities: z.array(z.string()).optional(),
  requirements: z.array(z.string()).min(1, "At least one requirement is needed"),
  benefits: z.array(z.string()).optional(),
  aboutCompany: z.string().optional(),
  experienceRequired: z.boolean().default(false),
  experienceLevel: z.string().optional(),
  hiringType: z.enum(["IMMEDIATE", "TILL_DATE"]).default("TILL_DATE"),
  positionsOpen: z.coerce.number().int().min(1).default(1),
  deadline: z.coerce.date().nullable().optional(),
  applyUrl: z.string().optional(),
  employerId: z.string().optional(),
});

export const updateJobSchema = createJobSchema.partial().extend({
  status: z
    .enum(["ACTIVE", "REVIEWING", "SHORTLISTING", "INTERVIEWING", "OFFER_EXTENDED", "CLOSED"])
    .optional(),
});

export const updateCandidateStatusSchema = z.object({
  status: z
    .enum(["APPLIED", "REVIEWING", "SHORTLISTED", "INTERVIEW_SCHEDULED", "SELECTED", "REJECTED"])
    .optional(),
  interviewDate: z.coerce.date().nullable().optional(),
  notes: z.string().optional(),
  matchScore: z.coerce.number().int().min(0).max(100).optional(),
  offerSalary: z.string().optional(),
  startDate: z.coerce.date().nullable().optional(),
  decisionStatus: z.enum(["OFFER_EXTENDED", "OFFER_ACCEPTED", "PLACEMENT_CONFIRMED"]).optional(),
  recruiterRemarks: z.string().optional(),
});
