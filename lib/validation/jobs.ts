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
  cvUrl: z.string().optional(),
  cvFileName: z.string().max(255).optional(),
});

export const createJobSchema = z.object({
  title: z.string().min(1, "Job title is required"),
  company: z.string().min(1, "Company / Employer name is required"),
  companyLogo: z.string().nullable().optional(),
  country: z.string().nullable().optional(),
  state: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  location: z.string().nullable().optional(),
  type: z.enum(["FULL_TIME", "PART_TIME", "CONTRACT", "REMOTE"]).default("FULL_TIME"),
  workplaceType: z.enum(["REMOTE", "HYBRID", "ON_SITE"]).nullable().optional(),
  salary: z.string().nullable().optional(),
  salaryMin: z.coerce.number().nullable().optional(),
  salaryMax: z.coerce.number().nullable().optional(),
  currency: z.string().nullable().optional(),
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
  description: z.string().optional().default("Exciting career opening on IPAM Career Network."),
  responsibilities: z.array(z.string()).nullable().optional().default([]),
  requirements: z
    .array(z.string())
    .optional()
    .default(["Relevant qualifications or equivalent practical experience"]),
  benefits: z.array(z.string()).nullable().optional().default([]),
  aboutCompany: z.string().nullable().optional(),
  experienceRequired: z.boolean().default(false),
  experienceLevel: z.string().nullable().optional(),
  hiringType: z.enum(["IMMEDIATE", "TILL_DATE"]).default("TILL_DATE"),
  positionsOpen: z.coerce.number().int().min(1).default(1),
  deadline: z.coerce.date().nullable().optional(),
  applyUrl: z.string().nullable().optional(),
  employerId: z.string().nullable().optional(),
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
