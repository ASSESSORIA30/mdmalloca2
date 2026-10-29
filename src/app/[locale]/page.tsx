import type { Metadata } from "next";
import Link from "next/link";
import { Hero } from "@/components/home/Hero";
import { ResidenceIndex, type IndexItem } from "@/components/home/ResidenceIndex";
import { Compare } from "@/components/media/Compare";
import { FilmPlayer } from "@/components/media/FilmPlayer";
import { Plate } from "@/components/media/Plate";
import { PrivateCta } from "@/components/home/PrivateCta";
import { specRows } from "@/components/residence/Specs";
import { t } from "@/content/schema";
import { getProperties } from "@/lib/properties";
import { resolveLocale } from "@/lib/i18n-server";
import { paths } from "@/lib/paths";
import { alternates } from "@/lib/seo";
import { site } from "@/lib/site";

export async function generateMetadata({ params }: PageProps<"/[locale]">): Promise<Metadata> {
  const { locale, dict } = await resolveLocale(params);
  return {
    title: { absolute: `${dict.meta.siteName}` },
    description: dict.meta.defaultDescription,
    alternates: alternates(locale),
    openGraph: { images: ["/projects/_demo/horizon/hero.jpg"] },
  };
}

export default async function Home({ params }: PageProps<"/[locale]">) {
  const { locale, dict } = await resolveLocale(params);
  const properties = await getProperties();
  const lead = properties[0];
  const demo = site.demoMode ? dict.demo.badge : undefined;

  const items: IndexItem[] = properties.map((p) => ({
    slug: p.slug,
    name: p.name,
    zone: t(p.zone, locale),
    tagline: t(p.tagline, locale),
    href: paths.residence(locale, p.slug),
    image: p.media.hero,
    alt: t(p.media.hero.alt, locale),
    facts: specRows(p, locale, dict).map(({ label, value }) => ({ label, value })),
  }));

  const pair = properties.find((p) => p.media.terrain && p.media.render);
  const film = properties.find((p) => p.films.transformation)?.films.transformation;
  const landscape = {
    src: "/projects/_demo/landscape/hills-golden.jpg",
    alt: { en: "Demonstration plate: terraced olive landscape" },
    width: 2400,
    height: 1350,
    demo: true,
    focal: "50% 60%",
  };

  return (
    <>
      <Hero
        title={dict.hero.title}
        subtitle={dict.hero.subtitle}
        discover={{ href: paths.residences(locale), label: dict.hero.discover }}
        explore={{ href: "#transformation", label: dict.hero.explore }}
        scrollLabel={dict.hero.scroll}
        poster={lead.media.hero}
        posterPortrait={lead.media.heroPortrait}
        posterAlt={t(lead.media.hero.alt, locale)}
        film={lead.films.hero}
        demoLabel={lead.media.hero.demo ? demo : undefined}
        pauseLabel={dict.hero.pause}
        playLabel={dict.hero.play}
      />

      {/* The argument, in one paragraph */}
      <section data-surface="light" className="shell py-[clamp(6rem,14vw,12rem)]">
        <div className="grid gap-10 md:grid-cols-12">
          <h2 className="h2 md:col-span-6 md:col-start-2" data-reveal>
            {dict.manifesto.title}
          </h2>
          <div className="md:col-span-4 md:col-start-8 md:pt-3">
            <p className="lead text-mineral/85" data-reveal>
              {dict.manifesto.body}
            </p>
            <Link href={`#showroom`} className="link-line mt-6">
              {dict.manifesto.link}
            </Link>
          </div>
        </div>
      </section>

      {/* The collection */}
      <section data-surface="light" className="shell pb-[clamp(6rem,12vw,10rem)]" aria-labelledby="collection">
        <div className="mb-12 flex flex-col justify-between gap-6 md:mb-16 md:flex-row md:items-end">
          <div>
            <h2 id="collection" className="h2">{dict.index.title}</h2>
            <p className="mt-4 max-w-md text-ash">{dict.index.intro}</p>
          </div>
          <Link href={paths.residences(locale)} className="link-line self-start md:self-auto">
            {dict.index.all}
          </Link>
        </div>
        <ResidenceIndex items={items} enterLabel={dict.index.view} demoLabel={dict.demo.badge} />
      </section>

      {/* From untouched land to extraordinary living */}
      <section id="transformation" data-surface="dark" className="scroll-mt-0 bg-mineral py-[clamp(5rem,11vw,10rem)] text-stone" aria-labelledby="transformation-title">
        <div className="shell">
          <div className="grid gap-8 md:grid-cols-12">
            <h2 id="transformation-title" className="h2 md:col-span-7">{dict.transformation.title}</h2>
            <p className="max-w-sm text-warm-grey md:col-span-4 md:col-start-9 md:self-end">{dict.transformation.intro}</p>
          </div>
          {pair?.media.terrain && pair.media.render ? (
            <div className="mt-14 md:mt-20">
              <Compare
                before={pair.media.terrain}
                after={pair.media.render}
                beforeAlt={t(pair.media.terrain.alt, locale)}
                afterAlt={t(pair.media.render.alt, locale)}
                beforeLabel={dict.transformation.before}
                afterLabel={dict.transformation.after}
                handleLabel={dict.transformation.handle}
                demoLabel={pair.media.terrain.demo ? demo : undefined}
                sizes="(min-width: 1440px) 1300px, 92vw"
              />
              <p className="meta mt-4 text-warm-grey">
                {pair.name} · {dict.transformation.alignNote}
              </p>
            </div>
          ) : null}

          {film ? (
            <div className="mt-[clamp(5rem,10vw,9rem)]">
              <div className="mb-10 grid gap-6 md:grid-cols-12">
                <h3 className="h3 md:col-span-5">{dict.transformation.filmTitle}</h3>
                <p className="text-warm-grey md:col-span-4 md:col-start-9">{dict.transformation.filmIntro}</p>
              </div>
              <FilmPlayer film={film} labels={dict.film} demoLabel={demo} title={dict.transformation.filmTitle} />
            </div>
          ) : null}
        </div>
      </section>

      {/* The Private Showroom */}
      <section id="showroom" data-surface="dark" className="relative overflow-hidden bg-mineral-2 text-stone" aria-labelledby="showroom-title">
        <div className="shell grid gap-12 py-[clamp(5rem,11vw,10rem)] lg:grid-cols-12">
          <div className="lg:col-span-5">
            <h2 id="showroom-title" className="h2">{dict.showroom.title}</h2>
            <p className="lead mt-8 text-sand">{dict.showroom.intro}</p>
            <ol className="mt-10 grid grid-cols-2 gap-x-6 border-t border-stone/14 text-[0.9375rem] text-warm-grey">
              {Object.values(dict.showroom.chapters).map((c, i) => (
                <li key={c} className="num flex gap-4 border-b border-stone/10 py-3">
                  <span className="text-bronze">{String(i + 1).padStart(2, "0")}</span>
                  <span className="text-stone">{c}</span>
                </li>
              ))}
            </ol>
          </div>
          <div className="lg:col-span-6 lg:col-start-7">
            <p className="meta mb-4 text-warm-grey">{dict.showroom.choose}</p>
            <ul className="space-y-3">
              {properties.map((p) => (
                <li key={p.slug}>
                  <Link href={paths.residence(locale, p.slug)} className="group relative flex items-center gap-5 overflow-hidden rounded-[14px] border border-stone/10 p-3 pr-6 transition-colors duration-300 hover:border-stone/30">
                    <Plate media={p.media.hero} locale={locale} sizes="160px" className="aspect-[4/3] w-28 shrink-0 rounded-[8px] sm:w-36" />
                    <span className="flex-1">
                      <span className="h3 block text-[1.375rem]">{p.name}</span>
                      <span className="meta mt-1 block text-warm-grey">{t(p.zone, locale)}</span>
                    </span>
                    <span className="hidden text-[0.9375rem] text-sand transition-transform duration-300 ease-[var(--ease-out)] group-hover:translate-x-1 sm:block">{dict.showroom.enter}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* The island */}
      <section data-surface="light" className="py-[clamp(6rem,12vw,10rem)]" aria-labelledby="island-title">
        <div className="shell grid items-end gap-10 lg:grid-cols-12">
          <Plate media={landscape} locale={locale} sizes="(min-width: 1024px) 58vw, 100vw" demoLabel={demo} className="aspect-[4/3] lg:col-span-7" reveal />
          <div className="lg:col-span-4 lg:col-start-9 lg:pb-4">
            <h2 id="island-title" className="h2">{dict.experience.title}</h2>
            <p className="mt-6 text-mineral/80">{dict.experience.intro}</p>
            <Link href={paths.experience(locale)} className="link-line mt-6">
              {dict.experience.teaserLink}
            </Link>
          </div>
        </div>
      </section>

      <PrivateCta locale={locale} dict={dict} />
    </>
  );
}
