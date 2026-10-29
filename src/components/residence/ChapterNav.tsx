"use client";

import { useEffect, useRef, useState } from "react";

/** Sticky chapter index for the Private Showroom; follows the chapter in view. */
export function ChapterNav({ chapters, label }: { chapters: { id: string; title: string }[]; label: string }) {
  const [active, setActive] = useState(chapters[0]?.id);
  const list = useRef<HTMLOListElement>(null);

  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        const hit = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (hit) setActive(hit.target.id);
        else if (document.getElementById(chapters[0].id)!.getBoundingClientRect().top > window.innerHeight * 0.4) setActive(chapters[0].id);
      },
      { rootMargin: "-35% 0px -60% 0px" },
    );
    chapters.forEach((c) => {
      const el = document.getElementById(c.id);
      if (el) io.observe(el);
    });
    return () => io.disconnect();
  }, [chapters]);

  // keep the active chapter visible in the horizontal list on small screens
  useEffect(() => {
    const el = list.current?.querySelector<HTMLElement>(`[data-id="${active}"]`);
    if (el && list.current) list.current.scrollTo({ left: el.offsetLeft - 24, behavior: "smooth" });
  }, [active]);

  return (
    <nav aria-label={label} className="sticky top-[var(--header-h)] z-30 border-b border-stone/10 bg-mineral text-stone" data-surface="dark">
      <ol ref={list} className="shell no-scrollbar flex gap-7 overflow-x-auto">
        {chapters.map((c, i) => (
          <li key={c.id} data-id={c.id} className="shrink-0">
            <a
              href={`#${c.id}`}
              aria-current={active === c.id ? "true" : undefined}
              className={`relative flex h-12 items-center gap-2.5 text-[0.8125rem] transition-colors duration-200 ${active === c.id ? "text-stone" : "text-warm-grey hover:text-stone"}`}
            >
              <span className="num text-bronze">{String(i + 1).padStart(2, "0")}</span>
              {c.title}
              <span aria-hidden className={`horizon absolute inset-x-0 bottom-0 transition-transform duration-300 ease-[var(--ease-out)] ${active === c.id ? "scale-x-100" : "scale-x-0"}`} />
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
