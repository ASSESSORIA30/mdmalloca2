"use client";

import { useEffect, useRef, useState } from "react";
import { Map as MLMap, Marker, setWorkerUrl, type StyleSpecification } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { Minus, Plus } from "lucide-react";

type Props = {
  lat: number;
  lng: number;
  precision: "exact" | "approximate";
  radiusMeters: number;
  name: string;
  labels: { satellite: string; map: string; zoomIn: string; zoomOut: string; unavailable: string };
};

// The worker is served as a static file (copied by scripts/copy-vendor.mjs on install).
setWorkerUrl("/vendor/maplibre-gl-worker.mjs");

const MAPBOX = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
// Vector basemap (no key). Swap NEXT_PUBLIC_MAP_STYLE for a Mapbox/MapTiler style URL in production if preferred.
const VECTOR_STYLE = process.env.NEXT_PUBLIC_MAP_STYLE || "https://tiles.openfreemap.org/styles/positron";

function satelliteStyle(): StyleSpecification {
  const tiles = MAPBOX
    ? [`https://api.mapbox.com/v4/mapbox.satellite/{z}/{x}/{y}@2x.jpg90?access_token=${MAPBOX}`]
    : ["https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"];
  return {
    version: 8,
    sources: {
      sat: {
        type: "raster",
        tiles,
        tileSize: MAPBOX ? 512 : 256,
        maxzoom: 19,
        attribution: MAPBOX ? "© Mapbox © Maxar" : "Imagery © Esri, Maxar, Earthstar Geographics",
      },
    },
    layers: [{ id: "sat", type: "raster", source: "sat", paint: { "raster-saturation": -0.15, "raster-contrast": 0.05 } }],
  };
}

/** Recolour a light vector style into the site palette so the map reads as part of the page. */
function tint(map: MLMap) {
  for (const layer of map.getStyle().layers ?? []) {
    const id = layer.id;
    try {
      if (layer.type === "background") map.setPaintProperty(id, "background-color", "#F5F3EE");
      else if (layer.type === "fill" && /water/.test(id)) map.setPaintProperty(id, "fill-color", "#CED6D4");
      else if (layer.type === "fill" && /(park|wood|grass|landcover|landuse)/.test(id)) map.setPaintProperty(id, "fill-color", "#E6E1D3");
      else if (layer.type === "fill" && /building/.test(id)) map.setPaintProperty(id, "fill-color", "#E1DBCE");
      else if (layer.type === "line" && /(road|highway|street|path|bridge|tunnel)/.test(id)) map.setPaintProperty(id, "line-color", "#FFFFFF");
      else if (layer.type === "line" && /water/.test(id)) map.setPaintProperty(id, "line-color", "#B9C4C2");
      else if (layer.type === "symbol") {
        map.setPaintProperty(id, "text-color", "#67645E");
        map.setPaintProperty(id, "text-halo-color", "#F5F3EE");
      }
    } catch {
      /* layer without that paint property */
    }
  }
}

function circle(lng: number, lat: number, r: number, steps = 96): GeoJSON.Feature<GeoJSON.Polygon> {
  const coords: [number, number][] = [];
  const dLat = r / 111320;
  const dLng = r / (111320 * Math.cos((lat * Math.PI) / 180));
  for (let i = 0; i <= steps; i++) {
    const a = (i / steps) * Math.PI * 2;
    coords.push([lng + Math.cos(a) * dLng, lat + Math.sin(a) * dLat]);
  }
  return { type: "Feature", properties: {}, geometry: { type: "Polygon", coordinates: [coords] } };
}

export default function LocationMap({ lat, lng, precision, radiusMeters, name, labels }: Props) {
  const host = useRef<HTMLDivElement>(null);
  const map = useRef<MLMap | null>(null);
  const [mode, setMode] = useState<"satellite" | "map">("satellite");
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!host.current) return;
    const m = new MLMap({
      container: host.current,
      style: satelliteStyle(),
      center: [lng, lat],
      zoom: precision === "exact" ? 15 : 11.5,
      minZoom: 7,
      maxZoom: precision === "exact" ? 18 : 13, // approximate areas cannot be zoomed into a plot
      cooperativeGestures: true,
      attributionControl: { compact: true },
      maxBounds: [
        [1.9, 38.9],
        [3.9, 40.3],
      ],
    });
    map.current = m;
    let errors = 0;
    m.on("error", () => {
      if (++errors > 6) setFailed(true);
    });
    const addOverlay = () => {
      if (m.getSource("area")) return;
      if (precision === "approximate") {
        m.addSource("area", { type: "geojson", data: circle(lng, lat, radiusMeters) });
        m.addLayer({ id: "area-fill", type: "fill", source: "area", paint: { "fill-color": "#A89170", "fill-opacity": 0.18 } });
        m.addLayer({ id: "area-line", type: "line", source: "area", paint: { "line-color": "#F5F3EE", "line-width": 1.2, "line-dasharray": [2, 2] } });
      }
    };
    m.on("style.load", () => {
      if (m.getStyle().sources.sat === undefined) tint(m);
      addOverlay();
    });
    if (precision === "exact") {
      const el = document.createElement("div");
      el.setAttribute("aria-label", name);
      el.className = "size-4 rounded-full bg-bronze ring-[6px] ring-bronze/30 shadow-[0_0_0_1px_#F5F3EE]";
      new Marker({ element: el }).setLngLat([lng, lat]).addTo(m);
    }
    return () => m.remove();
  }, [lat, lng, precision, radiusMeters, name]);

  useEffect(() => {
    const m = map.current;
    if (!m) return;
    m.setStyle(mode === "satellite" ? satelliteStyle() : VECTOR_STYLE);
  }, [mode]);

  return (
    <div data-surface="dark" className="relative h-full w-full overflow-hidden bg-mineral-2">
      <div ref={host} className="absolute inset-0 isolate" />
      <div className="absolute left-3 top-3 flex gap-1.5">
        <button type="button" className="chip" aria-pressed={mode === "satellite"} onClick={() => setMode("satellite")}>
          {labels.satellite}
        </button>
        <button type="button" className="chip" aria-pressed={mode === "map"} onClick={() => setMode("map")}>
          {labels.map}
        </button>
      </div>
      <div className="absolute right-3 top-3 flex flex-col gap-1.5">
        <button type="button" className="chip !w-10 justify-center !px-0" aria-label={labels.zoomIn} onClick={() => map.current?.zoomIn()}>
          <Plus size={15} strokeWidth={1.4} />
        </button>
        <button type="button" className="chip !w-10 justify-center !px-0" aria-label={labels.zoomOut} onClick={() => map.current?.zoomOut()}>
          <Minus size={15} strokeWidth={1.4} />
        </button>
      </div>
      {failed ? (
        <div className="absolute inset-0 grid place-items-center bg-mineral-2/90 p-8 text-center text-sand">
          <p className="max-w-sm">{labels.unavailable}</p>
        </div>
      ) : null}
    </div>
  );
}
