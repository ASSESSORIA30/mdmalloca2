import { z } from "zod";

/**
 * Content model for residences. Every property lives in
 * /content/properties/<slug>.json and is validated against this schema at
 * build time (and in /admin). The same documents can be stored as JSONB rows
 * in Supabase (see supabase/migrations) — the schema does not change.
 */

export const LOCALES = ["en", "es", "ca"] as const;
export type Locale = (typeof LOCALES)[number];

export const localized = z.object({
  en: z.string(),
  es: z.string().optional(),
  ca: z.string().optional(),
});
export type Localized = z.infer<typeof localized>;

export const media = z.object({
  src: z.string(),
  alt: localized,
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  /** true for provisional / demonstration content — shown with a visible mark */
  demo: z.boolean().default(false),
  /** CSS object-position — keeps the important part of a render in frame */
  focal: z.string().default("50% 50%"),
  credit: z.string().optional(),
  caption: localized.optional(),
});
export type Media = z.infer<typeof media>;

export const galleryItem = media.extend({
  category: z.enum(["exterior", "interior", "architecture", "lifestyle", "construction"]),
});
export type GalleryItem = z.infer<typeof galleryItem>;

export const video = z.object({
  /** H.264 MP4 (required) — add a WebM/AV1 source for smaller files */
  mp4: z.string(),
  webm: z.string().optional(),
  /** lighter encode served below 768px */
  mobileMp4: z.string().optional(),
  poster: z.string(),
  durationSeconds: z.number().optional(),
  demo: z.boolean().default(false),
  title: localized.optional(),
});
export type Video = z.infer<typeof video>;

const measure = z.object({ value: z.number().positive(), unit: z.enum(["m²", "ha"]) }).nullable();

export const architectureSection = z.object({
  id: z.enum(["concept", "materials", "indoor-outdoor", "light", "landscape", "living", "energy", "construction"]),
  title: localized,
  body: localized,
  image: media.optional(),
  /** only verified sections are published; unverified ones are hidden in production */
  verified: z.boolean().default(false),
});

export const tourScene = z.object({
  id: z.string(),
  title: localized,
  /** equirectangular 2:1 panorama — never a flat photo */
  panorama: z.string(),
  /** thumbnail for the room switcher */
  thumbnail: z.string().optional(),
  links: z.array(z.object({ to: z.string(), yaw: z.number(), pitch: z.number().default(0) })).default([]),
  /** position on the orientation plan, 0–1 relative to the plan image */
  planPosition: z.tuple([z.number(), z.number()]).optional(),
  initialYaw: z.number().default(0),
});

export const property = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/),
  order: z.number().default(0),
  published: z.boolean().default(true),
  /** the whole record is demonstration content */
  demo: z.boolean().default(false),
  name: z.string(),
  tagline: localized,
  municipality: localized,
  zone: localized,
  summary: localized,
  location: z.object({
    lat: z.number().min(38.5).max(40.5),
    lng: z.number().min(1).max(4.5),
    /** 'approximate' shows an area, never a pin */
    precision: z.enum(["exact", "approximate"]),
    radiusMeters: z.number().default(1200),
    note: localized.optional(),
  }),
  specs: z.object({
    plotArea: measure,
    builtArea: measure,
    bedrooms: z.number().int().nullable(),
    bathrooms: z.number().int().nullable(),
    /** figures are indicative and pending confirmation */
    illustrative: z.boolean().default(true),
  }),
  price: z.object({
    mode: z.enum(["on-request", "amount"]),
    amount: z.number().nullable().default(null),
    currency: z.literal("EUR").default("EUR"),
    /** must be true before an amount is ever shown */
    confirmed: z.boolean().default(false),
  }),
  status: z.object({
    value: z.enum(["available", "reserved", "sold", "coming-soon", "in-preparation"]),
    confirmed: z.boolean().default(false),
  }),
  features: z.array(localized).default([]),
  architecture: z.array(architectureSection).default([]),
  media: z.object({
    hero: media,
    heroPortrait: media.optional(),
    /** before/after pair: same camera position, same lens */
    terrain: media.optional(),
    render: media.optional(),
    gallery: z.array(galleryItem).default([]),
  }),
  films: z.object({ hero: video.optional(), transformation: video.optional() }).default({}),
  model3d: z
    .discriminatedUnion("type", [
      z.object({ type: z.literal("maquette"), variant: z.enum(["horizon", "patio", "terraces"]), demo: z.literal(true) }),
      z.object({ type: z.literal("glb"), src: z.string(), poster: z.string().optional(), demo: z.boolean().default(false) }),
      z.object({ type: z.literal("iframe"), src: z.string(), demo: z.boolean().default(false) }),
    ])
    .optional(),
  tour: z.object({ scenes: z.array(tourScene).min(1), plan: z.string().optional(), demo: z.boolean().default(false) }).optional(),
  plans: z
    .array(z.object({ id: z.string(), title: localized, src: z.string(), width: z.number(), height: z.number(), demo: z.boolean().default(false) }))
    .default([]),
  seo: z.object({ title: localized.optional(), description: localized.optional() }).default({}),
});

export type Property = z.infer<typeof property>;
export type PropertyInput = z.input<typeof property>;

export function t(value: Localized | undefined, locale: Locale): string {
  if (!value) return "";
  return value[locale] ?? value.en;
}
