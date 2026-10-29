import type { Metadata } from "next";
import Link from "next/link";
import { Plate } from "@/components/media/Plate";
import { Specs } from "@/components/residence/Specs";
import { PrivateCta } from "@/components/home/PrivateCta";
import { t } from "@/content/schema";
import { getProperties } from "@/lib/properties";
import { resolveLocale } from "@/lib/i18n-server";
import { paths } from "@/lib/paths";
import { alternates } from "@/lib/seo";
import { site } from "@/lib/site";

export async function generateMetadata({ params }: PageProps<"/[locale]/residences">): Promise<Metadata> {
  const { locale, dict } = await resolveLocale(params);
  return { title: dict.index.title, description: dict.index.intro, alternates: alternates(locale, "/residences") };
}

export default async function Residences({ params }: PageProps<"/[locale]/residences">) {
  const { locale, dict } = await resolveLocale(params);
  const properties = await getProperties();
  const demo = site.demoMode ? dict.demo.badge : undefined;

  return (
    <>
      <section data-surface="light" className="shell pb-16 pt-[calc(var(--header-h)+clamp(4rem,10vw,8rem))]">
        <h1 className="display max-w-[14ch]">{dict.index.title}</h1>
        <p className="lead mt-8 max-w-xl text-mineral/80">{dict.index.intro}</p>
      </section>

      <div data-surface="light" className="shell space-y-[clamp(6rem,12vw,11rem)] pb-[clamp(6rem,12vw,10rem)]">
        {properties.map((p, i) => {
          const flip = i % 2 === 1;
          return (
            <article key={p.slug} className="grid items-end gap-10 lg:grid-cols-12" aria-labelledby={`r-${p.slug}`}>
              <Link
                href={paths.residence(locale, p.slug)}
                className={`group block lg:col-span-8 ${flip ? "lg:order-2 lg:col-start-5" : ""}`}
                tabIndex={-1}
                aria-hidden
              >
                <Plate
                  media={p.media.hero}
                  locale={locale}
                  sizes="(min-width: 1024px) 64vw, 100vw"
                  demoLabel={demo}
                  priority={i === 0}
                  className="aspect-[4/5] sm:aspect-[16/10]"
                  imgClassName="transition-transform duration-[1400ms] ease-[var(--ease-out)] group-hover:scale-[1.025]"
                  reveal={i > 0}
                />
              </Link>
              <div className={`lg:col-span-4 ${flip ? "lg:order-1 lg:col-start-1 lg:row-start-1" : ""}`}>
                <p className="meta text-ash">{t(p.zone, locale)}</p>
                <h2 id={`r-${p.slug}`} className="h2 mt-3">
                  <Link href={paths.residence(locale, p.slug)}>{p.name}</Link>
                </h2>
                <p className="lead mt-5 text-mineral/80">{t(p.tagline, locale)}</p>
                <div className="mt-8">
                  <Specs property={p} locale={locale} dict={dict} />
                </div>
                <Link href={paths.residence(locale, p.slug)} className="btn btn-solid mt-8">
                  {dict.index.view}
                </Link>
              </div>
            </article>
          );
        })}
      </div>
      <PrivateCta locale={locale} dict={dict} />
    </>
  );
}
