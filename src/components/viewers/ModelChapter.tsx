"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { useState } from "react";
import { Box } from "lucide-react";
import type { ModelLabels, ModelSource } from "./ModelViewer";

const load = () => import("./ModelViewer");
const ModelViewer = dynamic(load, { ssr: false });

function webglAvailable() {
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}

/** Shows a still until the visitor asks for the model, so no 3D code or assets load on arrival. */
export function ModelChapter({
  source,
  poster,
  labels,
  enter,
  weight,
  unsupported,
  demoLabel,
}: {
  source: ModelSource;
  poster: string;
  labels: ModelLabels;
  enter: string;
  weight: string;
  unsupported: string;
  demoLabel?: string;
}) {
  const [state, setState] = useState<"idle" | "on" | "unsupported">("idle");

  if (state === "on") return <ModelViewer source={source} labels={labels} demoLabel={demoLabel} />;

  return (
    <div className="relative aspect-[4/5] overflow-hidden bg-mineral-2 sm:aspect-[16/10] lg:aspect-[16/9]">
      <Image src={poster} alt="" fill sizes="100vw" className="object-cover opacity-70" />
      <div className="absolute inset-0 bg-mineral/30" />
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-6 text-center text-stone">
        {state === "unsupported" ? (
          <p className="max-w-sm">{unsupported}</p>
        ) : (
          <>
            <button
              type="button"
              className="btn btn-solid-light"
              onMouseEnter={() => void load()}
              onFocus={() => void load()}
              onClick={() => setState(webglAvailable() ? "on" : "unsupported")}
            >
              <Box size={16} strokeWidth={1.4} />
              {enter}
            </button>
            <p className="meta text-sand">{weight}</p>
          </>
        )}
      </div>
      {demoLabel ? <span className="demo-mark absolute bottom-3 left-3">{demoLabel}</span> : null}
    </div>
  );
}
