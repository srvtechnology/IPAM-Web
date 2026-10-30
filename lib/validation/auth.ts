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
  isMentor: z.coerce.boolean().default(false),
  otp: z.string().default("123456"),
  isResubmission: z.boolean().optional(),
});

export const alumniLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  rememberMe: z.boolean().default(true),
  // Direct device push token parameters for mobile apps
  deviceToken: z.string().min(10).optional(),
  fcmToken: z.string().min(10).optional(),
  platform: z.enum(["android", "ios", "web"]).optional(),
  deviceName: z.string().max(100).optional(),
  appVersion: z.string().max(50).optional(),
  subscribeToAll: z.boolean().optional(),
  // Nested device object structure
  device: z
    .object({
      token: z.string().min(10, "FCM registration token is required"),
      platform: z.enum(["android", "ios", "web"]).default("android"),
      deviceName: z.string().max(100).optional(),
      appVersion: z.string().max(50).optional(),
      subscribeToAll: z.boolean().default(true),
    })
    .optional(),
});

export const adminLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});
