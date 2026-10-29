import type { Metadata } from "next";
import { HREFLANG, LOCALES, DEFAULT_LOCALE, type Locale } from "@/i18n/config";
import { site } from "./site";

/** Canonical + hreflang alternates for a path that exists in every locale (path without locale prefix). */
export function alternates(locale: Locale, path = ""): Metadata["alternates"] {
  const languages: Record<string, string> = {};
  for (const l of LOCALES) languages[HREFLANG[l]] = `${site.url}/${l}${path}`;
  languages["x-default"] = `${site.url}/${DEFAULT_LOCALE}${path}`;
  return { canonical: `${site.url}/${locale}${path}`, languages };
}
