import type { Locale } from "@/i18n/config";

export const paths = {
  home: (l: Locale) => `/${l}`,
  residences: (l: Locale) => `/${l}/residences`,
  residence: (l: Locale, slug: string) => `/${l}/residences/${slug}`,
  experience: (l: Locale) => `/${l}/experience`,
  contact: (l: Locale) => `/${l}/contact`,
  legal: (l: Locale, doc: "privacy" | "legal-notice" | "cookies") => `/${l}/legal/${doc}`,
};

export function swapLocale(pathname: string, next: Locale) {
  const parts = pathname.split("/");
  parts[1] = next;
  return parts.join("/") || `/${next}`;
}
