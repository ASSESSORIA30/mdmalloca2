import * as THREE from "three";
import { Sky } from "three/examples/jsm/objects/Sky.js";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { fbm, mulberry32, periodicFbm } from "./noise";
import { variants, type Box, type CameraView, type Hotspot, type MaterialKey, type VariantId } from "./variants";

export type Atmosphere = "golden" | "day" | "dusk" | "night";

export type MaquetteOptions = {
  variant: VariantId;
  /** 0 = untouched land, 1 = pad levelled and planted */
  developed?: number;
  /** 0 = nothing built, 1 = all modules placed */
  build?: number;
  atmosphere?: Atmosphere;
  quality?: "high" | "medium" | "low";
  seed?: number;
};

const smoothstep = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

/* ---------------------------------------------------------------- */
/* Landscape height field                                            */
/* ---------------------------------------------------------------- */
function makeHeight(seed: number) {
  const coast = (x: number) => -78 + fbm(x * 0.008, 3.1, seed + 9, 4) * 34;
  const land = (x: number, z: number) =>
    7 + fbm(x * 0.011, z * 0.011, seed, 5) * 10 + Math.max(0, z) * 0.06 + fbm(x * 0.07, z * 0.07, seed + 3, 3) * 0.6;
  return {
    coast,
    natural(x: number, z: number) {
      const d = z - coast(x);
      const s = smoothstep(-10, 16, d);
      return -5 + (land(x, z) + 5) * s;
    },
    inland(x: number, z: number) {
      return z - coast(x);
    },
  };
}

/** soft rounded-rectangle mask around the plot footprint */
function footprintMask(x: number, z: number, f: { halfX: number; halfZ: number; cx: number; cz: number }, feather = 10) {
  const dx = Math.max(0, Math.abs(x - f.cx) - f.halfX);
  const dz = Math.max(0, Math.abs(z - f.cz) - f.halfZ);
  const d = Math.hypot(dx, dz);
  return 1 - smoothstep(0, feather, d);
}

/* ---------------------------------------------------------------- */
/* Procedural textures (no external downloads)                       */
/* ---------------------------------------------------------------- */
function noiseTexture(size: number, seed: number, scale: number, contrast: number, base = 0.5) {
  const data = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) {
      const n = periodicFbm(x / size, y / size, Math.max(2, Math.round(scale * 4)), seed, 6);
      const val = Math.round(255 * Math.min(1, Math.max(0, base + n * contrast)));
      const i = (y * size + x) * 4;
      data[i] = data[i + 1] = data[i + 2] = val;
      data[i + 3] = 255;
    }
  const tex = new THREE.DataTexture(data, size, size);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.needsUpdate = true;
  return tex;
}

function rippleNormals(size: number, seed: number, strength: number) {
  const h = new Float32Array(size * size);
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) {
      h[y * size + x] = periodicFbm(x / size, y / size, 6, seed, 4);
    }
  const data = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) {
      const l = h[y * size + ((x - 1 + size) % size)];
      const r = h[y * size + ((x + 1) % size)];
      const d = h[((y - 1 + size) % size) * size + x];
      const u = h[((y + 1) % size) * size + x];
      const n = new THREE.Vector3((l - r) * strength, (d - u) * strength, 1).normalize();
      const i = (y * size + x) * 4;
      data[i] = (n.x * 0.5 + 0.5) * 255;
      data[i + 1] = (n.y * 0.5 + 0.5) * 255;
      data[i + 2] = (n.z * 0.5 + 0.5) * 255;
      data[i + 3] = 255;
    }
  const tex = new THREE.DataTexture(data, size, size);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.needsUpdate = true;
  return tex;
}

/* ---------------------------------------------------------------- */
/* Materials                                                         */
/* ---------------------------------------------------------------- */
function createMaterials(texSize: number) {
  const grain = noiseTexture(texSize, 7, 1.6, 0.16, 0.62);
  const stoneGrain = noiseTexture(texSize, 21, 3.2, 0.5, 0.55);
  const ripples = rippleNormals(texSize, 3, 6);
  stoneGrain.repeat.set(3, 3);
  const mats: Record<MaterialKey, THREE.MeshPhysicalMaterial | THREE.MeshStandardMaterial> = {
    plaster: new THREE.MeshStandardMaterial({ color: "#eeeae2", roughness: 0.92, roughnessMap: grain, bumpMap: grain, bumpScale: 0.6 }),
    stone: new THREE.MeshStandardMaterial({ color: "#c8b48f", roughness: 0.96, map: stoneGrain, bumpMap: stoneGrain, bumpScale: 2.4 }),
    timber: new THREE.MeshStandardMaterial({ color: "#7c6248", roughness: 0.8 }),
    glass: new THREE.MeshPhysicalMaterial({
      color: "#22292b",
      roughness: 0.03,
      metalness: 0,
      reflectivity: 0.6,
      clearcoat: 1,
      clearcoatRoughness: 0.02,
      envMapIntensity: 1.6,
      transparent: true,
      opacity: 0.72,
    }),
    water: new THREE.MeshPhysicalMaterial({
      color: "#4d9ea3",
      roughness: 0.04,
      normalMap: ripples,
      normalScale: new THREE.Vector2(0.18, 0.18),
      clearcoat: 1,
      envMapIntensity: 1.3,
    }),
    coping: new THREE.MeshStandardMaterial({ color: "#e4ddcf", roughness: 0.85 }),
    metal: new THREE.MeshStandardMaterial({ color: "#2b2a27", roughness: 0.45, metalness: 0.6 }),
    oak: new THREE.MeshStandardMaterial({ color: "#b39a78", roughness: 0.7 }),
    interiorWall: new THREE.MeshStandardMaterial({ color: "#e7dfd2", roughness: 0.95, emissive: new THREE.Color("#ffcf97"), emissiveIntensity: 0 }),
    fabric: new THREE.MeshStandardMaterial({ color: "#e9e4da", roughness: 1 }),
  };
  const glow = new THREE.MeshStandardMaterial({ color: "#fff4e2", emissive: new THREE.Color("#ffd29a"), emissiveIntensity: 0 });
  const ground = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1, map: grain, bumpMap: grain, bumpScale: 1.4 });
  grain.repeat.set(1, 1);
  const sea = new THREE.MeshPhysicalMaterial({
    color: "#1c4250",
    roughness: 0.09,
    normalMap: ripples.clone(),
    normalScale: new THREE.Vector2(0.35, 0.35),
    clearcoat: 0.6,
    envMapIntensity: 1.1,
  });
  (sea.normalMap as THREE.Texture).repeat.set(180, 180);
  (sea.normalMap as THREE.Texture).wrapS = (sea.normalMap as THREE.Texture).wrapT = THREE.RepeatWrapping;
  (sea.normalMap as THREE.Texture).needsUpdate = true;
  return { mats, glow, ground, sea, textures: [grain, stoneGrain, ripples, sea.normalMap as THREE.Texture] };
}

/* ---------------------------------------------------------------- */
/* Vegetation geometry                                               */
/* ---------------------------------------------------------------- */
function clump(radius: number, rng: () => number, squash: number) {
  const g = new THREE.IcosahedronGeometry(radius, 2);
  const p = g.attributes.position as THREE.BufferAttribute;
  const off = rng() * 100;
  for (let i = 0; i < p.count; i++) {
    const v = new THREE.Vector3(p.getX(i), p.getY(i), p.getZ(i));
    const n = fbm(v.x * 1.7 + off, v.y * 1.7 + v.z * 1.3, 5, 3);
    v.multiplyScalar(1 + n * 0.55);
    p.setXYZ(i, v.x, v.y * squash, v.z);
  }
  g.computeVertexNormals();
  return g;
}

function oliveGeometry(rng: () => number) {
  const parts: THREE.BufferGeometry[] = [];
  const trunk = new THREE.CylinderGeometry(0.14, 0.32, 1.7, 7);
  trunk.translate(0, 0.85, 0);
  trunk.rotateZ((rng() - 0.5) * 0.25);
  parts.push(trunk.toNonIndexed());
  for (let i = 0; i < 7; i++) {
    const g = clump(0.55 + rng() * 0.45, rng, 0.7);
    g.translate((rng() - 0.5) * 2.2, 1.9 + rng() * 0.9, (rng() - 0.5) * 2.2);
    parts.push(g.toNonIndexed());
  }
  return colourise(parts, ["#5b5145", "#848a6c", "#8f9476", "#7b8163", "#959a7c", "#80866a", "#8a8f72", "#777d60"]);
}

function pineGeometry(rng: () => number) {
  const parts: THREE.BufferGeometry[] = [];
  const trunk = new THREE.CylinderGeometry(0.14, 0.26, 6.4, 6);
  trunk.translate(0.3, 3.2, 0);
  trunk.rotateZ(-0.06);
  parts.push(trunk.toNonIndexed());
  for (let i = 0; i < 6; i++) {
    const g = clump(1.1 + rng() * 0.5, rng, 0.42);
    g.translate((rng() - 0.5) * 3.4, 6.3 + rng() * 0.7, (rng() - 0.5) * 3.4);
    parts.push(g.toNonIndexed());
  }
  return colourise(parts, ["#5a4a3a", "#4f5c3f", "#586642", "#4b573a", "#5a6844", "#526040", "#56633f"]);
}

function shrubGeometry() {
  const g = clump(0.7, mulberry32(9), 0.6);
  g.translate(0, 0.3, 0);
  return colourise([g.toNonIndexed()], ["#8a8a66"]);
}

function colourise(parts: THREE.BufferGeometry[], colours: string[]) {
  parts.forEach((g, i) => {
    const c = new THREE.Color(colours[Math.min(i, colours.length - 1)]);
    const n = g.attributes.position.count;
    const arr = new Float32Array(n * 3);
    for (let k = 0; k < n; k++) {
      arr[k * 3] = c.r;
      arr[k * 3 + 1] = c.g;
      arr[k * 3 + 2] = c.b;
    }
    g.setAttribute("color", new THREE.BufferAttribute(arr, 3));
    g.deleteAttribute("uv");
  });
  return mergeGeometries(parts)!;
}

/* ---------------------------------------------------------------- */
/* Atmosphere presets                                                */
/* ---------------------------------------------------------------- */
const ATMOSPHERES: Record<
  Atmosphere,
  { elevation: number; azimuth: number; turbidity: number; rayleigh: number; mie: number; sun: number; sunColour: string; hemi: number; exposure: number; interior: number; clouds: number }
> = {
  golden: { elevation: 8, azimuth: -62, turbidity: 7, rayleigh: 1.4, mie: 0.006, sun: 3.2, sunColour: "#ffd2a0", hemi: 0.35, exposure: 0.52, interior: 0.25, clouds: 0.25 },
  day: { elevation: 40, azimuth: -45, turbidity: 3.5, rayleigh: 0.9, mie: 0.004, sun: 3.6, sunColour: "#fff4e6", hemi: 0.5, exposure: 0.36, interior: 0, clouds: 0.3 },
  dusk: { elevation: 1.5, azimuth: -75, turbidity: 9, rayleigh: 2.6, mie: 0.009, sun: 1.1, sunColour: "#ffb27a", hemi: 0.25, exposure: 0.62, interior: 1, clouds: 0.2 },
  night: { elevation: -5, azimuth: -100, turbidity: 2, rayleigh: 0.6, mie: 0.002, sun: 0.0, sunColour: "#9fb4ff", hemi: 0.12, exposure: 0.9, interior: 1.6, clouds: 0 },
};

/* ---------------------------------------------------------------- */
/* Public builder                                                    */
/* ---------------------------------------------------------------- */
export function createMaquette(renderer: THREE.WebGLRenderer, scene: THREE.Scene, opts: MaquetteOptions) {
  const quality = opts.quality ?? "high";
  const seed = opts.seed ?? 4;
  const rng = mulberry32(seed * 977);
  const variant = variants[opts.variant]();
  const height = makeHeight(seed);
  const padY = Math.round(height.natural(variant.footprint.cx, variant.footprint.cz) * 2) / 2 + 0.4;

  const root = new THREE.Group();
  root.name = "demonstration-maquette";
  scene.add(root);

  const { mats, glow, ground, sea, textures } = createMaterials(quality === "low" ? 128 : 256);

  /* terrain */
  const size = quality === "low" ? 900 : 1100;
  const segs = quality === "high" ? 300 : quality === "medium" ? 200 : 120;
  const terrainGeo = new THREE.PlaneGeometry(size, size, segs, segs);
  terrainGeo.rotateX(-Math.PI / 2);
  const pos = terrainGeo.attributes.position as THREE.BufferAttribute;
  const natural = new Float32Array(pos.count);
  const mask = new Float32Array(pos.count);
  const colours = new Float32Array(pos.count * 3);
  const garden = new Float32Array(pos.count);
  const cSand = new THREE.Color("#c6b391");
  const cGrass = new THREE.Color("#a59a6c");
  const cSoil = new THREE.Color("#8f7e5b");
  const cRock = new THREE.Color("#9d9384");
  const cLawn = new THREE.Color("#7d8752");
  const cGravel = new THREE.Color("#d9cdb5");
  const tmp = new THREE.Color();
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const z = pos.getZ(i);
    natural[i] = height.natural(x, z);
    mask[i] = footprintMask(x, z, variant.footprint, 9);
    garden[i] = footprintMask(x, z, variant.footprint, 26) - mask[i];
    const inland = height.inland(x, z);
    const n = fbm(x * 0.05, z * 0.05, seed + 31, 3);
    tmp.copy(cGrass).lerp(cSoil, smoothstep(-0.2, 0.4, n));
    tmp.lerp(cSand, 1 - smoothstep(2, 14, inland));
    tmp.lerp(cRock, smoothstep(0.25, 0.6, fbm(x * 0.02, z * 0.02, seed + 77, 3)) * 0.6);
    colours[i * 3] = tmp.r;
    colours[i * 3 + 1] = tmp.g;
    colours[i * 3 + 2] = tmp.b;
  }
  const baseColours = colours.slice();
  terrainGeo.setAttribute("color", new THREE.BufferAttribute(colours, 3));
  const uv = terrainGeo.attributes.uv as THREE.BufferAttribute;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * 60, uv.getY(i) * 60);
  const terrain = new THREE.Mesh(terrainGeo, ground);
  terrain.receiveShadow = true;
  terrain.castShadow = quality === "high";
  root.add(terrain);

  /* sea */
  const seaMesh = new THREE.Mesh(new THREE.PlaneGeometry(9000, 9000), sea);
  seaMesh.rotation.x = -Math.PI / 2;
  seaMesh.position.y = 0;
  seaMesh.receiveShadow = true;
  root.add(seaMesh);

  /* vegetation */
  const dummy = new THREE.Object3D();
  type Plant = { x: number; z: number; s: number; r: number; inPlot: number };
  // camera stations near the ground stay clear of trees
  const clearings = variant.views.filter((v) => v.position[1] < 30).map((v) => [v.position[0], v.position[2]]);
  const scatter = (count: number, accept: (x: number, z: number, inland: number) => boolean, radius: number) => {
    const out: Plant[] = [];
    let guard = 0;
    while (out.length < count && guard++ < count * 40) {
      const x = (rng() - 0.5) * radius * 2;
      const z = (rng() - 0.5) * radius * 2 + 30;
      const inland = height.inland(x, z);
      if (!accept(x, z, inland)) continue;
      if (clearings.some((c) => Math.hypot(x - c[0], z - c[1]) < 16)) continue;
      out.push({ x, z, s: 0.75 + rng() * 0.6, r: rng() * Math.PI * 2, inPlot: footprintMask(x, z, variant.footprint, 3) });
    }
    return out;
  };
  const treeScale = quality === "low" ? 0.5 : 1;
  // olive groves sit in loose rows on the old terraces
  const olives = scatter(Math.round(620 * treeScale), (x, z, inl) => inl > 10 && fbm(x * 0.02, z * 0.02, seed + 2) > -0.15, 230);
  const pines = scatter(Math.round(200 * treeScale), (_x, _z, inl) => inl > 4 && inl < 70, 280);
  const shrubs = scatter(Math.round(1100 * treeScale), (_x, _z, inl) => inl > 3, 240);
  // garden planting appears with development
  const gardenTrees = scatter(36, (x, z) => {
    const g = footprintMask(x, z, variant.footprint, 18) - footprintMask(x, z, variant.footprint, 4);
    return g > 0.4;
  }, 60);

  const vegMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.9 });
  const makeInstanced = (geo: THREE.BufferGeometry, list: Plant[]) => {
    const mesh = new THREE.InstancedMesh(geo, vegMat, list.length);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    root.add(mesh);
    return mesh;
  };
  const oliveMesh = makeInstanced(oliveGeometry(mulberry32(seed + 1)), olives);
  const pineMesh = makeInstanced(pineGeometry(mulberry32(seed + 2)), pines);
  const shrubMesh = makeInstanced(shrubGeometry(), shrubs);
  const gardenMesh = makeInstanced(oliveGeometry(mulberry32(seed + 5)), gardenTrees);

  /* dry-stone terrace walls (marjades) */
  const wallSegs: { x: number; z: number; rot: number; inPlot: number }[] = [];
  for (let row = 0; row < 9; row++) {
    const baseZ = 26 + row * 15;
    for (let x = -200; x < 200; x += 3.8) {
      const z = baseZ + fbm(x * 0.01, row, seed + 40) * 18;
      if (height.inland(x, z) < 12) continue;
      if (fbm(x * 0.015, row * 3.3, seed + 41) < -0.25) continue;
      const z2 = baseZ + fbm((x + 3.8) * 0.01, row, seed + 40) * 18;
      wallSegs.push({ x: x + 1.9, z: (z + z2) / 2, rot: -Math.atan2(z2 - z, 3.8), inPlot: footprintMask(x, z, variant.footprint, 3) });
    }
  }
  const wallMesh = new THREE.InstancedMesh(new THREE.BoxGeometry(4, 1.1, 0.7), mats.stone, wallSegs.length);
  wallMesh.castShadow = wallMesh.receiveShadow = true;
  root.add(wallMesh);

  /* villa */
  const villa = new THREE.Group();
  villa.position.set(0, padY, 0);
  root.add(villa);
  type Built = { mesh: THREE.Mesh; box: Box };
  const built: Built[] = [];
  const maxStep = Math.max(...variant.boxes.map((b) => b.step));
  for (const box of variant.boxes) {
    const geo = new THREE.BoxGeometry(...box.s);
    geo.translate(0, box.s[1] / 2, 0);
    const mesh = new THREE.Mesh(geo, box.glow ? glow : mats[box.m]);
    mesh.position.set(...box.p);
    mesh.castShadow = box.m !== "glass" && box.m !== "water";
    mesh.receiveShadow = true;
    mesh.userData.upper = !!box.upper;
    villa.add(mesh);
    built.push({ mesh, box });
  }

  /* lighting */
  const sun = new THREE.DirectionalLight("#ffffff", 3);
  sun.castShadow = true;
  const shadowSize = quality === "high" ? 4096 : quality === "medium" ? 2048 : 1024;
  sun.shadow.mapSize.set(shadowSize, shadowSize);
  sun.shadow.camera.left = -90;
  sun.shadow.camera.right = 90;
  sun.shadow.camera.top = 90;
  sun.shadow.camera.bottom = -90;
  sun.shadow.camera.near = 1;
  sun.shadow.camera.far = 600;
  sun.shadow.bias = -0.0004;
  sun.shadow.normalBias = 0.04;
  sun.shadow.radius = 4;
  sun.target.position.set(0, padY, 0);
  root.add(sun, sun.target);
  const hemi = new THREE.HemisphereLight("#cfe0f0", "#8a7a5c", 0.4);
  root.add(hemi);
  const interiorLights: THREE.PointLight[] = [];
  for (const b of built.filter((x) => x.box.glow)) {
    const l = new THREE.PointLight("#ffc98a", 0, 18, 1.6);
    l.position.copy(b.mesh.position).add(new THREE.Vector3(0, -1.0, 0));
    villa.add(l);
    interiorLights.push(l);
  }
  const poolLights = built
    .filter((b) => b.box.m === "water")
    .map((b) => {
      const l = new THREE.PointLight("#7fe6ff", 0, 14, 1.4);
      l.position.copy(b.mesh.position).add(new THREE.Vector3(0, 0.3, 0));
      villa.add(l);
      return l;
    });

  /* sky + image based lighting from the same sky */
  const sky = new Sky();
  sky.scale.setScalar(20000);
  scene.add(sky);
  const pmrem = new THREE.PMREMGenerator(renderer);
  const skyScene = new THREE.Scene();
  const skyForEnv = new Sky();
  skyForEnv.scale.setScalar(20000);
  skyScene.add(skyForEnv);
  let envRT: THREE.WebGLRenderTarget | null = null;
  scene.fog = new THREE.Fog("#c9c3b5", 260, 2400);

  const sunDir = new THREE.Vector3();
  function setAtmosphere(mode: Atmosphere) {
    const a = ATMOSPHERES[mode];
    const phi = THREE.MathUtils.degToRad(90 - a.elevation);
    const theta = THREE.MathUtils.degToRad(a.azimuth);
    sunDir.setFromSphericalCoords(1, phi, theta);
    for (const s of [sky, skyForEnv]) {
      const u = s.material.uniforms;
      u.turbidity.value = a.turbidity;
      u.rayleigh.value = a.rayleigh;
      u.mieCoefficient.value = a.mie;
      u.mieDirectionalG.value = 0.86;
      u.sunPosition.value.copy(sunDir);
      if (u.cloudCoverage) u.cloudCoverage.value = a.clouds;
      if (u.showSunDisc) u.showSunDisc.value = s === skyForEnv ? 0 : 1;
    }
    sun.position.copy(sunDir).multiplyScalar(300).add(new THREE.Vector3(0, padY, 0));
    sun.intensity = a.sun;
    sun.color.set(a.sunColour);
    sun.visible = a.sun > 0;
    hemi.intensity = a.hemi;
    renderer.toneMappingExposure = a.exposure;
    glow.emissiveIntensity = a.interior * 4;
    (mats.interiorWall as THREE.MeshStandardMaterial).emissiveIntensity = a.interior * 0.35;
    interiorLights.forEach((l) => (l.intensity = a.interior * 40));
    poolLights.forEach((l) => (l.intensity = mode === "night" || mode === "dusk" ? a.interior * 30 : 0));
    if (scene.fog) (scene.fog as THREE.Fog).color.set(mode === "night" ? "#1a2230" : mode === "dusk" ? "#b9a294" : mode === "golden" ? "#d6c3a6" : "#d8d4c8");
    if (mode === "night") {
      // a moonlit sky is not modelled by Preetham: darken it explicitly
      sky.visible = false;
      scene.background = new THREE.Color("#0c121c");
    } else {
      sky.visible = true;
      scene.background = null;
    }
    envRT?.dispose();
    envRT = pmrem.fromScene(skyScene as unknown as THREE.Scene, 0, 1, 30000);
    scene.environment = envRT.texture;
    scene.environmentIntensity = mode === "night" ? 0.08 : 1;
  }

  /* development + assembly state */
  function setDeveloped(k: number) {
    developedNow = k;
    for (let i = 0; i < pos.count; i++) {
      const m = mask[i] * k;
      pos.setY(i, natural[i] + (padY - 0.02 - natural[i]) * m);
      const g = garden[i] * k;
      const r = baseColours[i * 3];
      const gg = baseColours[i * 3 + 1];
      const b = baseColours[i * 3 + 2];
      const target = mask[i] > 0.5 ? cGravel : cLawn;
      const w = Math.min(1, g * 1.1 + m);
      colours[i * 3] = r + (target.r - r) * w;
      colours[i * 3 + 1] = gg + (target.g - gg) * w;
      colours[i * 3 + 2] = b + (target.b - b) * w;
    }
    pos.needsUpdate = true;
    (terrainGeo.attributes.color as THREE.BufferAttribute).needsUpdate = true;
    terrainGeo.computeVertexNormals();
    const place = (mesh: THREE.InstancedMesh, list: Plant[], factor: (p: Plant) => number) => {
      list.forEach((p, i) => {
        const f = factor(p);
        dummy.position.set(p.x, heightAt(p.x, p.z) - 0.2, p.z);
        dummy.rotation.set(0, p.r, 0);
        dummy.scale.setScalar(Math.max(0.0001, p.s * f));
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);
      });
      mesh.instanceMatrix.needsUpdate = true;
    };
    const keep = (p: Plant) => 1 - smoothstep(0.05, 0.5, p.inPlot) * k;
    place(oliveMesh, olives, keep);
    place(pineMesh, pines, keep);
    place(shrubMesh, shrubs, keep);
    place(gardenMesh, gardenTrees, () => smoothstep(0.6, 1, k) * 0.8);
    wallSegs.forEach((w, i) => {
      const f = 1 - smoothstep(0.05, 0.5, w.inPlot) * k;
      dummy.position.set(w.x, heightAt(w.x, w.z) + 0.2, w.z);
      dummy.rotation.set(0, w.rot, 0);
      dummy.scale.set(1, Math.max(0.0001, f), 1);
      dummy.updateMatrix();
      wallMesh.setMatrixAt(i, dummy.matrix);
    });
    wallMesh.instanceMatrix.needsUpdate = true;
  }
  let developedNow = 0;
  function heightAt(x: number, z: number) {
    const nat = height.natural(x, z);
    const m = footprintMask(x, z, variant.footprint, 9) * developedNow;
    return nat + (padY - 0.02 - nat) * m;
  }

  /**
   * Modules arrive in order, lowered into place like a crane set,
   * which is how industrialised construction actually assembles.
   */
  function setBuild(t: number) {
    const span = 1 / (maxStep + 1);
    for (const b of built) {
      const start = b.box.step * span;
      const local = Math.min(1, Math.max(0, (t - start) / (span * 1.6)));
      const e = easeOutCubic(local);
      b.mesh.visible = local > 0;
      if (b.box.m === "water") {
        b.mesh.scale.set(1, Math.max(0.001, e), 1);
        b.mesh.position.y = b.box.p[1];
      } else {
        b.mesh.position.y = b.box.p[1] + (1 - e) * 9;
        b.mesh.scale.set(1, 1, 1);
      }
    }
  }

  function setUpperFloorVisible(v: boolean) {
    built.forEach((b) => {
      if (b.box.upper) b.mesh.visible = v;
    });
  }

  const offset = (p: [number, number, number]): [number, number, number] => [p[0], p[1] + padY, p[2]];
  const views: CameraView[] = variant.views.map((v) => ({ ...v, position: offset(v.position), target: offset(v.target) }));
  const hotspots: Hotspot[] = variant.hotspots.map((h) => ({ ...h, position: offset(h.position) }));

  setDeveloped(opts.developed ?? 1);
  setBuild(opts.build ?? 1);
  setAtmosphere(opts.atmosphere ?? "golden");

  function animateWater(time: number) {
    const n = sea.normalMap as THREE.Texture;
    n.offset.set(time * 0.004, time * 0.0025);
    const w = mats.water.normalMap;
    if (w) w.offset.set(time * 0.02, time * 0.013);
  }

  function dispose() {
    scene.remove(root, sky);
    root.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.geometry) m.geometry.dispose();
    });
    Object.values(mats).forEach((m) => m.dispose());
    [glow, ground, sea, vegMat].forEach((m) => m.dispose());
    textures.forEach((t) => t.dispose());
    sky.material.dispose();
    skyForEnv.material.dispose();
    envRT?.dispose();
    pmrem.dispose();
  }

  return {
    root,
    villa,
    padY,
    views,
    hotspots,
    setAtmosphere,
    setDeveloped,
    setBuild,
    setUpperFloorVisible,
    animateWater,
    dispose,
  };
}

export type Maquette = ReturnType<typeof createMaquette>;
