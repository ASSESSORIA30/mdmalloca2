import type { Metadata } from "next";
import { Suspense } from "react";
import { EnquiryForm } from "@/components/forms/EnquiryForm";
import { getProperties } from "@/lib/properties";
import { resolveLocale } from "@/lib/i18n-server";
import { paths } from "@/lib/paths";
import { alternates } from "@/lib/seo";
import { site } from "@/lib/site";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/en";

export async function generateMetadata({ params }: PageProps<"/[locale]/contact">): Promise<Metadata> {
  const { locale, dict } = await resolveLocale(params);
  return { title: dict.nav.contact, description: dict.contact.intro, alternates: alternates(locale, "/contact") };
}

export default async function Contact({ params, searchParams }: PageProps<"/[locale]/contact">) {
  const { locale, dict } = await resolveLocale(params);
  const properties = (await getProperties()).map((p) => ({ slug: p.slug, name: p.name }));

  return (
    <section data-surface="light" className="shell pb-[clamp(6rem,12vw,10rem)] pt-[calc(var(--header-h)+clamp(4rem,9vw,7rem))]">
      <div className="grid gap-16 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <h1 className="display max-w-[11ch]">{dict.contact.title}</h1>
          <p className="lead mt-8 max-w-md text-mineral/80">{dict.contact.intro}</p>
          <span aria-hidden className="horizon mt-14 w-16" />
          <dl className="mt-8 space-y-6 text-[0.9375rem]">
            <div>
              <dt className="meta text-ash">{dict.contact.direct}</dt>
              <dd className="mt-1 flex flex-col items-start">
                <a className="link-line" href={`mailto:${site.contact.email}`}>{site.contact.email}</a>
                <a className="link-line num" href={`tel:${site.contact.phone.replace(/[^+\d]/g, "")}`}>{site.contact.phone}</a>
              </dd>
            </div>
            <div>
              <dt className="meta text-ash">{dict.contact.office}</dt>
              <dd className="mt-1">{site.contact.office}</dd>
            </div>
          </dl>
        </div>
        <div className="lg:col-span-6 lg:col-start-7">
          {/* query string (intent, property) is request data: stream the form in its own boundary */}
          <Suspense fallback={<FormShell locale={locale} dict={dict} properties={properties} />}>
            <FormWithQuery locale={locale} dict={dict} properties={properties} searchParams={searchParams} />
          </Suspense>
        </div>
      </div>
    </section>
  );
}

async function FormWithQuery({
  locale,
  dict,
  properties,
  searchParams,
}: {
  locale: Locale;
  dict: Dictionary;
  properties: { slug: string; name: string }[];
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const q = await searchParams;
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
  return <FormShell locale={locale} dict={dict} properties={properties} intent={one(q.intent)} property={one(q.property)} />;
}

function FormShell({ locale, dict, properties, intent, property }: { locale: Locale; dict: Dictionary; properties: { slug: string; name: string }[]; intent?: string; property?: string }) {
  return (
    <EnquiryForm
      locale={locale}
      dict={dict.form}
      properties={properties}
      initialIntent={intent}
      initialProperty={properties.some((p) => p.slug === property) ? property : undefined}
      privacyHref={paths.legal(locale, "privacy")}
    />
  );
}
