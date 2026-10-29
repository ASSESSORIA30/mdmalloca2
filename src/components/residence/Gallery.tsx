"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import type { GalleryItem } from "@/content/schema";

type Labels = {
  all: string;
  categories: Record<GalleryItem["category"], string>;
  open: string;
  close: string;
  prev: string;
  next: string;
  counter: string;
  empty: string;
};

export type GalleryEntry = GalleryItem & { altText: string; captionText?: string };

// Editorial rhythm: wide, then a pair, then a pair the other way round.
const spans = ["md:col-span-12 aspect-[16/9]", "md:col-span-7 aspect-[4/3]", "md:col-span-5 aspect-[4/5] md:mt-24", "md:col-span-5 aspect-[4/5]", "md:col-span-7 aspect-[4/3] md:mt-24"];

export function Gallery({ items, labels, demoLabel }: { items: GalleryEntry[]; labels: Labels; demoLabel?: string }) {
  const categories = useMemo(() => Array.from(new Set(items.map((i) => i.category))), [items]);
  const [filter, setFilter] = useState<GalleryItem["category"] | "all">("all");
  const visible = filter === "all" ? items : items.filter((i) => i.category === filter);
  const [open, setOpen] = useState<number | null>(null);
  const opener = useRef<HTMLButtonElement | null>(null);

  return (
    <div>
      {categories.length > 1 ? (
        <div role="group" aria-label="Filter" className="no-scrollbar -mx-[var(--gutter)] mb-10 flex gap-2 overflow-x-auto px-[var(--gutter)]">
          {(["all", ...categories] as const).map((c) => (
            <button key={c} type="button" className="chip shrink-0" aria-pressed={filter === c} onClick={() => setFilter(c)}>
              {c === "all" ? labels.all : labels.categories[c]}
            </button>
          ))}
        </div>
      ) : null}

      {visible.length === 0 ? (
        <p className="text-warm-grey">{labels.empty}</p>
      ) : (
        <ul className="grid grid-cols-1 gap-x-6 gap-y-6 md:grid-cols-12 md:gap-y-10">
          {visible.map((it, i) => (
            <li key={it.src + filter} className={`${spans[i % spans.length]} relative`}>
              <button
                type="button"
                className="group relative block h-full w-full overflow-hidden bg-mineral-2 text-left"
                aria-label={`${labels.open}: ${it.altText}`}
                onClick={(e) => {
                  opener.current = e.currentTarget;
                  setOpen(i);
                }}
              >
                <Image
                  src={it.src}
                  alt=""
                  fill
                  sizes="(min-width: 768px) 60vw, 100vw"
                  className="object-cover transition-transform duration-[1200ms] ease-[var(--ease-out)] group-hover:scale-[1.03]"
                  style={{ objectPosition: it.focal }}
                />
                {it.demo && demoLabel ? <span className="demo-mark absolute bottom-3 left-3">{demoLabel}</span> : null}
              </button>
              {it.captionText ? <p className="meta mt-3 text-warm-grey">{it.captionText}</p> : null}
            </li>
          ))}
        </ul>
      )}

      {open !== null ? (
        <Lightbox
          items={visible}
          index={open}
          onIndex={setOpen}
          onClose={() => {
            setOpen(null);
            opener.current?.focus();
          }}
          labels={labels}
          demoLabel={demoLabel}
        />
      ) : null}
    </div>
  );
}

function Lightbox({
  items,
  index,
  onIndex,
  onClose,
  labels,
  demoLabel,
}: {
  items: GalleryEntry[];
  index: number;
  onIndex: (i: number) => void;
  onClose: () => void;
  labels: Labels;
  demoLabel?: string;
}) {
  const dialog = useRef<HTMLDivElement>(null);
  const closeBtn = useRef<HTMLButtonElement>(null);
  const drag = useRef<{ x: number; t: number; id: number } | null>(null);
  const stage = useRef<HTMLDivElement>(null);
  const item = items[index];
  const go = useCallback((d: number) => onIndex((index + d + items.length) % items.length), [index, items.length, onIndex]);

  useEffect(() => {
    closeBtn.current?.focus();
    const prev = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.documentElement.style.overflow = prev;
    };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowRight") go(1);
      else if (e.key === "ArrowLeft") go(-1);
      else if (e.key === "Tab" && dialog.current) {
        const f = dialog.current.querySelectorAll<HTMLElement>("button");
        const first = f[0];
        const last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go, onClose]);

  // preload neighbours so arrows feel instant
  const neighbours = [items[(index + 1) % items.length], items[(index - 1 + items.length) % items.length]];

  return (
    <div
      ref={dialog}
      role="dialog"
      aria-modal="true"
      aria-label={item.altText}
      data-surface="dark"
      className="fixed inset-0 z-[60] flex flex-col bg-mineral text-stone transition-[opacity,transform] duration-300 ease-[var(--ease-out)] starting:scale-[0.98] starting:opacity-0"
    >
      <div className="flex items-center justify-between px-[var(--gutter)] py-4">
        <span className="num meta text-warm-grey" aria-live="polite">
          {labels.counter.replace("{n}", String(index + 1)).replace("{total}", String(items.length))}
        </span>
        <button ref={closeBtn} type="button" onClick={onClose} className="grid size-11 place-items-center rounded-full transition-transform active:scale-95" aria-label={labels.close}>
          <X size={20} strokeWidth={1.3} />
        </button>
      </div>

      <div
        ref={stage}
        className="relative flex-1 touch-pan-y select-none"
        onPointerDown={(e) => {
          if (!e.isPrimary || drag.current) return;
          drag.current = { x: e.clientX, t: performance.now(), id: e.pointerId };
          e.currentTarget.setPointerCapture(e.pointerId);
        }}
        onPointerMove={(e) => {
          if (!drag.current || !stage.current) return;
          const dx = e.clientX - drag.current.x;
          stage.current.style.transform = `translateX(${dx * 0.6}px)`;
        }}
        onPointerUp={(e) => {
          if (!drag.current || !stage.current) return;
          const dx = e.clientX - drag.current.x;
          const v = Math.abs(dx) / (performance.now() - drag.current.t);
          drag.current = null;
          stage.current.style.transition = "transform 240ms var(--ease-out)";
          stage.current.style.transform = "";
          setTimeout(() => stage.current && (stage.current.style.transition = ""), 260);
          if (Math.abs(dx) > 80 || v > 0.11) go(dx < 0 ? 1 : -1);
        }}
        onPointerCancel={() => {
          drag.current = null;
          if (stage.current) stage.current.style.transform = "";
        }}
      >
        <div key={item.src} className="absolute inset-x-[var(--gutter)] inset-y-0 animate-[fade_420ms_var(--ease-out)]">
          {/* contain: renders are never cropped or distorted */}
          <Image src={item.src} alt={item.altText} fill sizes="100vw" className="object-contain" priority />
        </div>
        {neighbours.map((n) => (
          <link key={n.src} rel="prefetch" as="image" href={n.src} />
        ))}
        <button type="button" onClick={() => go(-1)} className="chip absolute left-[max(0.75rem,calc(var(--gutter)-1.5rem))] top-1/2 -translate-y-1/2 !px-0 !w-11 justify-center" aria-label={labels.prev}>
          <ChevronLeft size={18} strokeWidth={1.4} />
        </button>
        <button type="button" onClick={() => go(1)} className="chip absolute right-[max(0.75rem,calc(var(--gutter)-1.5rem))] top-1/2 -translate-y-1/2 !px-0 !w-11 justify-center" aria-label={labels.next}>
          <ChevronRight size={18} strokeWidth={1.4} />
        </button>
      </div>

      <div className="flex min-h-16 items-center gap-4 px-[var(--gutter)] py-4">
        {item.demo && demoLabel ? <span className="demo-mark shrink-0">{demoLabel}</span> : null}
        <p className="meta text-sand">{item.captionText ?? item.altText}</p>
      </div>
    </div>
  );
}
