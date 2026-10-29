"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Wordmark } from "./Wordmark";
import { LOCALES, LOCALE_NAMES, type Locale } from "@/i18n/config";
import { paths, swapLocale } from "@/lib/paths";
import type { Dictionary } from "@/i18n/en";

type Surface = "dark" | "light";

export function Header({ locale, dict }: { locale: Locale; dict: Dictionary["nav"] }) {
  const pathname = usePathname();
  const [surface, setSurface] = useState<Surface>("dark");
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);

  // The header reads the surface underneath it, so it stays legible over film and paper alike.
  useEffect(() => {
    let frame = 0;
    const probe = () => {
      frame = 0;
      const hit = document.elementsFromPoint(window.innerWidth / 2, 40).find((el) => el.closest("[data-surface]") && !el.closest("header"));
      const s = (hit?.closest("[data-surface]") as HTMLElement | null)?.dataset.surface as Surface | undefined;
      setSurface(s ?? "light");
      setScrolled(window.scrollY > 24);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(probe);
    };
    probe();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(frame);
    };
  }, [pathname]);

  // close the menu when the route changes (state derived during render, no effect)
  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setOpen(false);
  }
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        menuButton.current?.focus();
      }
    };
    document.documentElement.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.documentElement.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const dark = surface === "dark" || open;
  const links = [
    { href: paths.residences(locale), label: dict.residences },
    { href: paths.experience(locale), label: dict.experience },
    { href: paths.contact(locale), label: dict.contact },
  ];
  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  return (
    <header
      data-theme={dark ? "dark" : "light"}
      className={`fixed inset-x-0 top-0 z-50 transition-[background-color,color,box-shadow] duration-500 ease-[var(--ease-out)] ${
        dark ? "text-stone" : "text-mineral"
      } ${scrolled && !open ? (dark ? "bg-mineral/40 backdrop-blur-md" : "bg-stone/82 backdrop-blur-md shadow-[0_1px_0_rgb(22_23_21/0.08)]") : "bg-transparent"}`}
    >
      <div className="shell flex h-[var(--header-h)] items-center justify-between gap-6">
        <Link
          href={paths.home(locale)}
          aria-label={dict.home}
          className="relative z-10 -m-2 p-2 transition-[opacity,filter,translate] delay-100 duration-[1100ms] ease-[var(--ease-out)] starting:-translate-y-1 starting:opacity-0 starting:blur-[3px] motion-reduce:transition-opacity"
        >
          <Wordmark />
        </Link>

        <nav aria-label="Primary" className="hidden items-center gap-9 transition-opacity delay-300 duration-700 ease-[var(--ease-out)] starting:opacity-0 lg:flex">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="group relative py-3 text-[0.9375rem] tracking-[0.01em]" aria-current={isActive(l.href) ? "page" : undefined}>
              {l.label}
              <span
                aria-hidden
                className={`horizon absolute inset-x-0 bottom-2 transition-transform duration-300 ease-[var(--ease-out)] ${isActive(l.href) ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"}`}
              />
            </Link>
          ))}
          <LocaleSwitch locale={locale} pathname={pathname} label={dict.language} />
          <Link href={`${paths.contact(locale)}?intent=presentation`} className="btn">
            {dict.presentation}
          </Link>
        </nav>

        <button
          ref={menuButton}
          type="button"
          className="relative z-10 -mr-2 flex h-11 items-center gap-3 px-2 text-[0.9375rem] lg:hidden"
          aria-expanded={open}
          aria-controls="mobile-menu"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? dict.close : dict.menu}
          <span aria-hidden className="relative block h-3 w-6">
            <span className={`absolute left-0 top-0.5 h-px w-6 bg-current transition-transform duration-300 ease-[var(--ease-out)] ${open ? "translate-y-[4px] rotate-[20deg]" : ""}`} />
            <span className={`absolute bottom-0.5 left-0 h-px w-6 bg-current transition-transform duration-300 ease-[var(--ease-out)] ${open ? "-translate-y-[4px] -rotate-[20deg]" : ""}`} />
          </span>
        </button>
      </div>

      <div
        id="mobile-menu"
        data-surface="dark"
        hidden={!open}
        className="fixed inset-0 bg-mineral text-stone transition-[opacity,transform] duration-500 ease-[var(--ease-drawer)] starting:opacity-0 lg:hidden"
      >
        <nav aria-label="Mobile" className="shell flex h-full flex-col justify-between pb-10 pt-[calc(var(--header-h)+3rem)]">
          <ul className="space-y-2">
            {links.map((l, i) => (
              <li key={l.href} style={{ transitionDelay: `${80 + i * 50}ms` }} className="transition-[opacity,transform] duration-500 ease-[var(--ease-out)] starting:translate-y-3 starting:opacity-0">
                <Link href={l.href} className="h2 block py-1" aria-current={pathname === l.href ? "page" : undefined}>
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
          <div className="space-y-8">
            <span className="horizon w-full opacity-60" aria-hidden />
            <Link href={`${paths.contact(locale)}?intent=presentation`} className="btn btn-solid-light w-full">
              {dict.presentation}
            </Link>
            <LocaleSwitch locale={locale} pathname={pathname} label={dict.language} />
          </div>
        </nav>
      </div>
    </header>
  );
}

function LocaleSwitch({ locale, pathname, label }: { locale: Locale; pathname: string; label: string }) {
  return (
    <ul aria-label={label} className="flex items-center gap-1 text-[0.8125rem]">
      {LOCALES.map((l) => (
        <li key={l}>
          <Link
            href={swapLocale(pathname, l)}
            hrefLang={l}
            lang={l}
            aria-current={l === locale ? "true" : undefined}
            aria-label={LOCALE_NAMES[l]}
            className={`grid h-11 min-w-9 place-items-center px-1.5 tracking-[0.06em] transition-opacity ${l === locale ? "opacity-100" : "opacity-[0.78] hover:opacity-100"}`}
          >
            {l.toUpperCase()}
          </Link>
        </li>
      ))}
    </ul>
  );
}
