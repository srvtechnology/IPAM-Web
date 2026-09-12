import { z } from "zod";

export const createPhysicalCardOrderSchema = z.object({
  cardTier: z.enum(["STANDARD_PVC", "GOLD_RFID_SMART", "EXECUTIVE_TITANIUM"]).default("STANDARD_PVC"),
  deliveryAddress: z.string().min(1),
});
