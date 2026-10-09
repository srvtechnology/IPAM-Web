import { z } from "zod";

export const eventCategoryEnum = z.enum([
  "GALA",
  "WEBINAR",
  "REGIONAL_MEETUP",
  "NETWORKING",
  "CAREER_WORKSHOP",
]);

export const eventStatusEnum = z.enum(["DRAFT", "PUBLISHED", "COMPLETED", "CANCELLED"]);

export const agendaItemSchema = z.object({
  time: z.string(),
  activity: z.string(),
  speaker: z.string().optional().nullable(),
});

export const speakerItemSchema = z.object({
  name: z.string(),
  title: z.string(),
  image: z.string().optional(),
  company: z.string().optional(),
});

export const faqItemSchema = z.object({
  question: z.string(),
  answer: z.string(),
});

export const createEventSchema = z.object({
  title: z.string().min(1, "Title is required"),
  category: eventCategoryEnum.default("NETWORKING"),
  date: z.string().or(z.date()),
  displayDate: z.string().min(1, "Display date is required"),
  time: z.string().min(1, "Time is required"),
  location: z.string().min(1, "Location is required"),
  venueDetails: z.string().optional().nullable(),
  isVirtual: z.boolean().default(false),
  virtualLink: z.string().optional().nullable(),
  isPaid: z.boolean().default(false),
  ticketPrice: z.number().min(0).default(0),
  currency: z.enum(["USD", "SLE"]).default("USD"),
  capacity: z.number().int().min(1, "Capacity must be at least 1"),
  dressCode: z.string().optional().nullable(),
  description: z.string().min(1, "Description is required"),
  bannerImage: z.string().optional().nullable(),
  bannerImages: z.array(z.string()).optional().nullable(),
  agenda: z.array(agendaItemSchema).optional().nullable(),
  speakers: z.array(speakerItemSchema).optional().nullable(),
  highlights: z.array(z.string()).optional().nullable(),
  faqs: z.array(faqItemSchema).optional().nullable(),
  status: eventStatusEnum.default("PUBLISHED"),
  featured: z.boolean().default(false),
});

export const updateEventSchema = createEventSchema.partial();

export const createBookingSchema = z.object({
  eventId: z.string().min(1, "Event is required"),
  userId: z.string().optional().nullable(),
  attendeeName: z.string().min(2, "Attendee name is required"),
  attendeeEmail: z.string().email("Valid email is required"),
  attendeePhone: z.string().optional().nullable(),
  ticketCount: z.number().int().min(1).default(1),
  unitPrice: z.number().min(0).optional(),
  totalAmount: z.number().min(0).optional(),
  currency: z.enum(["USD", "SLE"]).default("USD"),
  paymentStatus: z.enum(["FREE", "PAID", "PENDING", "REFUNDED"]).default("FREE"),
  paymentMethod: z
    .enum(["FREE", "STRIPE", "OFFLINE_CASH", "BANK_TRANSFER", "COMPLIMENTARY"])
    .default("FREE"),
  paymentRef: z.string().optional().nullable(),
  bookingStatus: z.enum(["CONFIRMED", "ATTENDED", "CANCELLED"]).default("CONFIRMED"),
  notes: z.string().optional().nullable(),
  source: z.enum(["SELF_SERVICE", "ADMIN_DESK"]).default("ADMIN_DESK"),
});

export const updateBookingSchema = z.object({
  bookingStatus: z.enum(["CONFIRMED", "ATTENDED", "CANCELLED"]).optional(),
  paymentStatus: z.enum(["FREE", "PAID", "PENDING", "REFUNDED"]).optional(),
  paymentMethod: z
    .enum(["FREE", "STRIPE", "OFFLINE_CASH", "BANK_TRANSFER", "COMPLIMENTARY"])
    .optional(),
  paymentRef: z.string().optional().nullable(),
  attendedAt: z.string().or(z.date()).optional().nullable(),
  notes: z.string().optional().nullable(),
});
