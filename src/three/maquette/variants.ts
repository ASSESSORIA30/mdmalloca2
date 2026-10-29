// Massing for the three demonstration studies.
//
// IMPORTANT: these volumes are an abstract architectural study used to
// demonstrate the viewer, the before/after comparator and the render
// pipeline. They do NOT represent any ModularDom project. Replace them with
// the project's GLB model (see README → "Integrating 3D models").

export type MaterialKey =
  | "plaster"
  | "stone"
  | "timber"
  | "glass"
  | "water"
  | "coping"
  | "metal"
  | "oak"
  | "interiorWall"
  | "fabric";

export type Box = {
  /** centre x, base y (relative to pad), centre z */
  p: [number, number, number];
  /** width (x), height (y), depth (z) */
  s: [number, number, number];
  m: MaterialKey;
  /** assembly order; boxes sharing a step arrive together */
  step: number;
  /** belongs to the upper floor (hidden when the viewer shows the ground floor) */
  upper?: boolean;
  /** emits light at night (interior ceiling strips) */
  glow?: boolean;
  castShadow?: boolean;
};

export type CameraView = {
  id: string;
  position: [number, number, number];
  target: [number, number, number];
  fov?: number;
};

export type Hotspot = {
  id: "facade" | "pool" | "terrace" | "garden" | "living";
  position: [number, number, number];
  view: string;
};

export type VariantId = "horizon" | "patio" | "terraces";

export type Variant = {
  id: VariantId;
  footprint: { halfX: number; halfZ: number; cx: number; cz: number };
  boxes: Box[];
  views: CameraView[];
  hotspots: Hotspot[];
};

function slats(
  out: Box[],
  {
    from,
    to,
    y,
    z,
    depth,
    gap,
    step,
    axis = "x",
  }: { from: number; to: number; y: number; z: number; depth: number; gap: number; step: number; axis?: "x" | "z" },
) {
  for (let v = from; v <= to; v += gap) {
    out.push(
      axis === "x"
        ? { p: [v, y, z], s: [0.14, 0.18, depth], m: "timber", step }
        : { p: [z, y, v], s: [depth, 0.18, 0.14], m: "timber", step },
    );
  }
}

function pool(
  out: Box[],
  { cx, cz, w, d, step, y = 0 }: { cx: number; cz: number; w: number; d: number; step: number; y?: number },
) {
  const c = 0.5;
  out.push({ p: [cx, y - 0.02, cz], s: [w, 0.04, d], m: "water", step: step + 1 });
  out.push({ p: [cx, y, cz - d / 2 - c / 2], s: [w + 2 * c, 0.12, c], m: "coping", step });
  out.push({ p: [cx, y, cz + d / 2 + c / 2], s: [w + 2 * c, 0.12, c], m: "coping", step });
  out.push({ p: [cx - w / 2 - c / 2, y, cz], s: [c, 0.12, d], m: "coping", step });
  out.push({ p: [cx + w / 2 + c / 2, y, cz], s: [c, 0.12, d], m: "coping", step });
}

function loungers(out: Box[], { x0, z, n, step }: { x0: number; z: number; n: number; step: number }) {
  for (let i = 0; i < n; i++) {
    out.push({ p: [x0 + i * 1.6, 0, z], s: [0.75, 0.32, 2.0], m: "fabric", step });
  }
}

/* ------------------------------------------------------------------ */
/* Horizon — two horizontal volumes, upper one cantilevered            */
/* ------------------------------------------------------------------ */
function horizon(): Variant {
  const b: Box[] = [];
  // podium (local stone)
  b.push({ p: [0, -1.4, -1], s: [46, 1.4, 30], m: "stone", step: 0 });
  b.push({ p: [-23.5, -1.4, -1], s: [1, 2.2, 30], m: "stone", step: 0 });
  // interior shell
  b.push({ p: [2, 0, 1.8], s: [26, 0.06, 10.6], m: "oak", step: 1 });
  b.push({ p: [2, 0, 6.9], s: [26, 3.4, 0.3], m: "interiorWall", step: 1 });
  // ground floor solid ends + glass
  b.push({ p: [-11.6, 0, 1.8], s: [0.8, 3.4, 11], m: "plaster", step: 2 });
  b.push({ p: [15.6, 0, 1.8], s: [0.8, 3.4, 11], m: "plaster", step: 2 });
  b.push({ p: [2, 0, -3.6], s: [26.4, 3.4, 0.08], m: "glass", step: 3 });
  for (let x = -11; x <= 15; x += 3.25) b.push({ p: [x, 0, -3.62], s: [0.06, 3.4, 0.12], m: "metal", step: 3 });
  // first slab with deep overhang toward the sea
  b.push({ p: [2.5, 3.4, 0.6], s: [31, 0.42, 15], m: "plaster", step: 4 });
  b.push({ p: [2, 3.15, -1], s: [24, 0.04, 0.4], m: "plaster", step: 4, glow: true });
  // upper floor, cantilevered east
  b.push({ p: [8, 3.82, 3.4], s: [21, 3.1, 9.6], m: "plaster", step: 5, upper: true });
  b.push({ p: [6.5, 4.4, -1.42], s: [15, 2.0, 0.08], m: "glass", step: 6, upper: true });
  b.push({ p: [8.3, 6.92, 3.2], s: [22.2, 0.34, 10.8], m: "plaster", step: 6, upper: true });
  // pergola on the west terrace
  for (const x of [-21, -13.4]) for (const z of [-11, -4]) b.push({ p: [x, 0, z], s: [0.22, 3.0, 0.22], m: "timber", step: 7 });
  b.push({ p: [-17.2, 3.0, -11], s: [8.2, 0.22, 0.22], m: "timber", step: 7 });
  b.push({ p: [-17.2, 3.0, -4], s: [8.2, 0.22, 0.22], m: "timber", step: 7 });
  slats(b, { from: -20.8, to: -13.6, y: 3.22, z: -7.5, depth: 7.6, gap: 0.55, step: 7 });
  // infinity pool facing the horizon
  pool(b, { cx: 1, cz: -11.2, w: 24, d: 5.2, step: 8 });
  loungers(b, { x0: -8, z: -6.8, n: 4, step: 9 });
  // interior furniture (demonstration only)
  b.push({ p: [-3, 0, 2.6], s: [5.2, 0.72, 1.7], m: "fabric", step: 9 });
  b.push({ p: [-3, 0, 0.2], s: [2.4, 0.38, 1.2], m: "oak", step: 9 });
  b.push({ p: [-6.6, 0, 0.9], s: [1.6, 0.72, 3.0], m: "fabric", step: 9 });
  b.push({ p: [6.5, 0, 1.2], s: [3.8, 0.76, 1.3], m: "oak", step: 9 });
  b.push({ p: [11.5, 0, 4.4], s: [4.2, 0.95, 1.3], m: "coping", step: 9 });
  b.push({ p: [-3, 0.02, 1.4], s: [7, 0.02, 4.6], m: "coping", step: 9 });
  // garden walls
  b.push({ p: [23.5, -1.4, -1], s: [1, 2.6, 30], m: "stone", step: 0 });

  return {
    id: "horizon",
    footprint: { halfX: 27, halfZ: 19, cx: 0, cz: -1 },
    boxes: b,
    views: [
      { id: "hero", position: [-44, 13, -50], target: [6, 1.5, -2], fov: 32 },
      { id: "survey", position: [-30, 5.5, -40], target: [4, 2, -2], fov: 40 },
      { id: "aerial", position: [62, 58, 64], target: [0, 0, -4], fov: 30 },
      { id: "facade", position: [-6, 3.2, -46], target: [2, 3.2, 2], fov: 34 },
      { id: "pool", position: [-21, 1.6, -18], target: [6, 1.0, -8], fov: 42 },
      { id: "terrace", position: [-16, 1.7, -6], target: [-36, -2, -70], fov: 46 },
      { id: "living", position: [5, 1.55, 3.6], target: [-10, 1.2, -40], fov: 56 },
      { id: "detail", position: [24, 6.5, -9], target: [15, 5.2, 1], fov: 30 },
      { id: "plan", position: [0, 90, 0.01], target: [0, 0, 0], fov: 30 },
      // landscape-only stations for editorial plates
      { id: "coast", position: [-70, 6, -64], target: [-190, -4, -150], fov: 40 },
      { id: "hills", position: [-20, 26, -70], target: [10, 18, 160], fov: 36 },
      { id: "sea", position: [10, 16, -50], target: [-80, 0, -420], fov: 36 },
    ],
    hotspots: [
      { id: "facade", position: [4, 5.6, -1.6], view: "facade" },
      { id: "pool", position: [1, 0.6, -11.2], view: "pool" },
      { id: "terrace", position: [-17, 1.4, -7.5], view: "terrace" },
      { id: "living", position: [2, 1.6, 1], view: "living" },
      { id: "garden", position: [30, 1, 8], view: "aerial" },
    ],
  };
}

/* ------------------------------------------------------------------ */
/* Patio — single storey around a courtyard pool                       */
/* ------------------------------------------------------------------ */
function patio(): Variant {
  const b: Box[] = [];
  b.push({ p: [0, -1.2, 0], s: [48, 1.2, 40], m: "stone", step: 0 });
  // floors
  b.push({ p: [-15, 0, 3], s: [9.4, 0.06, 26], m: "oak", step: 1 });
  b.push({ p: [15, 0, 3], s: [9.4, 0.06, 26], m: "oak", step: 1 });
  b.push({ p: [0, 0, 13.5], s: [20.6, 0.06, 9.4], m: "oak", step: 1 });
  // solid outer walls
  b.push({ p: [-19.6, 0, 3], s: [0.8, 3.6, 26], m: "plaster", step: 2 });
  b.push({ p: [19.6, 0, 3], s: [0.8, 3.6, 26], m: "plaster", step: 2 });
  b.push({ p: [0, 0, 18.6], s: [40, 3.6, 0.8], m: "plaster", step: 2 });
  b.push({ p: [-15, 0, -10.2], s: [10, 3.6, 0.6], m: "plaster", step: 2 });
  b.push({ p: [15, 0, -10.2], s: [10, 3.6, 0.6], m: "plaster", step: 2 });
  // courtyard glazing
  b.push({ p: [-10.2, 0, 3], s: [0.08, 3.6, 25.6], m: "glass", step: 3 });
  b.push({ p: [10.2, 0, 3], s: [0.08, 3.6, 25.6], m: "glass", step: 3 });
  b.push({ p: [0, 0, 8.8], s: [20.4, 3.6, 0.08], m: "glass", step: 3 });
  b.push({ p: [-15, 0, 15.6], s: [9.4, 3.6, 0.3], m: "interiorWall", step: 3 });
  // roofs
  b.push({ p: [-15, 3.6, 3], s: [12.4, 0.36, 28.4], m: "plaster", step: 4 });
  b.push({ p: [15, 3.6, 3], s: [12.4, 0.36, 28.4], m: "plaster", step: 4 });
  b.push({ p: [0, 3.6, 14], s: [18, 0.36, 11], m: "plaster", step: 4 });
  b.push({ p: [-15, 3.35, 3], s: [0.4, 0.04, 22], m: "plaster", step: 4, glow: true });
  b.push({ p: [15, 3.35, 3], s: [0.4, 0.04, 22], m: "plaster", step: 4, glow: true });
  // timber screens on the courtyard eaves
  slats(b, { from: -7, to: 7, y: 3.2, z: 4, depth: 9, gap: 0.6, step: 5 });
  // long pool pointing to the sea
  pool(b, { cx: 0, cz: -2, w: 5.4, d: 18, step: 6 });
  loungers(b, { x0: -7.8, z: -4, n: 2, step: 7 });
  loungers(b, { x0: 6.2, z: -4, n: 2, step: 7 });

  return {
    id: "patio",
    footprint: { halfX: 28, halfZ: 24, cx: 0, cz: 1 },
    boxes: b,
    views: [
      { id: "hero", position: [-50, 20, -52], target: [4, 0, 2], fov: 32 },
      { id: "survey", position: [-34, 6, -42], target: [2, 1, 0], fov: 40 },
      { id: "aerial", position: [-40, 62, 58], target: [0, 0, 0], fov: 30 },
      { id: "facade", position: [8, 2.6, -44], target: [0, 2.2, 4], fov: 34 },
      { id: "pool", position: [0, 1.7, 15], target: [0, 0.4, -20], fov: 44 },
      { id: "terrace", position: [-6.5, 1.7, -8], target: [-10, -2, -70], fov: 46 },
      { id: "living", position: [-15, 1.6, 12], target: [-12, 1.2, -30], fov: 54 },
      { id: "detail", position: [24, 4.5, -14], target: [17, 3.4, -8], fov: 30 },
      { id: "plan", position: [0, 90, 0.01], target: [0, 0, 0], fov: 30 },
    ],
    hotspots: [
      { id: "facade", position: [15, 4.6, -10.2], view: "facade" },
      { id: "pool", position: [0, 0.6, -2], view: "pool" },
      { id: "terrace", position: [-6, 1.2, -9], view: "terrace" },
      { id: "living", position: [-15, 1.6, 6], view: "living" },
      { id: "garden", position: [-30, 1, 10], view: "aerial" },
    ],
  };
}

/* ------------------------------------------------------------------ */
/* Terraces — three volumes stepping back up the slope                 */
/* ------------------------------------------------------------------ */
function terraces(): Variant {
  const b: Box[] = [];
  b.push({ p: [0, -1.3, 0], s: [44, 1.3, 36], m: "stone", step: 0 });
  b.push({ p: [4, 0, 9], s: [34, 3.4, 16], m: "stone", step: 0 });
  // level 0
  b.push({ p: [-2, 0, -1.5], s: [30, 0.06, 9], m: "oak", step: 1 });
  b.push({ p: [-2, 0, 0.9], s: [30, 3.4, 0.3], m: "interiorWall", step: 1 });
  b.push({ p: [-17.4, 0, -1.5], s: [0.8, 3.4, 9.4], m: "plaster", step: 2 });
  b.push({ p: [13.4, 0, -1.5], s: [0.8, 3.4, 9.4], m: "plaster", step: 2 });
  b.push({ p: [-2, 0, -6.1], s: [30.4, 3.4, 0.08], m: "glass", step: 3 });
  b.push({ p: [-2, 3.4, -1.2], s: [32, 0.4, 11.2], m: "plaster", step: 4 });
  b.push({ p: [-2, 3.15, -3.4], s: [26, 0.04, 0.4], m: "plaster", step: 4, glow: true });
  // level 1
  b.push({ p: [4, 3.4, 9], s: [26, 3.2, 9], m: "plaster", step: 5, upper: true });
  b.push({ p: [3, 3.8, 4.46], s: [18, 2.2, 0.08], m: "glass", step: 5, upper: true });
  b.push({ p: [4, 6.6, 9], s: [27, 0.36, 10], m: "plaster", step: 6, upper: true });
  // level 2
  b.push({ p: [9, 6.96, 13], s: [14, 3.0, 6.4], m: "plaster", step: 7, upper: true });
  b.push({ p: [9, 7.3, 9.76], s: [10, 2.0, 0.08], m: "glass", step: 7, upper: true });
  b.push({ p: [9, 9.96, 12.8], s: [15, 0.34, 7.4], m: "plaster", step: 8, upper: true });
  // roof terrace pergola
  slats(b, { from: -8, to: 1, y: 6.98 + 2.4, z: 7, depth: 6, gap: 0.55, step: 8 });
  for (const x of [-8.2, 1.2]) b.push({ p: [x, 6.96, 4.6], s: [0.2, 2.4, 0.2], m: "timber", step: 8, upper: true });
  pool(b, { cx: -2, cz: -12.5, w: 28, d: 4.4, step: 9 });
  loungers(b, { x0: 8, z: -8.4, n: 3, step: 10 });

  return {
    id: "terraces",
    footprint: { halfX: 26, halfZ: 22, cx: 0, cz: 1 },
    boxes: b,
    views: [
      { id: "hero", position: [-42, 12, -50], target: [6, 4, 2], fov: 33 },
      { id: "survey", position: [-30, 5, -40], target: [4, 3.5, 2], fov: 40 },
      { id: "aerial", position: [58, 56, 58], target: [0, 2, 0], fov: 30 },
      { id: "facade", position: [-12, 4, -46], target: [0, 4.4, 4], fov: 36 },
      { id: "pool", position: [16, 1.6, -15], target: [-14, 0.6, -10], fov: 42 },
      { id: "terrace", position: [-4, 8.6, 6], target: [-20, 0, -70], fov: 46 },
      { id: "living", position: [4, 1.6, -0.4], target: [-14, 1.3, -40], fov: 54 },
      { id: "detail", position: [18, 9, -2], target: [12, 8, 9], fov: 30 },
      { id: "plan", position: [0, 90, 0.01], target: [0, 0, 0], fov: 30 },
    ],
    hotspots: [
      { id: "facade", position: [9, 9, 9.8], view: "facade" },
      { id: "pool", position: [-2, 0.6, -12.5], view: "pool" },
      { id: "terrace", position: [-4, 7.8, 6.4], view: "terrace" },
      { id: "living", position: [-2, 1.6, -2], view: "living" },
      { id: "garden", position: [-28, 1, 6], view: "aerial" },
    ],
  };
}

export const variants: Record<VariantId, () => Variant> = { horizon, patio, terraces };
