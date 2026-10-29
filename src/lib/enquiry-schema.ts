import { z } from "zod";

export const INTENTS = ["presentation", "dossier", "consultation", "call"] as const;

/** Shared by the form (client) and the API route (server). Error messages are keys into the dictionary. */
export const enquirySchema = z.object({
  intent: z.enum(INTENTS).default("presentation"),
  name: z.string().trim().min(2, "required").max(120),
  email: z.string().trim().max(200).email("email"),
  phonePrefix: z.string().regex(/^\+\d{1,4}$/).optional().or(z.literal("")),
  phone: z
    .string()
    .trim()
    .max(30)
    .regex(/^[\d\s().-]*$/, "phone")
    .optional()
    .or(z.literal("")),
  country: z.string().length(2).optional().or(z.literal("")),
  property: z.string().max(80).optional().or(z.literal("")),
  message: z.string().trim().max(3000).optional().or(z.literal("")),
  consent: z.literal(true, { error: "consent" }),
  locale: z.enum(["en", "es", "ca"]).default("en"),
  // anti-spam: honeypot must stay empty, form must have been open for a moment
  company: z.string().max(200).optional(),
  startedAt: z.number().optional(),
  turnstileToken: z.string().optional(),
});

export type Enquiry = z.infer<typeof enquirySchema>;
