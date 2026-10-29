"use client";

import { Canvas, useThree } from "@react-three/fiber";
import { CameraControls, ContactShadows, Environment, Html, useGLTF } from "@react-three/drei";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { Layers, Maximize2, Minimize2, Moon, RotateCcw, Sun } from "lucide-react";
import { createMaquette, type Maquette } from "@/three/maquette/build";
import type { CameraView, Hotspot, VariantId } from "@/three/maquette/variants";

export type ModelSource =
  | { type: "maquette"; variant: VariantId; demo: true }
  | { type: "glb"; src: string; poster?: string; demo: boolean }
  | { type: "iframe"; src: string; demo: boolean };

export type ModelLabels = {
  views: string;
  day: string;
  night: string;
  floors: string;
  allFloors: string;
  groundFloor: string;
  fullscreen: string;
  exitFullscreen: string;
  reset: string;
  hint: string;
  demo: string;
  loading: string;
  viewNames: Record<string, string>;
};

const VIEW_ORDER = ["hero", "aerial", "facade", "pool", "terrace", "living", "plan"];

type SceneApi = { views: CameraView[]; hotspots: Hotspot[]; hasLevels: boolean };

/* ----------------------------- maquette ----------------------------- */
function MaquetteScene({ variant, night, ground, onReady }: { variant: VariantId; night: boolean; ground: boolean; onReady: (api: SceneApi) => void }) {
  const { gl, scene, invalidate } = useThree();
  const ref = useRef<Maquette | null>(null);
  useEffect(() => {
    const mobile = window.matchMedia("(max-width: 768px)").matches;
    const m = createMaquette(gl, scene, { variant, quality: mobile ? "low" : "medium", atmosphere: "golden" });
    ref.current = m;
    onReady({ views: m.views, hotspots: m.hotspots, hasLevels: true });
    invalidate();
    return () => {
      m.dispose();
      scene.environment = null;
      scene.background = null;
      scene.fog = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gl, scene, variant]);
  // rendering is on demand: every state change asks for one new frame
  useEffect(() => {
    ref.current?.setAtmosphere(night ? "night" : "golden");
    invalidate();
  }, [night, invalidate]);
  useEffect(() => {
    ref.current?.setUpperFloorVisible(!ground);
    invalidate();
  }, [ground, invalidate]);
  return null;
}

/* ------------------------------- GLB -------------------------------- */
function GlbScene({ src, night, onReady }: { src: string; night: boolean; onReady: (api: SceneApi) => void }) {
  const { scene: model } = useGLTF(src);
  const box = useMemo(() => new THREE.Box3().setFromObject(model), [model]);
  useEffect(() => {
    model.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.isMesh) m.castShadow = m.receiveShadow = true;
    });
    const c = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3()).length();
    const at = (dx: number, dy: number, dz: number): [number, number, number] => [c.x + dx * size, c.y + dy * size, c.z + dz * size];
    // Generic stations derived from the model bounds; replace with authored views per project.
    onReady({
      views: [
        { id: "hero", position: at(0.7, 0.35, 0.7), target: [c.x, c.y, c.z] },
        { id: "aerial", position: at(0.5, 1.0, 0.5), target: [c.x, c.y, c.z] },
        { id: "facade", position: at(0, 0.1, 1.0), target: [c.x, c.y, c.z] },
        { id: "plan", position: at(0, 1.4, 0.001), target: [c.x, c.y, c.z] },
      ],
      hotspots: [],
      hasLevels: false,
    });
  }, [model, box, onReady]);
  return (
    <>
      <primitive object={model} />
      <Environment files={night ? "/hdri/night.exr" : "/hdri/sunset.exr"} background={false} environmentIntensity={night ? 0.25 : 1} />
      <directionalLight position={[30, 40, 20]} intensity={night ? 0.2 : 2.4} castShadow shadow-mapSize={[2048, 2048]} />
      <ContactShadows position={[0, box.min.y + 0.01, 0]} opacity={0.45} scale={box.getSize(new THREE.Vector3()).length() * 1.5} blur={2.6} far={10} />
    </>
  );
}

/* ----------------------------- viewer UI ---------------------------- */
export default function ModelViewer({ source, labels, demoLabel }: { source: ModelSource; labels: ModelLabels; demoLabel?: string }) {
  const wrap = useRef<HTMLDivElement>(null);
  const controls = useRef<CameraControls>(null);
  const [api, setApi] = useState<SceneApi | null>(null);
  const [night, setNight] = useState(false);
  const [ground, setGround] = useState(false);
  const [view, setView] = useState("hero");
  const [full, setFull] = useState(false);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const onFs = () => setFull(document.fullscreenElement === wrap.current);
    document.addEventListener("fullscreenchange", onFs);
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting));
    if (wrap.current) io.observe(wrap.current);
    return () => {
      document.removeEventListener("fullscreenchange", onFs);
      io.disconnect();
    };
  }, []);

  const goTo = (id: string, smooth = true) => {
    const v = api?.views.find((x) => x.id === id);
    if (!v || !controls.current) return;
    setView(id);
    controls.current.setLookAt(...v.position, ...v.target, smooth);
  };

  // first framing once the scene reports its stations
  useEffect(() => {
    if (api) goTo("hero", false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [api]);

  if (source.type === "iframe") {
    return (
      <div ref={wrap} className="relative aspect-[4/5] overflow-hidden bg-mineral-2 sm:aspect-video">
        <iframe src={source.src} title="3D" className="absolute inset-0 h-full w-full" allow="fullscreen; xr-spatial-tracking" loading="lazy" />
      </div>
    );
  }

  const views = (api?.views ?? []).filter((v) => VIEW_ORDER.includes(v.id)).sort((a, b) => VIEW_ORDER.indexOf(a.id) - VIEW_ORDER.indexOf(b.id));

  return (
    <div ref={wrap} data-surface="dark" className={`relative overflow-hidden bg-mineral-2 text-stone ${full ? "h-screen w-screen" : "aspect-[4/5] sm:aspect-[16/10] lg:aspect-[16/9]"}`}>
      <Canvas
        shadows="soft"
        dpr={[1, 1.75]}
        frameloop={visible ? "demand" : "never"}
        camera={{ fov: 38, near: 0.3, far: 30000, position: [60, 30, 60] }}
        gl={{ antialias: true, powerPreference: "high-performance", toneMapping: THREE.ACESFilmicToneMapping }}
        className="!absolute inset-0 touch-none"
      >
        <Suspense fallback={null}>
          {source.type === "maquette" ? (
            <MaquetteScene variant={source.variant} night={night} ground={ground} onReady={setApi} />
          ) : (
            <GlbScene src={source.src} night={night} onReady={setApi} />
          )}
        </Suspense>
        <CameraControls
          ref={controls}
          makeDefault
          minDistance={4}
          maxDistance={260}
          maxPolarAngle={Math.PI * 0.49}
          smoothTime={0.6}
          draggingSmoothTime={0.12}
          onStart={() => setView("")}
        />
        {api?.hotspots.map((h) => (
          <Html key={h.id} position={h.position} center zIndexRange={[20, 0]}>
            <button
              type="button"
              onClick={() => goTo(h.view)}
              className="group flex items-center gap-2 whitespace-nowrap"
              aria-label={labels.viewNames[h.id] ?? h.id}
            >
              <span className="grid size-7 place-items-center rounded-full border border-stone/70 bg-mineral/50 backdrop-blur-sm transition-transform duration-200 ease-[var(--ease-out)] group-hover:scale-110 group-active:scale-95">
                <span className="size-1.5 rounded-full bg-stone" />
              </span>
              <span className="rounded-full bg-mineral/60 px-2.5 py-1 text-[0.75rem] text-stone opacity-0 backdrop-blur-sm transition-opacity duration-200 group-hover:opacity-100 group-focus-visible:opacity-100">
                {labels.viewNames[h.id] ?? h.id}
              </span>
            </button>
          </Html>
        ))}
      </Canvas>

      {!api ? (
        <div className="absolute inset-0 grid place-items-center">
          <span className="meta flex items-center gap-3 text-sand">
            <span className="block h-px w-10 origin-left animate-[load_1.1s_var(--ease-in-out)_infinite] bg-bronze" />
            {labels.loading}
          </span>
        </div>
      ) : null}

      {/* top: viewpoints */}
      <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-3 p-3 sm:p-4">
        <div role="group" aria-label={labels.views} className="no-scrollbar flex max-w-full gap-1.5 overflow-x-auto">
          {views.map((v) => (
            <button key={v.id} type="button" className="chip shrink-0" aria-pressed={view === v.id} onClick={() => goTo(v.id)}>
              {labels.viewNames[v.id] ?? v.id}
            </button>
          ))}
        </div>
        <button
          type="button"
          className="chip !w-10 shrink-0 justify-center !px-0"
          aria-label={full ? labels.exitFullscreen : labels.fullscreen}
          onClick={() => (full ? document.exitFullscreen() : wrap.current?.requestFullscreen?.())}
        >
          {full ? <Minimize2 size={15} strokeWidth={1.4} /> : <Maximize2 size={15} strokeWidth={1.4} />}
        </button>
      </div>

      {/* bottom: light, levels, reset */}
      <div className="absolute inset-x-0 bottom-0 flex flex-wrap items-end justify-between gap-3 p-3 sm:p-4">
        <div className="flex flex-wrap gap-1.5">
          <button type="button" className="chip" aria-pressed={!night} onClick={() => setNight(false)}>
            <Sun size={14} strokeWidth={1.4} /> {labels.day}
          </button>
          <button type="button" className="chip" aria-pressed={night} onClick={() => setNight(true)}>
            <Moon size={14} strokeWidth={1.4} /> {labels.night}
          </button>
          {api?.hasLevels ? (
            <button type="button" className="chip" aria-pressed={ground} onClick={() => setGround((g) => !g)} aria-label={`${labels.floors}: ${ground ? labels.groundFloor : labels.allFloors}`}>
              <Layers size={14} strokeWidth={1.4} /> {ground ? labels.groundFloor : labels.allFloors}
            </button>
          ) : null}
          <button type="button" className="chip !w-10 justify-center !px-0" aria-label={labels.reset} onClick={() => goTo("hero")}>
            <RotateCcw size={14} strokeWidth={1.4} />
          </button>
        </div>
        <span className="meta hidden text-sand/80 md:block">{labels.hint}</span>
      </div>
      {source.demo && demoLabel ? (
        <p className="pointer-events-none absolute left-3 top-16 max-w-[min(26rem,calc(100%-1.5rem))] sm:left-4">
          <span className="demo-mark !items-start !rounded-2xl !py-2 leading-snug">{labels.demo}</span>
        </p>
      ) : null}
    </div>
  );
}
