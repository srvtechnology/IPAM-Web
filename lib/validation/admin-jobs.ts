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
  title: z.string().min(1, "Job title is required"),
  company: z.string().min(1, "Company / Employer name is required"),
  employerId: z.string().optional(),
  country: z.string().nullable().optional(),
  state: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  location: z.string().nullable().optional(),
  workMode: z.enum(["ON_SITE", "HYBRID", "REMOTE"]).nullable().optional(),
  workplaceType: z.enum(["ON_SITE", "HYBRID", "REMOTE"]).nullable().optional(),
  type: z.enum(["FULL_TIME", "PART_TIME", "CONTRACT", "REMOTE", "EXECUTIVE", "INTERNSHIP"]).default("FULL_TIME"),
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
  department: z.string().nullable().optional(),
  experienceRequired: z.boolean().default(false),
  experienceLevel: z.string().nullable().optional(),
  salaryRange: z.string().nullable().optional(),
  salary: z.string().nullable().optional(),
  salaryMin: z.coerce.number().nullable().optional(),
  salaryMax: z.coerce.number().nullable().optional(),
  currency: z.string().nullable().optional(),
  hiringType: z.enum(["IMMEDIATE", "TILL_DATE"]).default("TILL_DATE"),
  positionsOpen: z.coerce.number().int().min(1).default(1),
  status: z
    .enum(["ACTIVE", "REVIEWING", "SHORTLISTING", "INTERVIEWING", "OFFER_EXTENDED", "CLOSED"])
    .default("ACTIVE"),
  closingDate: z.coerce.date().nullable().optional(),
  deadline: z.coerce.date().nullable().optional(),
  verifiedOnly: z.boolean().default(false),
  aboutCompany: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  requirements: z.array(z.string()).nullable().optional(),
  skillsRequired: z.array(z.string()).nullable().optional(),
  benefits: z.array(z.string()).nullable().optional(),
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
  cvUrl: z.string().optional(),
  cvFileName: z.string().optional(),
  verifiedAlumnus: z.boolean().default(false),
});

export const updateJobApplicationSchema = z.object({
  status: z
    .enum(["APPLIED", "REVIEWING", "SHORTLISTED", "INTERVIEW_SCHEDULED", "SELECTED", "REJECTED"])
    .optional(),
  matchScore: z.coerce.number().int().optional(),
  interviewDate: z.coerce.date().nullable().optional(),
  notes: z.string().optional(),
  offerSalary: z.string().optional(),
  startDate: z.coerce.date().nullable().optional(),
  decisionStatus: z.enum(["OFFER_EXTENDED", "OFFER_ACCEPTED", "PLACEMENT_CONFIRMED"]).optional(),
  recruiterRemarks: z.string().optional(),
});

export const selectApplicationSchema = z.object({
  offerSalary: z.string().min(1),
  startDate: z.coerce.date(),
  decisionStatus: z.enum(["OFFER_EXTENDED", "OFFER_ACCEPTED", "PLACEMENT_CONFIRMED"]),
  recruiterRemarks: z.string().optional(),
});
