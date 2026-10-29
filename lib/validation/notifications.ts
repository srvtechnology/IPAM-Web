import { z } from "zod";

export const registerDeviceTokenSchema = z.object({
  token: z.string().min(10, "FCM registration token is required"),
  platform: z.enum(["android", "ios", "web"]).default("android"),
  deviceName: z.string().max(100).optional(),
  appVersion: z.string().max(50).optional(),
  subscribeToAll: z.boolean().default(true),
});

export const unregisterDeviceTokenSchema = z.object({
  token: z.string().min(10, "FCM registration token is required"),
});

export const testPushNotificationSchema = z.object({
  token: z.string().optional(),
  topic: z.string().optional(),
  title: z.string().min(1).default("Test IPAM Notification"),
  message: z.string().min(1).default("Firebase Cloud Messaging is active and operational!"),
  priority: z.enum(["NORMAL", "HIGH", "URGENT", "CRITICAL"]).default("NORMAL"),
  actionUrl: z.string().optional(),
});

