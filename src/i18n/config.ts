import { LOCALES, type Locale } from "@/content/schema";

export { LOCALES, type Locale };

/** Initial language. Change to "es" or "ca" to switch the default. */
export const DEFAULT_LOCALE: Locale = (process.env.NEXT_PUBLIC_DEFAULT_LOCALE as Locale) || "en";

export const LOCALE_NAMES: Record<Locale, string> = { en: "English", es: "Español", ca: "Català" };
export const HREFLANG: Record<Locale, string> = { en: "en", es: "es-ES", ca: "ca-ES" };

export const isLocale = (v: string): v is Locale => (LOCALES as readonly string[]).includes(v);
