import Link from "next/link";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/en";
import { paths } from "@/lib/paths";

export function PrivateCta({ locale, dict, property }: { locale: Locale; dict: Dictionary; property?: string }) {
  const q = (intent: string) => `${paths.contact(locale)}?intent=${intent}${property ? `&property=${property}` : ""}`;
  return (
    <section data-surface="dark" className="bg-mineral text-stone" aria-labelledby="cta-title">
      <div className="shell py-[clamp(6rem,13vw,11rem)]">
        <span aria-hidden className="horizon mb-14 w-24" />
        <div className="grid gap-10 lg:grid-cols-12">
          <h2 id="cta-title" className="display lg:col-span-7">{dict.cta.title}</h2>
          <div className="lg:col-span-4 lg:col-start-9 lg:self-end">
            <p className="text-sand">{dict.cta.body}</p>
            <div className="mt-8 flex flex-col items-start gap-1">
              <Link href={q("presentation")} className="btn btn-solid-light mb-4">
                {dict.cta.primary}
              </Link>
              <Link href={q("dossier")} className="link-line">{dict.cta.dossier}</Link>
              <Link href={q("consultation")} className="link-line">{dict.cta.consultation}</Link>
              <Link href={q("call")} className="link-line">{dict.cta.speak}</Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
