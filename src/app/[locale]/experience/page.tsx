import type { Metadata } from "next";
import Image from "next/image";
import fs from "node:fs/promises";
import path from "node:path";
import { cacheLife } from "next/cache";
import { Plate } from "@/components/media/Plate";
import { PrivateCta } from "@/components/home/PrivateCta";
import { localized, media, t } from "@/content/schema";
import { z } from "zod";
import { resolveLocale } from "@/lib/i18n-server";
import { alternates } from "@/lib/seo";
import { site } from "@/lib/site";

const experienceSchema = z.object({
  modules: z.array(
    z.object({
      id: z.string(),
      layout: z.enum(["wide", "split", "text", "quote"]),
      verified: z.boolean(),
      title: localized,
      body: localized,
      image: media.optional(),
    }),
  ),
});

async function getExperience() {
  "use cache";
  cacheLife("hours");
  const raw = await fs.readFile(path.join(process.cwd(), "content", "experience.json"), "utf8");
  return experienceSchema.parse(JSON.parse(raw));
}

export async function generateMetadata({ params }: PageProps<"/[locale]/experience">): Promise<Metadata> {
  const { locale, dict } = await resolveLocale(params);
  return { title: dict.experience.navTitle, description: dict.experience.intro, alternates: alternates(locale, "/experience") };
}

export default async function Experience({ params }: PageProps<"/[locale]/experience">) {
  const { locale, dict } = await resolveLocale(params);
  const { modules } = await getExperience();
  const shown = modules.filter((m) => m.verified || site.demoMode);
  const demo = site.demoMode ? dict.demo.badge : undefined;
  const textModules = shown.filter((m) => m.layout === "text");

  return (
    <>
      <section data-surface="dark" className="relative flex min-h-[92svh] items-end overflow-hidden bg-mineral text-stone">
        <Image src="/projects/_demo/landscape/sea-dusk.jpg" alt="" fill priority sizes="100vw" className="object-cover" />
        <div aria-hidden className="absolute inset-0 bg-[linear-gradient(180deg,rgb(22_23_21/0.35),rgb(22_23_21/0)_30%,rgb(22_23_21/0.75))]" />
        <div className="shell relative pb-16">
          <h1 className="display max-w-[12ch]">{dict.experience.title}</h1>
          <p className="lead mt-8 max-w-xl text-sand">{dict.experience.intro}</p>
          {demo ? <span className="demo-mark mt-8">{demo}</span> : null}
        </div>
      </section>

      <div data-surface="light" className="bg-stone">
        {shown.map((m, i) => {
          if (m.layout === "text") return null;
          if (m.layout === "quote")
            return (
              <blockquote key={m.id} className="shell py-[clamp(6rem,12vw,10rem)]">
                <span aria-hidden className="horizon mb-10 w-16" />
                <p className="display max-w-[18ch] text-[clamp(2.5rem,5.6vw,4.75rem)]">{t(m.body, locale)}</p>
              </blockquote>
            );
          if (m.layout === "wide" && m.image)
            return (
              <article key={m.id} className="py-[clamp(4rem,8vw,7rem)]">
                <Plate media={m.image} locale={locale} sizes="100vw" demoLabel={demo} className="aspect-[4/5] sm:aspect-[21/9]" reveal />
                <div className="shell mt-10 grid gap-6 md:grid-cols-12">
                  <h2 className="h2 md:col-span-5">{t(m.title, locale)}</h2>
                  <div className="md:col-span-5 md:col-start-8">
                    <p className="lead text-mineral/80">{t(m.body, locale)}</p>
                    {!m.verified ? <p className="meta mt-4 text-bronze-deep">{dict.experience.pending}</p> : null}
                  </div>
                </div>
              </article>
            );
          return (
            <article key={m.id} className="shell grid items-center gap-10 py-[clamp(4rem,8vw,7rem)] lg:grid-cols-12">
              {m.image ? <Plate media={m.image} locale={locale} sizes="(min-width: 1024px) 50vw, 100vw" demoLabel={demo} className={`aspect-[4/5] lg:col-span-6 ${i % 2 ? "lg:order-2 lg:col-start-7" : ""}`} reveal /> : null}
              <div className={`lg:col-span-4 ${i % 2 ? "lg:order-1 lg:col-start-1 lg:row-start-1" : "lg:col-start-8"}`}>
                <h2 className="h2">{t(m.title, locale)}</h2>
                <p className="lead mt-6 text-mineral/80">{t(m.body, locale)}</p>
                {!m.verified ? <p className="meta mt-4 text-bronze-deep">{dict.experience.pending}</p> : null}
              </div>
            </article>
          );
        })}

        <section className="shell border-t border-mineral/12 py-[clamp(5rem,10vw,8rem)]">
          <div className="grid gap-x-10 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
            {textModules.map((m) => (
              <article key={m.id}>
                <h2 className="h3">{t(m.title, locale)}</h2>
                <p className="mt-4 text-mineral/80">{t(m.body, locale)}</p>
                {!m.verified ? <p className="meta mt-3 text-bronze-deep">{dict.experience.pending}</p> : null}
              </article>
            ))}
          </div>
          <p className="meta mt-16 max-w-xl text-ash">{dict.experience.pendingNote}</p>
        </section>
      </div>
      <PrivateCta locale={locale} dict={dict} />
    </>
  );
}
