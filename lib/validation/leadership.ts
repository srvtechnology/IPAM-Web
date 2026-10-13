import { z } from "zod";

export const createLeadershipSchema = z.object({
  name: z.string().min(1, "Name is required"),
  role: z.string().min(1, "Role is required"),
  classYear: z.string().min(1, "Class year is required"),
  image: z.string().nullable().optional(),
  bio: z.string().min(1, "Bio is required"),
  quote: z.string().min(1, "Quote is required"),
  email: z.string().email("Valid email is required"),
  initiatives: z.array(z.string()).optional().default([]),
});

export const updateLeadershipSchema = createLeadershipSchema.partial();

export type CreateLeadershipInput = z.infer<typeof createLeadershipSchema>;
export type UpdateLeadershipInput = z.infer<typeof updateLeadershipSchema>;
