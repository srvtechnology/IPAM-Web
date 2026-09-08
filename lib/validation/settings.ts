import { z } from "zod";

export const updateSettingsSchema = z.object({
  defaultTheme: z.enum(["dark", "light"]).optional(),
});
