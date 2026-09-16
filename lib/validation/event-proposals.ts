import { z } from "zod";

export const createEventProposalSchema = z.object({
  title: z.string().min(1),
  category: z.enum(["GALA", "WEBINAR", "REGIONAL_MEETUP", "NETWORKING", "CAREER_WORKSHOP"]),
  format: z.string().min(1),
  targetDate: z.preprocess((v) => (v === "" ? undefined : v), z.coerce.date().optional()),
  location: z.string().optional(),
  description: z.string().min(1),
  organizerEmail: z.string().email(),
});
