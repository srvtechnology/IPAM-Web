import { z } from "zod";

export const heroSlideSchema = z.object({
  imageUrl: z.string().min(1, "Image URL is required"),
  title: z.string().min(1, "Headline title is required"),
  subtitle: z.string().optional().default(""),
  badge: z.string().optional().default("University of Sierra Leone • IPAM Global Network"),
  caption: z.string().optional().default(""),
  altText: z.string().optional().default(""),
  order: z.coerce.number().int().default(1),
  active: z.boolean().default(true),
  ctaText: z.string().optional().default("Join Alumni Network"),
  ctaLink: z.string().optional().default("/register"),
});

export const updateHeroSlideSchema = heroSlideSchema.partial();

export const reorderHeroSlidesSchema = z.object({
  slideIds: z.array(z.string()).min(1, "Slide IDs are required"),
});
