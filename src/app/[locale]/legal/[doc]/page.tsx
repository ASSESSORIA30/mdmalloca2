import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { legal } from "@/content/legal";
import { LOCALES } from "@/i18n/config";
import { resolveLocale } from "@/lib/i18n-server";
import { alternates } from "@/lib/seo";

const DOCS = ["privacy", "legal-notice", "cookies"] as const;
type DocId = (typeof DOCS)[number];

// Every known slug is prerendered; unknown slugs may block before 404.
export const instant = false;

export function generateStaticParams() {
  return LOCALES.flatMap((locale) => DOCS.map((doc) => ({ locale, doc })));
}

export async function generateMetadata({ params }: PageProps<"/[locale]/legal/[doc]">): Promise<Metadata> {
  const { locale } = await resolveLocale(params);
  const { doc } = await params;
  if (!DOCS.includes(doc as DocId)) return {};
  return { title: legal[doc as DocId][locale].title, alternates: alternates(locale, `/legal/${doc}`) };
}

export default async function LegalPage({ params }: PageProps<"/[locale]/legal/[doc]">) {
  const { locale, dict } = await resolveLocale(params);
  const { doc } = await params;
  if (!DOCS.includes(doc as DocId)) notFound();
  const d = legal[doc as DocId][locale];
  return (
    <article data-surface="light" className="shell pb-32 pt-[calc(var(--header-h)+clamp(4rem,9vw,7rem))]">
      <div className="max-w-[44rem]">
        <h1 className="h2">{d.title}</h1>
        <p className="meta mt-6 rounded-xl bg-stone-2 px-4 py-3 text-bronze-deep">{dict.legal.draft}</p>
        {d.sections.map((s) => (
          <section key={s.h} className="mt-12">
            <h2 className="h3">{s.h}</h2>
            {s.p.map((p) => (
              <p key={p} className="mt-4 font-serif text-[1.125rem] leading-[1.7] text-mineral/85">
                {p}
              </p>
            ))}
          </section>
        ))}
      </div>
    </article>
  );
}
