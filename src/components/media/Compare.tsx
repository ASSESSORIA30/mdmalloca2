"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef } from "react";
import type { Media } from "@/content/schema";

type Props = {
  before: Media;
  after: Media;
  beforeAlt: string;
  afterAlt: string;
  beforeLabel: string;
  afterLabel: string;
  handleLabel: string;
  demoLabel?: string;
  sizes?: string;
};

const clamp = (v: number) => Math.min(100, Math.max(0, v));

/**
 * Before/after comparator. While it scrolls through the viewport the divider sweeps
 * from the land to the residence; the moment the visitor touches it, manual control wins
 * for good. Position is written straight to the DOM, so dragging never re-renders React.
 */
export function Compare(p: Props) {
  const frame = useRef<HTMLDivElement>(null);
  const top = useRef<HTMLDivElement>(null);
  const handle = useRef<HTMLDivElement>(null);
  const beforeTag = useRef<HTMLSpanElement>(null);
  const afterTag = useRef<HTMLSpanElement>(null);
  const pos = useRef(88);
  const manual = useRef(false);
  const dragging = useRef(false);

  const apply = useCallback((v: number, animate = false) => {
    pos.current = clamp(v);
    const t = animate ? "clip-path 260ms var(--ease-out), transform 260ms var(--ease-out)" : "none";
    if (top.current) {
      top.current.style.transition = t;
      top.current.style.clipPath = `inset(0 0 0 ${pos.current}%)`;
    }
    if (handle.current) {
      handle.current.style.transition = t;
      handle.current.style.transform = `translateX(${pos.current}cqw)`;
      handle.current.setAttribute("aria-valuenow", String(Math.round(pos.current)));
    }
    if (beforeTag.current) beforeTag.current.style.opacity = String(Math.min(1, pos.current / 25));
    if (afterTag.current) afterTag.current.style.opacity = String(Math.min(1, (100 - pos.current) / 25));
  }, []);

  useEffect(() => {
    apply(pos.current);
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      apply(50);
      return;
    }
    let raf = 0;
    const onScroll = () => {
      if (raf || manual.current) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const el = frame.current;
        if (!el || manual.current) return;
        const r = el.getBoundingClientRect();
        const vh = window.innerHeight;
        // 0 when the frame's top enters the bottom of the viewport, 1 when its centre reaches 40% height
        const prog = clamp(((vh - r.top) / (vh * 0.6 + r.height / 2)) * 100) / 100;
        apply(88 - prog * 38);
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, [apply]);

  const fromEvent = (e: React.PointerEvent) => {
    const r = frame.current!.getBoundingClientRect();
    return ((e.clientX - r.left) / r.width) * 100;
  };

  return (
    <div
      ref={frame}
      className="relative aspect-[4/5] touch-pan-y select-none overflow-hidden bg-mineral-2 [container-type:inline-size] sm:aspect-[16/9]"
      onPointerDown={(e) => {
        if (!e.isPrimary || dragging.current) return; // ignore extra fingers once a drag starts
        manual.current = true;
        dragging.current = true;
        e.currentTarget.setPointerCapture(e.pointerId);
        apply(fromEvent(e), true);
      }}
      onPointerMove={(e) => {
        if (dragging.current) apply(fromEvent(e));
      }}
      onPointerUp={() => (dragging.current = false)}
      onPointerCancel={() => (dragging.current = false)}
    >
      <Image src={p.before.src} alt={p.beforeAlt} fill sizes={p.sizes ?? "100vw"} className="pointer-events-none object-cover" style={{ objectPosition: p.before.focal }} draggable={false} />
      <div ref={top} className="absolute inset-0 will-change-[clip-path]" style={{ clipPath: "inset(0 0 0 88%)" }}>
        <Image src={p.after.src} alt={p.afterAlt} fill sizes={p.sizes ?? "100vw"} className="pointer-events-none object-cover" style={{ objectPosition: p.after.focal }} draggable={false} />
      </div>

      <span ref={beforeTag} className="chip pointer-events-none absolute left-4 top-4">{p.beforeLabel}</span>
      <span ref={afterTag} className="chip pointer-events-none absolute right-4 top-4">{p.afterLabel}</span>

      <div
        ref={handle}
        role="slider"
        tabIndex={0}
        aria-label={p.handleLabel}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={88}
        aria-valuetext={`${p.beforeLabel} / ${p.afterLabel}`}
        className="absolute inset-y-0 left-0 w-0 cursor-ew-resize outline-none [&:focus-visible_.grip]:ring-1 [&:focus-visible_.grip]:ring-bronze [&:focus-visible_.grip]:ring-offset-4 [&:focus-visible_.grip]:ring-offset-transparent"
        style={{ transform: "translateX(88cqw)" }}
        onKeyDown={(e) => {
          const step = e.shiftKey ? 10 : 2;
          const map: Record<string, number> = { ArrowLeft: -step, ArrowDown: -step, ArrowRight: step, ArrowUp: step };
          if (e.key in map) {
            e.preventDefault();
            manual.current = true;
            apply(pos.current + map[e.key]);
          } else if (e.key === "Home" || e.key === "End") {
            e.preventDefault();
            manual.current = true;
            apply(e.key === "Home" ? 0 : 100, true);
          }
        }}
      >
        <span aria-hidden className="absolute inset-y-0 -left-px w-px bg-bronze" />
        <span aria-hidden className="grip absolute left-0 top-1/2 grid size-12 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-stone/40 bg-mineral/55 text-stone backdrop-blur-md transition-transform duration-150 active:scale-95">
          <svg width="22" height="10" viewBox="0 0 22 10" fill="none" stroke="currentColor" strokeWidth="1.2">
            <path d="M5 1 1 5l4 4M17 1l4 4-4 4" />
          </svg>
        </span>
      </div>

      {p.demoLabel ? <span className="demo-mark pointer-events-none absolute bottom-3 left-3">{p.demoLabel}</span> : null}
    </div>
  );
}
