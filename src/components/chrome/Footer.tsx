import Link from "next/link";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/en";
import { paths } from "@/lib/paths";
import { site } from "@/lib/site";
import { Wordmark } from "./Wordmark";

const YEAR = new Date().getFullYear();

export function Footer({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  return (
    <footer data-surface="dark" className="bg-mineral text-stone">
      <div className="shell pb-10 pt-20 md:pt-28">
        <div className="grid gap-14 md:grid-cols-12">
          <div className="md:col-span-5">
            <Wordmark />
            <p className="mt-8 max-w-xs font-serif text-lg leading-relaxed text-sand">{dict.manifesto.title}</p>
          </div>
          <nav aria-label="Footer" className="grid grid-cols-2 gap-10 text-[0.9375rem] md:col-span-7 md:grid-cols-3">
            <ul className="space-y-1">
              <li><Link className="link-line" href={paths.residences(locale)}>{dict.nav.residences}</Link></li>
              <li><Link className="link-line" href={paths.experience(locale)}>{dict.experience.navTitle}</Link></li>
              <li><Link className="link-line" href={paths.contact(locale)}>{dict.nav.contact}</Link></li>
            </ul>
            <ul className="space-y-1">
              <li><Link className="link-line" href={paths.legal(locale, "legal-notice")}>{dict.footer.legal}</Link></li>
              <li><Link className="link-line" href={paths.legal(locale, "privacy")}>{dict.footer.privacy}</Link></li>
              <li><Link className="link-line" href={paths.legal(locale, "cookies")}>{dict.footer.cookies}</Link></li>
            </ul>
            <address className="col-span-2 min-w-0 not-italic text-warm-grey md:col-span-1 [&_a]:break-all">
              <span className="block text-stone">{dict.contact.direct}</span>
              <a className="link-line text-sand" href={`mailto:${site.contact.email}`}>{site.contact.email}</a>
              <a className="link-line num text-sand" href={`tel:${site.contact.phone.replace(/[^+\d]/g, "")}`}>{site.contact.phone}</a>
            </address>
          </nav>
        </div>
        <span className="horizon mt-20 opacity-50" aria-hidden />
        <div className="meta mt-6 flex flex-col gap-2 text-warm-grey sm:flex-row sm:justify-between">
          <p className="num">© {YEAR} {site.brand}. {dict.footer.rights}</p>
          {site.demoMode ? <p>{dict.footer.demo}</p> : null}
        </div>
      </div>
    </footer>
  );
}
