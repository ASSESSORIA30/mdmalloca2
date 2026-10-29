"use client";

import { useEffect } from "react";

const SELECTOR = "[data-reveal]:not([data-shown]), [data-reveal-image]:not([data-shown])";

/**
 * One shared observer marks [data-reveal] / [data-reveal-image] elements as shown.
 * A MutationObserver picks up content that streams in after hydration or on client navigation.
 */
export function RevealObserver() {
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          (e.target as HTMLElement).dataset.shown = "";
          io.unobserve(e.target);
        }
      },
      { rootMargin: "0px 0px -10% 0px" },
    );
    const scan = () => document.querySelectorAll<HTMLElement>(SELECTOR).forEach((el) => io.observe(el));
    scan();
    let queued = false;
    const mo = new MutationObserver(() => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(() => {
        queued = false;
        scan();
      });
    });
    mo.observe(document.body, { childList: true, subtree: true });
    return () => {
      io.disconnect();
      mo.disconnect();
    };
  }, []);
  return null;
}
