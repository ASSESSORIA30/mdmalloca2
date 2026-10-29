import type { MetadataRoute } from "next";
import { HREFLANG, LOCALES } from "@/i18n/config";
import { getProperties } from "@/lib/properties";
import { site } from "@/lib/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const properties = await getProperties();
  const routes = ["", "/residences", "/experience", "/contact", ...properties.map((p) => `/residences/${p.slug}`)];
  return routes.flatMap((r) =>
    LOCALES.map((l) => ({
      url: `${site.url}/${l}${r}`,
      changeFrequency: "weekly" as const,
      priority: r === "" ? 1 : r.startsWith("/residences/") ? 0.9 : 0.6,
      alternates: { languages: Object.fromEntries(LOCALES.map((x) => [HREFLANG[x], `${site.url}/${x}${r}`])) },
    })),
  );
}
