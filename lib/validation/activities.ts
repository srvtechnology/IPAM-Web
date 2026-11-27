import { z } from "zod";

export const createActivitySchema = z.object({
  title: z.string().trim().min(2, "Title must be at least 2 characters"),
  description: z.string().trim().min(5, "Description must be at least 5 characters"),
  status: z.enum(["CURRENT", "PREVIOUS"]).default("CURRENT"),
  displayDate: z.string().trim().optional().nullable(),
  location: z.string().trim().optional().nullable(),
  category: z.string().trim().optional().nullable(),
  photos: z.array(z.string().min(1)).min(1, "Please add at least one photo"),
  featured: z.boolean().optional().default(false),
  sortOrder: z.coerce.number().int().optional().default(0),
});

export const updateActivitySchema = createActivitySchema.partial();

export interface AlumniActivityItem {
  id: string;
  title: string;
  description: string;
  status: "CURRENT" | "PREVIOUS";
  displayDate: string | null;
  location: string | null;
  category: string | null;
  photos: string[];
  featured: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export function normalizeActivityPhotos(raw: unknown): string[] {
  if (Array.isArray(raw)) {
    return raw.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
  }
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
      }
    } catch {
      return raw.trim() ? [raw.trim()] : [];
    }
  }
  return [];
}
