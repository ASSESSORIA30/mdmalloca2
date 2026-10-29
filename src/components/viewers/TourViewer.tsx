"use client";

import { useEffect, useRef, useState } from "react";
import { Viewer } from "@photo-sphere-viewer/core";
import { MarkersPlugin } from "@photo-sphere-viewer/markers-plugin";
import { VirtualTourPlugin } from "@photo-sphere-viewer/virtual-tour-plugin";
import "@photo-sphere-viewer/core/index.css";
import "@photo-sphere-viewer/markers-plugin/index.css";
import "@photo-sphere-viewer/virtual-tour-plugin/index.css";
import { Maximize2, X } from "lucide-react";

export type TourScene = {
  id: string;
  title: string;
  panorama: string;
  initialYaw: number;
  planPosition?: [number, number];
  links: { to: string; yaw: number; pitch: number }[];
};

type Labels = { rooms: string; plan: string; fullscreen: string; goTo: string; demo: string };

/** 360° tour on equirectangular panoramas: arrows between rooms, room list and orientation plan. */
export default function TourViewer({ scenes, plan, labels, demo }: { scenes: TourScene[]; plan?: string; labels: Labels; demo: boolean }) {
  const host = useRef<HTMLDivElement>(null);
  const wrap = useRef<HTMLDivElement>(null);
  const tour = useRef<VirtualTourPlugin | null>(null);
  const [current, setCurrent] = useState(scenes[0].id);
  const [showPlan, setShowPlan] = useState(false);

  useEffect(() => {
    if (!host.current) return;
    const viewer = new Viewer({
      container: host.current,
      navbar: false,
      loadingTxt: "",
      defaultZoomLvl: 20,
      mousewheelCtrlKey: true, // page scroll stays page scroll; ctrl/⌘ + wheel zooms
      touchmoveTwoFingers: false,
      moveInertia: 0.85,
      plugins: [
        [MarkersPlugin, {}],
        [
          VirtualTourPlugin,
          {
            positionMode: "manual",
            renderMode: "2d",
            showLinkTooltip: false,
            // discreet room markers instead of the default ground arrows
            arrowStyle: {
              size: { width: 200, height: 44 },
              element: (link: { nodeId: string }) => {
                const el = document.createElement("span");
                el.className = "tour-link";
                el.textContent = scenes.find((x) => x.id === link.nodeId)?.title ?? link.nodeId;
                return el;
              },
            },
            startNodeId: scenes[0].id,
            nodes: scenes.map((s) => ({
              id: s.id,
              panorama: s.panorama,
              name: s.title,
              sphereCorrection: { pan: 0 },
              links: s.links.map((l) => ({ nodeId: l.to, position: { yaw: l.yaw, pitch: l.pitch } })),
            })),
          },
        ],
      ],
    });
    const vt = viewer.getPlugin<VirtualTourPlugin>(VirtualTourPlugin);
    tour.current = vt;
    vt.addEventListener("node-changed", ({ node }) => {
      setCurrent(node.id);
      const s = scenes.find((x) => x.id === node.id);
      if (s) viewer.rotate({ yaw: s.initialYaw, pitch: 0 });
    });
    return () => viewer.destroy();
  }, [scenes]);

  const go = (id: string) => tour.current?.setCurrentNode(id);

  return (
    <div ref={wrap} data-surface="dark" className="relative aspect-[4/5] overflow-hidden bg-mineral-2 text-stone sm:aspect-[16/10] lg:aspect-[16/9] [&:fullscreen]:aspect-auto">
      <div ref={host} className="absolute inset-0 isolate" />

      <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-3 p-3 sm:p-4">
        <div role="group" aria-label={labels.rooms} className="no-scrollbar flex gap-1.5 overflow-x-auto">
          {scenes.map((s) => (
            <button key={s.id} type="button" className="chip shrink-0" aria-current={current === s.id ? "true" : undefined} onClick={() => go(s.id)}>
              {s.title}
            </button>
          ))}
        </div>
        <button type="button" className="chip !w-10 shrink-0 justify-center !px-0" aria-label={labels.fullscreen} onClick={() => (document.fullscreenElement ? document.exitFullscreen() : wrap.current?.requestFullscreen?.())}>
          <Maximize2 size={15} strokeWidth={1.4} />
        </button>
      </div>

      {plan ? (
        <div className="absolute bottom-3 right-3 sm:bottom-4 sm:right-4">
          {showPlan ? (
            <div className="relative w-[min(22rem,70vw)] overflow-hidden rounded-[12px] bg-stone shadow-[0_16px_40px_-16px_rgb(0_0_0/0.6)] transition-[opacity,transform] duration-200 ease-[var(--ease-out)] [transform-origin:bottom_right] starting:scale-95 starting:opacity-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={plan} alt={labels.plan} className="block w-full" />
              {scenes.map((s) =>
                s.planPosition ? (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => go(s.id)}
                    aria-label={labels.goTo.replace("{room}", s.title)}
                    className="absolute grid size-8 -translate-x-1/2 -translate-y-1/2 place-items-center"
                    style={{ left: `${s.planPosition[0] * 100}%`, top: `${s.planPosition[1] * 100}%` }}
                  >
                    <span className={`block rounded-full transition-[width,height,background-color] duration-200 ${current === s.id ? "size-3.5 bg-bronze ring-4 ring-bronze/25" : "size-2.5 bg-mineral"}`} />
                  </button>
                ) : null,
              )}
              <button type="button" onClick={() => setShowPlan(false)} className="absolute right-1 top-1 grid size-9 place-items-center rounded-full text-mineral" aria-label={labels.plan}>
                <X size={15} strokeWidth={1.4} />
              </button>
            </div>
          ) : (
            <button type="button" className="chip" onClick={() => setShowPlan(true)} aria-expanded={false}>
              {labels.plan}
            </button>
          )}
        </div>
      ) : null}
      {demo ? <span className="demo-mark pointer-events-none absolute bottom-3 left-3 sm:bottom-4 sm:left-4">{labels.demo}</span> : null}
    </div>
  );
}
