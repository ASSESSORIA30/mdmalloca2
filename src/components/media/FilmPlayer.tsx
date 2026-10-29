"use client";

import { useEffect, useRef, useState } from "react";
import { Maximize2, Pause, Play, Volume2, VolumeX } from "lucide-react";
import type { Video } from "@/content/schema";
import { useClientValue } from "@/lib/hooks/use-client-value";

type Labels = { play: string; pause: string; mute: string; unmute: string; fullscreen: string; progress: string };

const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

/**
 * Cinematic player with discreet controls. The frame opens from a framed plate to full bleed
 * as it scrolls in; that scroll effect only touches the frame, never playback.
 */
export function FilmPlayer({ film, labels, demoLabel, title }: { film: Video; labels: Labels; demoLabel?: string; title: string }) {
  const wrap = useRef<HTMLDivElement>(null);
  const frame = useRef<HTMLDivElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const [started, setStarted] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(true);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(film.durationSeconds ?? 0);
  const small = useClientValue(() => window.innerWidth < 768, false);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const el = wrap.current;
        if (!el || !frame.current) return;
        const r = el.getBoundingClientRect();
        const k = Math.min(1, Math.max(0, (window.innerHeight - r.top) / (window.innerHeight * 0.85)));
        const inset = (1 - k) * 7;
        frame.current.style.clipPath = `inset(${inset}% ${inset * 1.4}% round ${(1 - k) * 18}px)`;
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  // pause when the film leaves the screen; the visitor resumes it themselves
  useEffect(() => {
    const v = video.current;
    if (!v) return;
    const io = new IntersectionObserver(([e]) => !e.isIntersecting && v.pause(), { threshold: 0.2 });
    io.observe(v);
    return () => io.disconnect();
  }, []);

  const toggle = () => {
    const v = video.current;
    if (!v) return;
    setStarted(true);
    if (v.paused) v.play().catch(() => {});
    else v.pause();
  };

  return (
    <div ref={wrap} className="relative">
      <div ref={frame} className="group relative aspect-video overflow-hidden bg-mineral-2" data-surface="dark">
        <video
          ref={video}
          className="absolute inset-0 h-full w-full object-cover"
          poster={film.poster}
          preload="none"
          playsInline
          muted={muted}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onEnded={() => setPlaying(false)}
          onTimeUpdate={(e) => setTime(e.currentTarget.currentTime)}
          onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
          onClick={toggle}
          aria-label={title}
        >
          {small && film.mobileMp4 ? <source src={film.mobileMp4} type="video/mp4" /> : null}
          {film.webm && !small ? <source src={film.webm} type="video/webm" /> : null}
          <source src={film.mp4} type="video/mp4" />
        </video>

        {!started ? (
          <button type="button" onClick={toggle} className="absolute inset-0 grid place-items-center text-stone" aria-label={`${labels.play}: ${title}`}>
            <span className="grid size-20 place-items-center rounded-full border border-stone/50 bg-mineral/30 backdrop-blur-md transition-transform duration-200 ease-[var(--ease-out)] group-hover:scale-105 group-active:scale-95">
              <Play size={22} strokeWidth={1.2} className="translate-x-0.5" />
            </span>
          </button>
        ) : null}

        <div
          className={`absolute inset-x-0 bottom-0 flex items-center gap-3 bg-[linear-gradient(0deg,rgb(22_23_21/0.6),transparent)] p-4 pt-12 text-stone transition-opacity duration-300 ${
            started ? (playing ? "opacity-0 group-hover:opacity-100 group-focus-within:opacity-100" : "opacity-100") : "pointer-events-none opacity-0"
          }`}
        >
          <button type="button" className="grid size-11 place-items-center rounded-full transition-transform active:scale-95" onClick={toggle} aria-label={playing ? labels.pause : labels.play}>
            {playing ? <Pause size={18} strokeWidth={1.4} /> : <Play size={18} strokeWidth={1.4} />}
          </button>
          <span className="num meta w-10 text-sand">{fmt(time)}</span>
          <input
            type="range"
            min={0}
            max={duration || 1}
            step={0.05}
            value={time}
            aria-label={labels.progress}
            onChange={(e) => {
              const v = video.current;
              if (v) v.currentTime = Number(e.target.value);
            }}
            className="film-range h-11 flex-1"
            style={{ ["--p" as string]: `${duration ? (time / duration) * 100 : 0}%` }}
          />
          <span className="num meta w-10 text-right text-sand">{fmt(duration)}</span>
          <button type="button" className="grid size-11 place-items-center rounded-full active:scale-95" onClick={() => setMuted((m) => !m)} aria-label={muted ? labels.unmute : labels.mute}>
            {muted ? <VolumeX size={18} strokeWidth={1.4} /> : <Volume2 size={18} strokeWidth={1.4} />}
          </button>
          <button
            type="button"
            className="grid size-11 place-items-center rounded-full active:scale-95"
            onClick={() => {
              const v = video.current as HTMLVideoElement & { webkitEnterFullscreen?: () => void };
              if (frame.current?.requestFullscreen) frame.current.requestFullscreen().catch(() => v?.webkitEnterFullscreen?.());
              else v?.webkitEnterFullscreen?.();
            }}
            aria-label={labels.fullscreen}
          >
            <Maximize2 size={17} strokeWidth={1.4} />
          </button>
        </div>
        {film.demo && demoLabel ? <span className="demo-mark pointer-events-none absolute left-3 top-3">{demoLabel}</span> : null}
      </div>
    </div>
  );
}
