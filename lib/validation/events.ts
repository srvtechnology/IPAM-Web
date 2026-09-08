import { z } from "zod";

export const registerForEventSchema = z.object({
  guestName: z.string().optional(),
});
