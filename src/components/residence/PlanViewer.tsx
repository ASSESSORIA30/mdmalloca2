"use client";

import { useEffect, useRef, useState } from "react";
import { Minus, Plus, Scan } from "lucide-react";

type Plan = { id: string; title: string; src: string; width: number; height: number; demo: boolean };
type Labels = { zoomIn: string; zoomOut: string; reset: string; hint: string };

const MIN = 1;
const MAX = 6;

/** Pan and zoom for architectural plans: wheel, drag, pinch, buttons and keyboard. */
export function PlanViewer({ plans, labels, demoLabel }: { plans: Plan[]; labels: Labels; demoLabel?: string }) {
  const [active, setActive] = useState(0);
  const plan = plans[active];
  const view = useRef<HTMLDivElement>(null);
  const layer = useRef<HTMLDivElement>(null);
  const state = useRef({ s: 1, x: 0, y: 0 });
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const pinch = useRef<{ d: number; s: number } | null>(null);
  const [scale, setScale] = useState(1);

  const write = (animate = false) => {
    const { s, x, y } = state.current;
    if (!layer.current) return;
    layer.current.style.transition = animate ? "transform 260ms var(--ease-out)" : "none";
    layer.current.style.transform = `translate(${x}px, ${y}px) scale(${s})`;
    setScale(s);
  };

  const clampPan = () => {
    const el = view.current;
    if (!el) return;
    const { s } = state.current;
    const mx = (el.clientWidth * (s - 1)) / 2;
    const my = (el.clientHeight * (s - 1)) / 2;
    state.current.x = Math.max(-mx, Math.min(mx, state.current.x));
    state.current.y = Math.max(-my, Math.min(my, state.current.y));
  };

  // zoom towards a point (in viewport coordinates relative to the centre)
  const zoomAt = (next: number, cx = 0, cy = 0, animate = false) => {
    const st = state.current;
    const s = Math.max(MIN, Math.min(MAX, next));
    const k = s / st.s;
    st.x = cx - (cx - st.x) * k;
    st.y = cy - (cy - st.y) * k;
    st.s = s;
    clampPan();
    write(animate);
  };

  const reset = () => {
    state.current = { s: 1, x: 0, y: 0 };
    write(true);
  };

  useEffect(reset, [active]);

  useEffect(() => {
    const el = view.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const r = el.getBoundingClientRect();
      zoomAt(state.current.s * Math.exp(-e.deltaY * 0.0022), e.clientX - r.left - r.width / 2, e.clientY - r.top - r.height / 2);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  });

  return (
    <div>
      {plans.length > 1 ? (
        <div className="mb-6 flex flex-wrap gap-2">
          {plans.map((p, i) => (
            <button key={p.id} type="button" className="chip" aria-pressed={i === active} onClick={() => setActive(i)}>
              {p.title}
            </button>
          ))}
        </div>
      ) : null}
      <div
        ref={view}
        tabIndex={0}
        role="group"
        aria-roledescription="zoomable plan"
        aria-label={`${plan.title}. ${labels.hint}`}
        className={`relative aspect-[4/3] touch-none overflow-hidden bg-stone sm:aspect-[16/11] ${scale > 1 ? "cursor-grab active:cursor-grabbing" : "cursor-zoom-in"}`}
        onKeyDown={(e) => {
          const st = state.current;
          const pan: Record<string, [number, number]> = { ArrowLeft: [60, 0], ArrowRight: [-60, 0], ArrowUp: [0, 60], ArrowDown: [0, -60] };
          if (e.key === "+" || e.key === "=") zoomAt(st.s * 1.4, 0, 0, true);
          else if (e.key === "-") zoomAt(st.s / 1.4, 0, 0, true);
          else if (e.key === "0") reset();
          else if (e.key in pan) {
            st.x += pan[e.key][0];
            st.y += pan[e.key][1];
            clampPan();
            write(true);
          } else return;
          e.preventDefault();
        }}
        onDoubleClick={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          if (state.current.s > 1.5) reset();
          else zoomAt(2.5, e.clientX - r.left - r.width / 2, e.clientY - r.top - r.height / 2, true);
        }}
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
          if (pointers.current.size === 2) {
            const [a, b] = [...pointers.current.values()];
            pinch.current = { d: Math.hypot(a.x - b.x, a.y - b.y), s: state.current.s };
          }
        }}
        onPointerMove={(e) => {
          const prev = pointers.current.get(e.pointerId);
          if (!prev) return;
          pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
          if (pointers.current.size === 2 && pinch.current) {
            const [a, b] = [...pointers.current.values()];
            zoomAt((pinch.current.s * Math.hypot(a.x - b.x, a.y - b.y)) / pinch.current.d);
          } else if (pointers.current.size === 1) {
            state.current.x += e.clientX - prev.x;
            state.current.y += e.clientY - prev.y;
            clampPan();
            write();
          }
        }}
        onPointerUp={(e) => {
          pointers.current.delete(e.pointerId);
          if (pointers.current.size < 2) pinch.current = null;
        }}
        onPointerCancel={(e) => pointers.current.delete(e.pointerId)}
      >
        <div ref={layer} className="absolute inset-0 origin-center will-change-transform">
          {/* plans are drawings: never cropped, never resampled lossy */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={plan.src} alt="" width={plan.width} height={plan.height} draggable={false} className="h-full w-full select-none object-contain p-4" />
        </div>
        <div className="absolute bottom-3 right-3 flex gap-1.5">
          <button type="button" className="chip !w-11 justify-center !px-0" onClick={() => zoomAt(state.current.s * 1.5, 0, 0, true)} aria-label={labels.zoomIn}>
            <Plus size={16} strokeWidth={1.4} />
          </button>
          <button type="button" className="chip !w-11 justify-center !px-0" onClick={() => zoomAt(state.current.s / 1.5, 0, 0, true)} aria-label={labels.zoomOut}>
            <Minus size={16} strokeWidth={1.4} />
          </button>
          <button type="button" className="chip !w-11 justify-center !px-0" onClick={reset} aria-label={labels.reset}>
            <Scan size={16} strokeWidth={1.4} />
          </button>
        </div>
        {plan.demo && demoLabel ? <span className="demo-mark absolute bottom-3 left-3">{demoLabel}</span> : null}
      </div>
      <p className="meta mt-3 text-warm-grey">{labels.hint}</p>
    </div>
  );
}
