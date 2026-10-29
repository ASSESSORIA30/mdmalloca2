"use client";

import { useEffect, useRef, useState } from "react";
import { useClientValue } from "@/lib/hooks/use-client-value";
import type { Video } from "@/content/schema";

type Props = {
  film?: Video;
  className?: string;
  /** called once the first frame is decoded, for orchestrating entrances */
  onReady?: () => void;
  pauseLabel: string;
  playLabel: string;
  showControl?: boolean;
};

/**
 * Muted ambient film with a poster-first strategy:
 * - never autoplays with reduced motion or Save-Data; the poster stays.
 * - sources attach after hydration, so the poster is the LCP element.
 * - pauses when off screen or when the tab is hidden.
 */
export function BackgroundFilm({ film, className = "", onReady, pauseLabel, playLabel, showControl = true }: Props) {
  const ref = useRef<HTMLVideoElement>(null);
  const allowed = useClientValue(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const conn = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }).connection;
    const slow = conn?.saveData || conn?.effectiveType === "2g" || conn?.effectiveType === "slow-2g";
    return !reduce && !slow;
  }, false);
  const enabled = !!film && allowed;
  const small = useClientValue(() => window.innerWidth < 768, false);
  const [playing, setPlaying] = useState(false);
  const [userPaused, setUserPaused] = useState(false);

  useEffect(() => {
    const v = ref.current;
    if (!v || !enabled) return;
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !userPaused) v.play().catch(() => {});
      else v.pause();
    });
    io.observe(v);
    const onVis = () => (document.hidden ? v.pause() : !userPaused && v.play().catch(() => {}));
    document.addEventListener("visibilitychange", onVis);
    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [enabled, userPaused]);

  if (!film) return null;

  return (
    <>
      {enabled ? (
        <video
          ref={ref}
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-[1400ms] ease-[var(--ease-out)] ${playing ? "opacity-100" : "opacity-0"} ${className}`}
          muted
          loop
          playsInline
          preload="metadata"
          poster={film.poster}
          aria-hidden
          tabIndex={-1}
          onPlaying={() => {
            setPlaying(true);
            onReady?.();
          }}
        >
          {small && film.mobileMp4 ? <source src={film.mobileMp4} type="video/mp4" /> : null}
          {film.webm && !small ? <source src={film.webm} type="video/webm" /> : null}
          <source src={film.mp4} type="video/mp4" />
        </video>
      ) : null}
      {enabled && showControl ? (
        <button
          type="button"
          className="chip absolute bottom-6 right-[var(--gutter)] z-20"
          aria-label={userPaused ? playLabel : pauseLabel}
          onClick={() => {
            const v = ref.current;
            if (!v) return;
            if (v.paused) {
              setUserPaused(false);
              v.play().catch(() => {});
            } else {
              setUserPaused(true);
              v.pause();
            }
          }}
        >
          <span aria-hidden className="flex h-3 w-3 items-center justify-center gap-[3px]">
            {userPaused ? (
              <svg viewBox="0 0 10 12" className="h-3 w-2.5 fill-current"><path d="M0 0l10 6-10 6z" /></svg>
            ) : (
              <>
                <span className="h-3 w-[2px] bg-current" />
                <span className="h-3 w-[2px] bg-current" />
              </>
            )}
          </span>
        </button>
      ) : null}
    </>
  );
}
