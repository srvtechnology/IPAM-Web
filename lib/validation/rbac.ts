import { z } from "zod";

const capabilitySchema = z.object({
  canRead: z.boolean().default(false),
  canWrite: z.boolean().default(false),
  canApprove: z.boolean().default(false),
  canExport: z.boolean().default(false),
  canDelete: z.boolean().default(false),
});

const moduleEnum = z.enum([
  "DIRECTORY",
  "ID_CARDS",
  "BROADCAST",
  "JOBS",
  "COMMERCIAL",
  "FINANCE",
  "SIS_SYNC",
  "AUDIT_TRAILS",
  "RBAC_GOVERNANCE",
  "SYSTEM_SETTINGS",
]);

export const badgeColorEnum = z.enum(["PRIMARY", "SECONDARY", "TERTIARY", "ERROR", "OUTLINE"]);

export const createRoleSchema = z.object({
  name: z.string().min(1),
  slug: z
    .string()
    .min(1)
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase kebab-case"),
  description: z.string().min(1),
  badgeColor: badgeColorEnum.optional(),
  priorityLevel: z.coerce.number().int().min(1).max(100),
  permissions: z.array(z.object({ module: moduleEnum }).merge(capabilitySchema)).min(1),
});

export const updateRoleSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  badgeColor: badgeColorEnum.optional(),
  priorityLevel: z.coerce.number().int().min(1).max(100).optional(),
  permissions: z.array(z.object({ module: moduleEnum }).merge(capabilitySchema)).optional(),
});

export const createAdminUserSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
  phone: z.string().optional(),
  department: z.string().min(1),
  title: z.string().min(1),
  roleId: z.string().min(1),
});

export const updateAdminUserSchema = z.object({
  name: z.string().min(1).optional(),
  phone: z.string().optional(),
  department: z.string().min(1).optional(),
  title: z.string().min(1).optional(),
  roleId: z.string().min(1).optional(),
  status: z.enum(["ACTIVE", "SUSPENDED", "PENDING_ACTIVATION"]).optional(),
  customPermissionOverrides: z
    .record(z.string(), capabilitySchema.partial())
    .nullable()
    .optional(),
});
