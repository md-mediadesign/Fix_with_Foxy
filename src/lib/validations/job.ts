import { z } from "zod";

export const createJobSchema = z.object({
  categoryId: z.string().min(1, "Kategorie ist erforderlich"),
  title: z
    .string()
    .min(5, "Titel muss mindestens 5 Zeichen haben")
    .max(100, "Titel darf maximal 100 Zeichen haben"),
  description: z
    .string()
    .min(20, "Beschreibung muss mindestens 20 Zeichen haben")
    .max(2000, "Beschreibung darf maximal 2000 Zeichen haben"),
  city: z.string().min(2, "Stadt ist erforderlich"),
  zipCode: z.string().min(4, "PLZ ist erforderlich"),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  budgetMin: z.number().min(0).optional(),
  budgetMax: z.number().min(0).optional(),
  desiredDate: z.string().optional(),
  urgency: z.enum(["low", "normal", "high", "urgent"]).optional(),
});

export const createBidSchema = z.object({
  jobId: z.string().min(1),
  amount: z.number().min(1, "Betrag muss mindestens 1€ sein"),
  message: z
    .string()
    .min(10, "Nachricht muss mindestens 10 Zeichen haben")
    .max(1000, "Nachricht darf maximal 1000 Zeichen haben"),
  estimatedDays: z.number().min(1).optional(),
});

export const createReviewSchema = z.object({
  jobId: z.string().min(1),
  rating: z.number().min(1).max(5),
  title: z.string().max(100).optional(),
  comment: z.string().max(1000).optional(),
});

export type CreateJobInput = z.infer<typeof createJobSchema>;
export type CreateBidInput = z.infer<typeof createBidSchema>;
export type CreateReviewInput = z.infer<typeof createReviewSchema>;
