"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import type { Media } from "@/content/schema";

export type IndexItem = {
  slug: string;
  name: string;
  zone: string;
  tagline: string;
  href: string;
  image: Media;
  alt: string;
  facts: { label: string; value: string }[];
};

export function ResidenceIndex({ items, enterLabel, demoLabel }: { items: IndexItem[]; enterLabel: string; demoLabel: string }) {
  const [active, setActive] = useState(0);
  const current = items[active];

  return (
    <>
      {/* Desktop: names as an index, one large image that changes with a wipe */}
      <div className="hidden gap-[clamp(2rem,4vw,5rem)] lg:grid lg:grid-cols-12">
        <ol className="col-span-4 self-start" aria-label="Residences">
          {items.map((it, i) => (
            <li key={it.slug} className="border-t border-mineral/12 last:border-b">
              <Link
                href={it.href}
                onMouseEnter={() => setActive(i)}
                onFocus={() => setActive(i)}
                aria-current={i === active ? "true" : undefined}
                className="group grid grid-cols-[1fr_auto] items-baseline gap-4 py-7"
              >
                <span>
                  <span className={`h3 block transition-colors duration-300 ${i === active ? "text-mineral" : "text-ash group-hover:text-mineral"}`}>{it.name}</span>
                  <span className="meta mt-2 block text-ash">{it.zone}</span>
                </span>
                <span aria-hidden className={`horizon w-10 transition-transform duration-500 ease-[var(--ease-out)] ${i === active ? "scale-x-100" : "scale-x-0"}`} />
              </Link>
            </li>
          ))}
        </ol>

        <div className="col-span-8">
          <div className="relative aspect-[16/10] overflow-hidden bg-mineral-2">
            {items.map((it, i) => (
              <div
                key={it.slug}
                aria-hidden={i !== active}
                className="absolute inset-0 transition-[clip-path] duration-[900ms] ease-[var(--ease-in-out)]"
                style={{ clipPath: i === active ? "inset(0 0 0 0)" : "inset(0 0 0 100%)", zIndex: i === active ? 2 : 1 }}
              >
                <Image
                  src={it.image.src}
                  alt={it.alt}
                  fill
                  sizes="(min-width: 1024px) 60vw, 100vw"
                  className={`object-cover transition-transform duration-[1600ms] ease-[var(--ease-out)] ${i === active ? "scale-100" : "scale-[1.06]"}`}
                  style={{ objectPosition: it.image.focal }}
                />
              </div>
            ))}
            {current.image.demo ? <span className="demo-mark absolute bottom-3 left-3 z-10">{demoLabel}</span> : null}
          </div>
          <div className="mt-8 grid grid-cols-8 gap-8">
            <p key={current.slug} className="lead col-span-5 animate-[fade_600ms_var(--ease-out)]">
              {current.tagline}
            </p>
            <div className="col-span-3 flex flex-col items-start justify-between gap-6">
              <dl className="num grid w-full grid-cols-2 gap-x-6 gap-y-3 text-[0.9375rem]">
                {current.facts.map((f) => (
                  <div key={f.label}>
                    <dt className="meta text-ash">{f.label}</dt>
                    <dd>{f.value}</dd>
                  </div>
                ))}
              </dl>
              <Link href={current.href} className="btn btn-solid">
                {enterLabel}
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile and tablet: a snap sequence that keeps the images large */}
      <ol className="no-scrollbar -mx-[var(--gutter)] flex snap-x snap-mandatory gap-4 overflow-x-auto px-[var(--gutter)] pb-2 lg:hidden" aria-label="Residences">
        {items.map((it) => (
          <li key={it.slug} className="w-[86vw] max-w-[34rem] shrink-0 snap-start">
            <Link href={it.href} className="block">
              <div className="relative aspect-[4/5] overflow-hidden bg-mineral-2 sm:aspect-[4/3]">
                <Image src={it.image.src} alt={it.alt} fill sizes="86vw" className="object-cover" style={{ objectPosition: it.image.focal }} />
                {it.image.demo ? <span className="demo-mark absolute bottom-3 left-3">{demoLabel}</span> : null}
              </div>
              <span className="h3 mt-5 block">{it.name}</span>
              <span className="meta mt-1 block text-ash">{it.zone}</span>
              <span className="mt-3 block text-[0.9375rem] leading-relaxed">{it.tagline}</span>
            </Link>
          </li>
        ))}
      </ol>
    </>
  );
}
