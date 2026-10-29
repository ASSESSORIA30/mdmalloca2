"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { useState } from "react";
import type { TourScene } from "./TourViewer";

const load = () => import("./TourViewer");
const TourViewer = dynamic(load, { ssr: false });

export function TourChapter(props: {
  scenes: TourScene[];
  plan?: string;
  poster: string;
  enter: string;
  demo: boolean;
  demoLabel?: string;
  labels: { rooms: string; plan: string; fullscreen: string; goTo: string; demo: string };
}) {
  const [on, setOn] = useState(false);
  if (on) return <TourViewer scenes={props.scenes} plan={props.plan} labels={props.labels} demo={props.demo} />;
  return (
    <div className="relative aspect-[4/5] overflow-hidden bg-mineral-2 sm:aspect-[16/10] lg:aspect-[16/9]">
      <Image src={props.poster} alt="" fill sizes="100vw" className="object-cover opacity-75" />
      <div className="absolute inset-0 grid place-items-center bg-mineral/25">
        <button type="button" className="btn btn-solid-light" onMouseEnter={() => void load()} onFocus={() => void load()} onClick={() => setOn(true)}>
          <span aria-hidden className="num text-[0.75rem]">360°</span>
          {props.enter}
        </button>
      </div>
      {props.demo && props.demoLabel ? <span className="demo-mark absolute bottom-3 left-3">{props.demoLabel}</span> : null}
    </div>
  );
}
