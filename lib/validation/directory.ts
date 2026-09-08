import { z } from "zod";

export const createAlumniRecordSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  regNo: z.string().min(1),
  degree: z.string().min(1),
  faculty: z.string().min(1),
  gradYear: z.coerce.number().int(),
  phone: z.string().optional(),
  nationalId: z.string().optional(),
  role: z
    .enum(["ALUMNI_MEMBER", "CORPORATE_RECRUITER", "DEPT_MODERATOR", "EXECUTIVE_COUNCIL"])
    .default("ALUMNI_MEMBER"),
});

export const updateAlumniRecordSchema = createAlumniRecordSchema.partial().extend({
  authStatus: z.enum(["OTP_VERIFIED", "BIOMETRIC_SYNCED", "PENDING_2FA", "UNVERIFIED"]).optional(),
  status: z.enum(["APPROVED", "PENDING", "FLAGGED"]).optional(),
  digitalPassIssued: z.boolean().optional(),
});
