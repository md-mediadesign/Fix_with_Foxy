import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Bitte gib eine gültige E-Mail-Adresse ein"),
  password: z.string().min(1, "Passwort ist erforderlich"),
});

export const registerClientSchema = z.object({
  name: z.string().min(2, "Name muss mindestens 2 Zeichen haben"),
  email: z.string().email("Bitte gib eine gültige E-Mail-Adresse ein"),
  password: z
    .string()
    .min(8, "Passwort muss mindestens 8 Zeichen haben"),
  city: z.string().min(2, "Stadt ist erforderlich"),
});

export const registerProviderSchema = z.object({
  name: z.string().min(2, "Name muss mindestens 2 Zeichen haben"),
  email: z.string().email("Bitte gib eine gültige E-Mail-Adresse ein"),
  password: z.string().min(8, "Passwort muss mindestens 8 Zeichen haben"),
  companyName: z.string().optional(),
  phone: z.string().min(5, "Telefonnummer ist erforderlich"),
  whatsappPhone: z.string().optional(),
  taxNumber: z.string().optional(),
  city: z.string().min(2, "Stadt ist erforderlich"),
  zipCode: z.string().optional(),
  description: z.string().optional(),
  serviceRadius: z.number().min(1).max(200),
  services: z.array(z.string()).optional().default([]),
  qualifications: z.array(z.string()).optional().default([]),
  portfolioImageUrls: z.array(z.string()).optional().default([]),
  categoryIds: z.array(z.string()).min(1, "Wähle mindestens eine Kategorie"),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterClientInput = z.infer<typeof registerClientSchema>;
export type RegisterProviderInput = z.infer<typeof registerProviderSchema>;
