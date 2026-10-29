import type { Locale, Property } from "@/content/schema";
import type { Dictionary } from "@/i18n/en";

const nf = (locale: Locale) => new Intl.NumberFormat(locale === "en" ? "en-GB" : locale === "es" ? "es-ES" : "ca-ES");

export function formatPrice(p: Property, locale: Locale, dict: Dictionary) {
  if (p.price.mode === "amount" && p.price.confirmed && p.price.amount)
    return new Intl.NumberFormat(locale === "en" ? "en-GB" : `${locale}-ES`, { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(p.price.amount);
  return dict.specs.onRequest;
}

export function specRows(p: Property, locale: Locale, dict: Dictionary) {
  const f = nf(locale);
  const m = (v: Property["specs"]["plotArea"]) => (v ? `${f.format(v.value)} ${v.unit}` : dict.specs.tbc);
  const n = (v: number | null) => (v == null ? dict.specs.tbc : f.format(v));
  return [
    { label: dict.specs.plot, value: m(p.specs.plotArea), known: !!p.specs.plotArea },
    { label: dict.specs.built, value: m(p.specs.builtArea), known: !!p.specs.builtArea },
    { label: dict.specs.bedrooms, value: n(p.specs.bedrooms), known: p.specs.bedrooms != null },
    { label: dict.specs.bathrooms, value: n(p.specs.bathrooms), known: p.specs.bathrooms != null },
  ];
}

export function Specs({ property, locale, dict, tone = "light", withPrice = true }: { property: Property; locale: Locale; dict: Dictionary; tone?: "light" | "dark"; withPrice?: boolean }) {
  const rows = specRows(property, locale, dict);
  const muted = tone === "dark" ? "text-warm-grey" : "text-ash";
  const rule = tone === "dark" ? "border-stone/14" : "border-mineral/12";
  return (
    <div className="@container">
      <dl className={`grid grid-cols-2 border-t ${rule} @xl:grid-cols-4`}>
        {rows.map((r) => (
          <div key={r.label} className={`border-b ${rule} py-4 pr-4`}>
            <dt className={`meta ${muted}`}>{r.label}</dt>
            <dd className={`num mt-1.5 font-serif text-xl ${r.known ? "" : muted}`}>{r.value}</dd>
          </div>
        ))}
      </dl>
      {withPrice ? (
        <dl className={`grid grid-cols-2 border-b ${rule}`}>
          <div className="py-4 pr-4">
            <dt className={`meta ${muted}`}>{dict.specs.price}</dt>
            <dd className="mt-1.5 font-serif text-xl">{formatPrice(property, locale, dict)}</dd>
          </div>
          <div className="py-4 pr-4">
            <dt className={`meta ${muted}`}>{dict.specs.status}</dt>
            <dd className={`mt-1.5 font-serif text-xl ${property.status.confirmed ? "" : muted}`}>
              {property.status.confirmed ? dict.status[property.status.value] : dict.specs.tbc}
            </dd>
          </div>
        </dl>
      ) : null}
      {property.specs.illustrative ? <p className={`meta mt-3 ${tone === "dark" ? "text-sand" : muted}`}>{dict.specs.illustrative}</p> : null}
    </div>
  );
}
