import { z } from "zod";

const channelEnum = z.enum(["SMS", "WHATSAPP", "EMAIL", "PUSH"]);

export const createTemplateSchema = z.object({
  type: z.enum(["MESSAGE", "INVITATION", "NOTIFICATION"]),
  name: z.string().min(1),
  title: z.string().min(1),
  message: z.string().min(1),
  channels: z.array(channelEnum).min(1),
  category: z.string().optional(),
  eventDate: z.coerce.date().optional(),
  eventVenue: z.string().optional(),
  rsvpDeadline: z.coerce.date().optional(),
  allowGuests: z.boolean().optional(),
  priority: z.enum(["NORMAL", "URGENT", "CRITICAL"]).optional(),
  actionUrl: z.string().optional(),
});

export const createAudienceGroupSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  criteria: z.object({
    faculties: z.array(z.string()).optional(),
    cohorts: z.array(z.string()).optional(),
    authStatuses: z.array(z.string()).optional(),
    chapter: z.string().optional(),
    digitalPassOnly: z.boolean().optional(),
  }),
  estimatedCount: z.number().int().optional(),
});

export const sendBroadcastSchema = z.object({
  type: z.enum(["MESSAGE", "INVITATION", "NOTIFICATION"]),
  title: z.string().min(1),
  message: z.string().min(1),
  audienceLabel: z.string().min(1),
  recipientsCount: z.number().int().min(0),
  channels: z.array(channelEnum).min(1),
  priority: z.enum(["NORMAL", "URGENT", "CRITICAL"]).optional(),
});
