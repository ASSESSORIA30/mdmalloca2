import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BackgroundFilm } from "@/components/media/BackgroundFilm";
import { Compare } from "@/components/media/Compare";
import { FilmPlayer } from "@/components/media/FilmPlayer";
import { Plate } from "@/components/media/Plate";
import { ChapterNav } from "@/components/residence/ChapterNav";
import { Gallery, type GalleryEntry } from "@/components/residence/Gallery";
import { PlanViewer } from "@/components/residence/PlanViewer";
import { Specs } from "@/components/residence/Specs";
import { EnquiryForm } from "@/components/forms/EnquiryForm";
import { ModelChapter } from "@/components/viewers/ModelChapter";
import { TourChapter } from "@/components/viewers/TourChapter";
import { LocationChapter } from "@/components/viewers/LocationChapter";
import { t, type Locale, type Property } from "@/content/schema";
import type { Dictionary } from "@/i18n/en";
import { LOCALES } from "@/i18n/config";
import { getProperties, getProperty } from "@/lib/properties";
import { resolveLocale } from "@/lib/i18n-server";
import { paths } from "@/lib/paths";
import { alternates } from "@/lib/seo";
import { site } from "@/lib/site";

// Every known slug is prerendered; unknown slugs may block before 404.
export const instant = false;

export async function generateStaticParams() {
  const properties = await getProperties();
  return LOCALES.flatMap((locale) => properties.map((p) => ({ locale, slug: p.slug })));
}

export async function generateMetadata({ params }: PageProps<"/[locale]/residences/[slug]">): Promise<Metadata> {
  const { locale } = await resolveLocale(params);
  const { slug } = await params;
  const p = await getProperty(slug);
  if (!p) return {};
  const description = t(p.seo.description, locale) || t(p.tagline, locale);
  return {
    title: t(p.seo.title, locale) || p.name,
    description,
    alternates: alternates(locale, `/residences/${p.slug}`),
    openGraph: { title: p.name, description, images: [{ url: p.media.hero.src, width: p.media.hero.width, height: p.media.hero.height }] },
  };
}

function jsonLd(p: Property, locale: Locale) {
  const data: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "SingleFamilyResidence",
    name: p.name,
    description: t(p.summary, locale),
    url: `${site.url}${paths.residence(locale, p.slug)}`,
    image: `${site.url}${p.media.hero.src}`,
    address: { "@type": "PostalAddress", addressRegion: "Illes Balears", addressCountry: "ES" },
  };
  if (p.location.precision === "exact") data.geo = { "@type": "GeoCoordinates", latitude: p.location.lat, longitude: p.location.lng };
  if (!p.specs.illustrative) {
    if (p.specs.bedrooms) data.numberOfRooms = p.specs.bedrooms;
    if (p.specs.builtArea) data.floorSize = { "@type": "QuantitativeValue", value: p.specs.builtArea.value, unitCode: "MTK" };
  }
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

function ChapterHead({ n, title, intro, dark }: { n: number; title: string; intro?: string; dark?: boolean }) {
  return (
    <div className="mb-12 grid gap-6 md:mb-16 md:grid-cols-12">
      <h2 className="h2 flex items-baseline gap-5 md:col-span-7">
        <span className={`num font-sans text-[0.9375rem] font-normal tracking-normal ${dark ? "text-bronze" : "text-bronze-deep"}`}>{String(n).padStart(2, "0")}</span>
        {title}
      </h2>
      {intro ? <p className={`md:col-span-4 md:col-start-9 md:self-end ${dark ? "text-warm-grey" : "text-ash"}`}>{intro}</p> : null}
    </div>
  );
}

export default async function Showroom({ params }: PageProps<"/[locale]/residences/[slug]">) {
  const { locale, dict } = await resolveLocale(params);
  const { slug } = await params;
  const p = await getProperty(slug);
  if (!p) notFound();
  const all = await getProperties();
  const next = all[(all.findIndex((x) => x.slug === p.slug) + 1) % all.length];
  const demo = site.demoMode ? dict.demo.badge : undefined;

  const film = p.films.transformation ?? p.films.hero;
  const architecture = p.architecture.filter((a) => a.verified || site.demoMode);
  const gallery: GalleryEntry[] = p.media.gallery.map((g) => ({ ...g, altText: t(g.alt, locale), captionText: g.caption ? t(g.caption, locale) : undefined }));

  // Chapters appear only when there is something real (or clearly demonstrative) to show.
  const chapters: { id: string; title: string }[] = [];
  const c = dict.showroom.chapters;
  if (film || (p.media.terrain && p.media.render)) chapters.push({ id: "film", title: c.film });
  chapters.push({ id: "architecture", title: c.architecture });
  if (gallery.length) chapters.push({ id: "gallery", title: c.gallery });
  if (p.model3d) chapters.push({ id: "model", title: c.model });
  chapters.push({ id: "tour", title: c.tour });
  chapters.push({ id: "plans", title: c.plans });
  chapters.push({ id: "location", title: c.location });
  chapters.push({ id: "presentation", title: c.presentation });
  const n = (id: string) => chapters.findIndex((x) => x.id === id) + 1;

  const viewNames = { ...dict.model.viewNames } as Record<string, string>;

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(p, locale) }} />

      {/* Arrival */}
      <section data-surface="dark" className="relative flex min-h-[100svh] flex-col justify-end overflow-hidden bg-mineral text-stone">
        <Plate media={p.media.hero} locale={locale} sizes="100vw" priority className="!absolute inset-0" />
        <BackgroundFilm film={p.films.hero} pauseLabel={dict.hero.pause} playLabel={dict.hero.play} showControl={false} />
        <div aria-hidden className="absolute inset-0 bg-[linear-gradient(180deg,rgb(22_23_21/0.4)_0%,rgb(22_23_21/0)_25%,rgb(22_23_21/0.15)_50%,rgb(22_23_21/0.85)_100%)]" />
        <div className="shell relative pb-12 pt-40">
          <Link href={paths.residences(locale)} className="link-line meta text-sand">
            {dict.showroom.back}
          </Link>
          <h1 className="display mt-4 max-w-[12ch]">{p.name}</h1>
          <div className="mt-8 grid gap-10 lg:grid-cols-12 lg:items-end">
            <div className="lg:col-span-5">
              <p className="lead text-sand">{t(p.tagline, locale)}</p>
              <p className="meta mt-4 text-warm-grey">{t(p.zone, locale)}</p>
              {demo && p.media.hero.demo ? <span className="demo-mark mt-4">{demo}</span> : null}
            </div>
            <div className="lg:col-span-6 lg:col-start-7">
              <Specs property={p} locale={locale} dict={dict} tone="dark" />
            </div>
          </div>
        </div>
      </section>

      <ChapterNav chapters={chapters} label={dict.showroom.chapterNav} />

      {/* Film + before/after */}
      {chapters.some((x) => x.id === "film") ? (
        <section id="film" data-surface="dark" className="scroll-mt-28 bg-mineral py-[clamp(5rem,10vw,9rem)] text-stone">
          <div className="shell">
            <ChapterHead n={n("film")} title={film?.title ? t(film.title, locale) : dict.transformation.filmTitle} intro={dict.transformation.filmIntro} dark />
            {film ? <FilmPlayer film={film} labels={dict.film} demoLabel={demo} title={p.name} /> : null}
            {p.media.terrain && p.media.render ? (
              <div className={film ? "mt-[clamp(4rem,8vw,7rem)]" : ""}>
                <h3 className="h3 mb-8 max-w-xl">{dict.transformation.title}</h3>
                <Compare
                  before={p.media.terrain}
                  after={p.media.render}
                  beforeAlt={t(p.media.terrain.alt, locale)}
                  afterAlt={t(p.media.render.alt, locale)}
                  beforeLabel={dict.transformation.before}
                  afterLabel={dict.transformation.after}
                  handleLabel={dict.transformation.handle}
                  demoLabel={p.media.terrain.demo ? demo : undefined}
                  sizes="(min-width: 1440px) 1300px, 92vw"
                />
                <p className="meta mt-4 text-warm-grey">{dict.transformation.alignNote}</p>
              </div>
            ) : null}
          </div>
        </section>
      ) : null}

      {/* Architecture */}
      <section id="architecture" data-surface="light" className="scroll-mt-28 bg-stone py-[clamp(5rem,10vw,9rem)]">
        <div className="shell">
          <ChapterHead n={n("architecture")} title={dict.showroom.chapters.architecture} />
          <div className="grid gap-12 lg:grid-cols-12">
            <p className="lead lg:col-span-6">{t(p.summary, locale)}</p>
            {p.features.length ? (
              <div className="lg:col-span-4 lg:col-start-9">
                <h3 className={`meta mb-3 text-ash`}>{dict.showroom.features}</h3>
                <ul className="border-t border-mineral/12">
                  {p.features.map((f) => (
                    <li key={f.en} className="border-b border-mineral/12 py-3 text-[0.9375rem]">
                      {t(f, locale)}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
          <div className="mt-[clamp(4rem,8vw,7rem)] space-y-[clamp(4rem,8vw,7rem)]">
            {architecture.map((a, i) =>
              a.image ? (
                <article key={a.id} className="grid items-center gap-10 lg:grid-cols-12">
                  <Plate media={a.image} locale={locale} sizes="(min-width: 1024px) 58vw, 100vw" demoLabel={demo} reveal className={`aspect-[4/3] lg:col-span-7 ${i % 2 ? "lg:order-2 lg:col-start-6" : ""}`} />
                  <div className={`lg:col-span-4 ${i % 2 ? "lg:order-1 lg:col-start-1 lg:row-start-1" : "lg:col-start-9"}`}>
                    <h3 className="h3">{t(a.title, locale)}</h3>
                    <p className="mt-4 text-mineral/80">{t(a.body, locale)}</p>
                    {!a.verified ? <p className="meta mt-4 text-bronze-deep">{dict.experience.pending}</p> : null}
                  </div>
                </article>
              ) : null,
            )}
            <div className="grid gap-x-10 gap-y-12 border-t border-mineral/12 pt-12 sm:grid-cols-2 lg:grid-cols-4">
              {architecture
                .filter((a) => !a.image)
                .map((a) => (
                  <article key={a.id}>
                    <h3 className="font-serif text-xl">{t(a.title, locale)}</h3>
                    <p className="mt-3 text-[0.9375rem] text-mineral/75">{t(a.body, locale)}</p>
                    {!a.verified ? <p className="meta mt-3 text-bronze-deep">{dict.experience.pending}</p> : null}
                  </article>
                ))}
            </div>
          </div>
        </div>
      </section>

      {/* Gallery */}
      {gallery.length ? (
        <section id="gallery" data-surface="light" className="scroll-mt-28 bg-stone pb-[clamp(5rem,10vw,9rem)]">
          <div className="shell">
            <ChapterHead n={n("gallery")} title={dict.gallery.title} />
            <Gallery items={gallery} labels={dict.gallery} demoLabel={demo} />
          </div>
        </section>
      ) : null}

      {/* 3D */}
      {p.model3d ? (
        <section id="model" data-surface="dark" className="scroll-mt-28 bg-mineral py-[clamp(5rem,10vw,9rem)] text-stone">
          <div className="shell">
            <ChapterHead n={n("model")} title={dict.model.title} intro={dict.model.intro} dark />
            <ModelChapter
              source={p.model3d}
              poster={p.media.gallery.find((g) => g.src.includes("aerial"))?.src ?? p.media.hero.src}
              enter={dict.model.enter}
              weight={dict.model.weight}
              unsupported={dict.model.unsupported}
              demoLabel={p.model3d.demo ? demo : undefined}
              labels={{ ...dict.model, viewNames }}
            />
          </div>
        </section>
      ) : null}

      {/* 360 */}
      <section id="tour" data-surface="dark" className="scroll-mt-28 bg-mineral pb-[clamp(5rem,10vw,9rem)] text-stone">
        <div className="shell">
          <ChapterHead n={n("tour")} title={dict.tour.title} intro={p.tour ? dict.tour.intro : undefined} dark />
          {p.tour ? (
            <TourChapter
              scenes={p.tour.scenes.map((s) => ({ id: s.id, title: t(s.title, locale), panorama: s.panorama, initialYaw: s.initialYaw, planPosition: s.planPosition, links: s.links }))}
              plan={p.tour.plan}
              poster={p.media.gallery.find((g) => g.category === "interior")?.src ?? p.media.hero.src}
              enter={dict.tour.enter}
              demo={p.tour.demo}
              demoLabel={demo}
              labels={{ rooms: dict.tour.rooms, plan: dict.tour.plan, fullscreen: dict.tour.fullscreen, goTo: dict.tour.goTo, demo: dict.tour.demo }}
            />
          ) : (
            <Empty text={dict.tour.none} dark />
          )}
        </div>
      </section>

      {/* Plans */}
      <section id="plans" data-surface="light" className="scroll-mt-28 bg-stone-2 py-[clamp(5rem,10vw,9rem)]">
        <div className="shell">
          <ChapterHead n={n("plans")} title={dict.plans.title} />
          {p.plans.length ? (
            <PlanViewer plans={p.plans.map((pl) => ({ ...pl, title: t(pl.title, locale) }))} labels={dict.plans} demoLabel={demo} />
          ) : (
            <Empty text={dict.plans.none} />
          )}
        </div>
      </section>

      {/* Location */}
      <section id="location" data-surface="dark" className="scroll-mt-28 bg-mineral py-[clamp(5rem,10vw,9rem)] text-stone">
        <div className="shell">
          <ChapterHead n={n("location")} title={dict.location.title} dark />
          <div className="grid gap-10 lg:grid-cols-12">
            <div className="lg:col-span-8">
              <LocationChapter
                lat={p.location.lat}
                lng={p.location.lng}
                precision={p.location.precision}
                radiusMeters={p.location.radiusMeters}
                name={p.name}
                labels={dict.location}
              />
            </div>
            <div className="lg:col-span-4">
              <p className="h3">{t(p.zone, locale)}</p>
              {p.location.precision === "approximate" ? <p className="mt-4 text-warm-grey">{dict.location.approximate}</p> : null}
              {p.location.note ? <p className="meta mt-3 text-bronze">{t(p.location.note, locale)}</p> : null}
              <div className="mt-8 flex flex-col items-start gap-1">
                <a
                  className="link-line"
                  target="_blank"
                  rel="noopener noreferrer"
                  href={`https://www.google.com/maps/search/?api=1&query=${p.location.precision === "exact" ? `${p.location.lat},${p.location.lng}` : `${p.location.lat.toFixed(2)},${p.location.lng.toFixed(2)}`}`}
                >
                  {dict.location.openGoogle}
                </a>
                {p.location.precision === "approximate" ? (
                  <Link className="link-line" href={`${paths.contact(locale)}?intent=dossier&property=${p.slug}`}>
                    {dict.location.requestDetails}
                  </Link>
                ) : null}
              </div>
              <p className="meta mt-10 border-t border-stone/12 pt-5 text-warm-grey">{dict.experience.pendingNote}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Presentation */}
      <section id="presentation" data-surface="dark" className="scroll-mt-28 border-t border-stone/10 bg-mineral py-[clamp(5rem,10vw,9rem)] text-stone">
        <div className="shell grid gap-14 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <p className="num meta text-bronze">{String(n("presentation")).padStart(2, "0")}</p>
            <h2 className="h2 mt-4">{dict.cta.title}</h2>
            <p className="mt-6 max-w-md text-sand">{dict.cta.body}</p>
          </div>
          <div className="lg:col-span-6 lg:col-start-7">
            <EnquiryForm
              locale={locale}
              dict={dict.form}
              properties={all.map((x) => ({ slug: x.slug, name: x.name }))}
              initialProperty={p.slug}
              privacyHref={paths.legal(locale, "privacy")}
              tone="dark"
            />
          </div>
        </div>
      </section>

      {next && next.slug !== p.slug ? <NextResidence next={next} locale={locale} dict={dict} /> : null}
    </>
  );
}

function Empty({ text, dark }: { text: string; dark?: boolean }) {
  return (
    <div className={`grid min-h-56 place-items-center border border-dashed px-6 py-16 text-center ${dark ? "border-stone/18 text-warm-grey" : "border-mineral/18 text-ash"}`}>
      <p className="max-w-md">{text}</p>
    </div>
  );
}

function NextResidence({ next, locale, dict }: { next: Property; locale: Locale; dict: Dictionary }) {
  return (
    <Link href={paths.residence(locale, next.slug)} data-surface="dark" className="group relative block h-[60svh] min-h-[420px] overflow-hidden bg-mineral text-stone">
      <Plate media={next.media.hero} locale={locale} sizes="100vw" className="!absolute inset-0" imgClassName="opacity-70 transition-[transform,opacity] duration-[1400ms] ease-[var(--ease-out)] group-hover:scale-[1.03] group-hover:opacity-85" />
      <div className="shell relative flex h-full flex-col justify-end pb-12">
        <span className="meta text-sand">{dict.showroom.next}</span>
        <span className="display mt-3 block">{next.name}</span>
      </div>
    </Link>
  );
}
