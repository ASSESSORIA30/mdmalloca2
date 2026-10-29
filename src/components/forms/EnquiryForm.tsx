"use client";

import Link from "next/link";
import Script from "next/script";
import { useEffect, useMemo, useRef, useState } from "react";
import { COUNTRIES } from "@/content/countries";
import { useClientValue } from "@/lib/hooks/use-client-value";
import { INTENTS, enquirySchema } from "@/lib/enquiry-schema";
import type { Dictionary } from "@/i18n/en";
import type { Locale } from "@/i18n/config";

type Props = {
  locale: Locale;
  dict: Dictionary["form"];
  properties: { slug: string; name: string }[];
  initialIntent?: string;
  initialProperty?: string;
  privacyHref: string;
  tone?: "light" | "dark";
};

type Field = "name" | "email" | "phone" | "consent";
const TURNSTILE = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

export function EnquiryForm({ locale, dict, properties, initialIntent, initialProperty, privacyHref, tone = "light" }: Props) {
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error" | "rate">("idle");
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const startedAt = useRef(0);
  // client-only: the start time feeds the anti-spam timer, and country names come from the
  // browser's own Intl data (server and browser ICU can disagree, which would break hydration)
  const mounted = useClientValue(() => true, false);
  const [prefix, setPrefix] = useState("+34");
  useEffect(() => {
    startedAt.current = Date.now();
  }, []);
  const form = useRef<HTMLFormElement>(null);
  const dark = tone === "dark";

  const regionNames = useMemo(() => {
    try {
      return new Intl.DisplayNames([locale], { type: "region" });
    } catch {
      return null;
    }
  }, [locale]);
  const countries = useMemo(
    () => (!mounted ? [] : COUNTRIES).map(([iso, dial]) => ({ iso, dial, name: regionNames?.of(iso) ?? iso })).sort((a, b) => a.name.localeCompare(b.name, locale)),
    [regionNames, locale, mounted],
  );
  const defaultIntent = (INTENTS as readonly string[]).includes(initialIntent ?? "") ? initialIntent : "presentation";

  const message = (code: string, field: string) =>
    code === "email" ? dict.errors.email : code === "phone" ? dict.errors.phone : code === "consent" ? dict.errors.consent : dict.errors.required.replace("{field}", field.toLowerCase());

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const payload = {
      intent: fd.get("intent"),
      name: fd.get("name"),
      email: fd.get("email"),
      phonePrefix: fd.get("phonePrefix"),
      phone: fd.get("phone"),
      country: fd.get("country"),
      property: fd.get("property"),
      message: fd.get("message"),
      consent: fd.get("consent") === "on",
      locale,
      company: fd.get("company"),
      startedAt: startedAt.current,
      turnstileToken: fd.get("cf-turnstile-response") ?? undefined,
    };
    const parsed = enquirySchema.safeParse(payload);
    if (!parsed.success) {
      const next: Partial<Record<Field, string>> = {};
      for (const i of parsed.error.issues) {
        const f = i.path[0] as Field;
        if (["name", "email", "phone", "consent"].includes(f) && !next[f]) next[f] = message(i.message, dict[f === "consent" ? "privacy" : f] as string);
      }
      setErrors(next);
      const first = Object.keys(next)[0];
      if (first) form.current?.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
      return;
    }
    setErrors({});
    setStatus("sending");
    try {
      const res = await fetch("/api/enquiry", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(parsed.data) });
      if (res.status === 429) return setStatus("rate");
      setStatus(res.ok ? "sent" : "error");
    } catch {
      setStatus("error");
    }
  }

  const muted = dark ? "text-warm-grey" : "text-ash";
  const fieldTone = dark ? "!border-stone/25 focus:!border-stone placeholder:!text-warm-grey" : "";

  if (status === "sent") {
    return (
      <div role="status" className="py-10 transition-[opacity,transform] duration-500 ease-[var(--ease-out)] starting:translate-y-2 starting:opacity-0">
        <span aria-hidden className="horizon mb-8 w-16" />
        <p className="h2">{dict.successTitle}</p>
        <p className={`lead mt-5 max-w-md ${dark ? "text-sand" : "text-mineral/80"}`}>{dict.success}</p>
        <button
          type="button"
          className="link-line mt-8"
          onClick={() => {
            startedAt.current = Date.now();
            setStatus("idle");
          }}
        >
          {dict.again}
        </button>
      </div>
    );
  }

  const err = (f: Field) =>
    errors[f] ? (
      <p id={`${f}-error`} className={`meta mt-2 ${dark ? "text-[#E3907A]" : "text-error"}`} role="alert">
        {errors[f]}
      </p>
    ) : null;

  return (
    <form ref={form} noValidate onSubmit={onSubmit} className="space-y-8" aria-label={dict.title}>
      <fieldset>
        <legend className={`meta mb-3 ${muted}`}>{dict.intent}</legend>
        <div className="flex flex-wrap gap-2">
          {INTENTS.map((i) => (
            <label key={i} className="relative">
              <input type="radio" name="intent" value={i} defaultChecked={i === defaultIntent} className="peer sr-only" />
              <span
                className={`inline-flex min-h-11 cursor-pointer items-center rounded-full border px-4 text-[0.875rem] transition-colors duration-200 peer-focus-visible:outline peer-focus-visible:outline-1 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-bronze ${
                  dark
                    ? "border-stone/20 peer-checked:border-stone peer-checked:bg-stone peer-checked:text-mineral"
                    : "border-mineral/20 peer-checked:border-mineral peer-checked:bg-mineral peer-checked:text-stone"
                }`}
              >
                {dict.intents[i]}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="grid gap-x-8 gap-y-7 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label htmlFor="f-name" className={`meta ${muted}`}>{dict.name}</label>
          <input id="f-name" name="name" autoComplete="name" required className={`field ${fieldTone}`} aria-invalid={!!errors.name} aria-describedby={errors.name ? "name-error" : undefined} />
          {err("name")}
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="f-email" className={`meta ${muted}`}>{dict.email}</label>
          <input id="f-email" name="email" type="email" inputMode="email" autoComplete="email" required className={`field ${fieldTone}`} aria-invalid={!!errors.email} aria-describedby={errors.email ? "email-error" : undefined} />
          {err("email")}
        </div>
        <div className="sm:col-span-2">
          <span className={`meta ${muted}`} id="phone-label">
            {dict.phone} <span>({dict.optional})</span>
          </span>
          <div className="grid grid-cols-[7.5rem_1fr] gap-4">
            <select name="phonePrefix" aria-label={dict.prefix} value={prefix} onChange={(e) => setPrefix(e.target.value)} className={`field ${fieldTone}`}>
              {!mounted ? <option value="+34">ES +34</option> : null}
              {countries.map((c) => (
                <option key={c.iso} value={c.dial}>
                  {c.iso} {c.dial}
                </option>
              ))}
            </select>
            <input name="phone" type="tel" inputMode="tel" autoComplete="tel-national" className={`field ${fieldTone}`} aria-labelledby="phone-label" aria-invalid={!!errors.phone} aria-describedby={errors.phone ? "phone-error" : undefined} />
          </div>
          {err("phone")}
        </div>
        <div>
          <label htmlFor="f-country" className={`meta ${muted}`}>
            {dict.country} <span>({dict.optional})</span>
          </label>
          <select id="f-country" name="country" autoComplete="country" defaultValue="" className={`field ${fieldTone}`}>
            <option value="">—</option>
            {countries.map((c) => (
              <option key={c.iso} value={c.iso}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="f-property" className={`meta ${muted}`}>{dict.property}</label>
          <select id="f-property" name="property" defaultValue={initialProperty ?? ""} className={`field ${fieldTone}`}>
            <option value="">{dict.anyProperty}</option>
            {properties.map((p) => (
              <option key={p.slug} value={p.slug}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="f-message" className={`meta ${muted}`}>
            {dict.message} <span>({dict.optional})</span>
          </label>
          <textarea id="f-message" name="message" rows={4} placeholder={dict.messageHint} className={`field resize-y ${fieldTone}`} />
        </div>
      </div>

      {/* honeypot: hidden from people and assistive tech */}
      <div aria-hidden className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label>
          Company
          <input name="company" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      {TURNSTILE ? (
        <>
          <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer />
          <div className="cf-turnstile" data-sitekey={TURNSTILE} data-theme={dark ? "dark" : "light"} />
        </>
      ) : null}

      <div>
        <label className="flex cursor-pointer items-start gap-3.5 text-[0.9375rem] leading-relaxed">
          <input
            type="checkbox"
            name="consent"
            className={`mt-1 size-[18px] shrink-0 cursor-pointer ${dark ? "accent-stone" : "accent-mineral"}`}
            aria-invalid={!!errors.consent}
            aria-describedby={errors.consent ? "consent-error" : undefined}
          />
          <span>
            {dict.consent.split(dict.privacy)[0]}
            <Link href={privacyHref} className="underline">
              {dict.privacy}
            </Link>
            {dict.consent.split(dict.privacy)[1]}
          </span>
        </label>
        {err("consent")}
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <button type="submit" disabled={status === "sending"} className={`btn ${dark ? "btn-solid-light" : "btn-solid"} min-w-48`}>
          <span className={`transition-[filter,opacity] duration-200 ${status === "sending" ? "opacity-70 blur-[1px]" : ""}`}>{status === "sending" ? dict.sending : dict.submit}</span>
        </button>
        <p className={`meta ${muted}`}>{dict.secure}</p>
      </div>
      {status === "error" || status === "rate" ? (
        <p role="alert" className={`text-[0.9375rem] ${dark ? "text-[#E3907A]" : "text-error"}`}>
          {status === "rate" ? dict.errors.rate : dict.errors.server}
        </p>
      ) : null}
    </form>
  );
}
