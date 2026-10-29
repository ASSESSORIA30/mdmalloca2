"use client";

import Link from "next/link";
import { getImageProps } from "next/image";
import { useEffect, useRef, useState } from "react";
import { BackgroundFilm } from "@/components/media/BackgroundFilm";
import type { Media, Video } from "@/content/schema";

type Props = {
  title: string;
  subtitle: string;
  discover: { href: string; label: string };
  explore: { href: string; label: string };
  scrollLabel: string;
  poster: Media;
  posterPortrait?: Media;
  posterAlt: string;
  film?: Video;
  demoLabel?: string;
  pauseLabel: string;
  playLabel: string;
};

export function Hero(p: Props) {
  const root = useRef<HTMLElement>(null);
  const media = useRef<HTMLDivElement>(null);
  const content = useRef<HTMLDivElement>(null);
  const [intro, setIntro] = useState(false);

  // One orchestrated entrance, started once fonts are ready so lines never reflow mid-reveal.
  useEffect(() => {
    let done = false;
    const go = () => {
      if (!done) {
        done = true;
        setIntro(true);
      }
    };
    document.fonts?.ready.then(go);
    const t = setTimeout(go, 900);
    return () => clearTimeout(t);
  }, []);

  // Cinematic hand-off to the next section: the film settles and dims as the page takes over.
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let ctx: { revert(): void } | undefined;
    let cancelled = false;
    (async () => {
      const { gsap } = await import("gsap");
      const { ScrollTrigger } = await import("gsap/ScrollTrigger");
      if (cancelled || !root.current) return;
      gsap.registerPlugin(ScrollTrigger);
      ctx = gsap.context(() => {
        const st = { trigger: root.current, start: "top top", end: "bottom top", scrub: true };
        gsap.to(media.current, { scale: 1.08, yPercent: 12, ease: "none", scrollTrigger: st });
        gsap.to(content.current, { yPercent: -18, opacity: 0, ease: "none", scrollTrigger: { ...st, end: "60% top" } });
      }, root);
    })();
    return () => {
      cancelled = true;
      ctx?.revert();
    };
  }, []);

  const common = { alt: p.posterAlt, sizes: "100vw", quality: 80, priority: true } as const;
  const desktop = getImageProps({ ...common, src: p.poster.src, width: p.poster.width, height: p.poster.height }).props;
  const mobile = p.posterPortrait
    ? getImageProps({ ...common, src: p.posterPortrait.src, width: p.posterPortrait.width, height: p.posterPortrait.height }).props
    : null;

  const lines = p.title.split(/(?<=\s)(?=\S+\.$)/); // last word on its own line when it fits the rhythm

  return (
    <section ref={root} data-surface="dark" data-intro={intro ? "on" : "off"} className="hero relative h-[100svh] min-h-[600px] overflow-hidden bg-mineral text-stone">
      <div ref={media} className="absolute inset-0 origin-center will-change-transform">
        <picture>
          {mobile ? <source media="(max-width: 767px) and (orientation: portrait)" srcSet={mobile.srcSet} sizes="100vw" /> : null}
          <img {...desktop} alt={p.posterAlt} className="hero-poster absolute inset-0 h-full w-full object-cover" style={{ objectPosition: p.poster.focal }} />
        </picture>
        <BackgroundFilm film={p.film} pauseLabel={p.pauseLabel} playLabel={p.playLabel} showControl={false} />
        {/* legibility scrim for the headline, not decoration */}
        <div aria-hidden className="absolute inset-0 bg-[linear-gradient(180deg,rgb(22_23_21/0.45)_0%,rgb(22_23_21/0)_22%,rgb(22_23_21/0.05)_42%,rgb(22_23_21/0.78)_100%)]" />
        <div aria-hidden className="absolute inset-0 bg-[linear-gradient(90deg,rgb(22_23_21/0.5)_0%,rgb(22_23_21/0)_55%)]" />
      </div>

      <div ref={content} className="shell relative flex h-full flex-col justify-end pb-[clamp(2.5rem,7vh,5rem)]">
        <span aria-hidden className="horizon hero-line mb-[clamp(1.5rem,4vh,2.75rem)] w-full max-w-[44rem] opacity-90" />
        <h1 className="display max-w-[12ch] md:max-w-[15ch]">
          {lines.map((l, i) => (
            <span key={i} className="block overflow-hidden pb-[0.08em]">
              <span className="hero-rise block" style={{ transitionDelay: `${520 + i * 110}ms` }}>
                {l}
              </span>
            </span>
          ))}
        </h1>
        <div className="mt-8 grid gap-8 md:mt-10 md:grid-cols-12 md:items-end">
          <p className="hero-fade lead max-w-[30rem] text-sand md:col-span-6" style={{ transitionDelay: "900ms" }}>
            {p.subtitle}
          </p>
          <div className="hero-fade flex flex-wrap items-center gap-x-8 gap-y-3 md:col-span-6 md:justify-end" style={{ transitionDelay: "1040ms" }}>
            <Link href={p.discover.href} className="btn btn-solid-light">
              {p.discover.label}
            </Link>
            <Link href={p.explore.href} className="link-line">
              {p.explore.label}
            </Link>
          </div>
        </div>
        <div className="hero-fade meta mt-10 hidden items-center justify-between text-warm-grey md:flex" style={{ transitionDelay: "1200ms" }}>
          <span className="flex items-center gap-5">
            <span className="num">39° 37′ N   2° 59′ E</span>
            {p.demoLabel ? <span className="demo-mark">{p.demoLabel}</span> : null}
          </span>
          <span className="flex items-center gap-3">
            {p.scrollLabel}
            <span aria-hidden className="hero-scroll block h-px w-14 origin-left bg-stone/60" />
          </span>
        </div>
        {p.demoLabel ? <span className="demo-mark mt-6 self-start md:hidden">{p.demoLabel}</span> : null}
      </div>
    </section>
  );
}
