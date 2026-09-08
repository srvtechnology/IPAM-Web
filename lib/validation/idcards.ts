import { z } from "zod";

export const createIdCardOrderSchema = z.object({
  alumniRecordId: z.string().optional(),
  studentName: z.string().min(1),
  regNo: z.string().min(1),
  deliveryAddress: z.string().min(1),
  courierType: z.enum(["DHL_EXPRESS_RUSH", "INTL_AIR_CARGO", "CAMPUS_DESK", "PROVINCIAL_POST"]),
  cardTier: z.enum(["STANDARD_PVC", "GOLD_RFID_SMART", "EXECUTIVE_TITANIUM"]),
  faculty: z.string().optional(),
  degree: z.string().optional(),
  gradYear: z.coerce.number().int().optional(),
});

export const updateIdCardOrderSchema = z.object({
  status: z
    .enum(["IN_PRINT_PRESS", "QUALITY_CHECK", "READY_COURIER", "DISPATCHED", "DELIVERED", "COLLECTED"])
    .optional(),
  trackingCode: z.string().optional(),
  notes: z.string().optional(),
});
