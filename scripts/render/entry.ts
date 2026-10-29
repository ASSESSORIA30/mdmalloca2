// Browser entry for the offline render pipeline (bundled with esbuild).
import * as THREE from "three";
import { createMaquette, type Atmosphere, type Maquette } from "../../src/three/maquette/build";
import type { VariantId } from "../../src/three/maquette/variants";

const canvas = document.createElement("canvas");
document.body.appendChild(canvas);
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.setPixelRatio(1);

let scene: THREE.Scene;
let maquette: Maquette | null = null;
let current = "";
const camera = new THREE.PerspectiveCamera(35, 16 / 9, 0.3, 30000);

function ensure(variant: VariantId, quality: "high" | "medium") {
  const key = variant + quality;
  if (key === current && maquette) return maquette;
  maquette?.dispose();
  scene = new THREE.Scene();
  maquette = createMaquette(renderer, scene, { variant, quality });
  current = key;
  return maquette;
}

type Job = {
  variant: VariantId;
  view: string;
  atmosphere: Atmosphere;
  developed?: number;
  build?: number;
  width: number;
  height: number;
  quality?: "high" | "medium";
  /** optional camera override: interpolate between two views */
  from?: string;
  t?: number;
  dolly?: number;
  time?: number;
};

function setCamera(m: Maquette, job: Job) {
  const v = m.views.find((x) => x.id === job.view)!;
  const p = new THREE.Vector3(...v.position);
  const tg = new THREE.Vector3(...v.target);
  if (job.from) {
    const f = m.views.find((x) => x.id === job.from)!;
    const k = job.t ?? 0;
    p.lerpVectors(new THREE.Vector3(...f.position), p, k);
    tg.lerpVectors(new THREE.Vector3(...f.target), tg, k);
    camera.fov = (f.fov ?? 35) + ((v.fov ?? 35) - (f.fov ?? 35)) * k;
  } else camera.fov = v.fov ?? 35;
  if (job.dolly) {
    const dir = tg.clone().sub(p).normalize();
    p.addScaledVector(dir, job.dolly);
  }
  camera.position.copy(p);
  camera.lookAt(tg);
  camera.aspect = job.width / job.height;
  camera.updateProjectionMatrix();
}

(window as unknown as Record<string, unknown>).renderPlate = (job: Job) => {
  const m = ensure(job.variant, job.quality ?? "high");
  renderer.setSize(job.width, job.height, false);
  m.setDeveloped(job.developed ?? 1);
  m.setBuild(job.build ?? 1);
  m.setAtmosphere(job.atmosphere);
  m.animateWater(job.time ?? 0);
  setCamera(m, job);
  renderer.render(scene, camera);
  return canvas.toDataURL("image/jpeg", 0.93);
};

// Equirectangular panorama from a cube capture, for the 360° tour demo.
(window as unknown as Record<string, unknown>).renderPanorama = (job: { variant: VariantId; at: [number, number, number]; atmosphere: Atmosphere; width: number; yaw?: number }) => {
  const m = ensure(job.variant, "high");
  m.setDeveloped(1);
  m.setBuild(1);
  m.setAtmosphere(job.atmosphere);
  const rt = new THREE.WebGLCubeRenderTarget(2048, { type: THREE.HalfFloatType });
  const cube = new THREE.CubeCamera(0.05, 30000, rt);
  cube.position.set(job.at[0], job.at[1] + m.padY, job.at[2]);
  scene.add(cube);
  cube.update(renderer, scene);
  const mat = new THREE.ShaderMaterial({
    uniforms: { map: { value: rt.texture }, yaw: { value: job.yaw ?? 0 } },
    vertexShader: "varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }",
    fragmentShader: `
      #include <common>
      uniform samplerCube map; uniform float yaw; varying vec2 vUv;
      void main(){
        float lon = (vUv.x - 0.5) * 2.0 * PI + yaw;
        float lat = (vUv.y - 0.5) * PI;
        vec3 dir = vec3(sin(lon) * cos(lat), sin(lat), -cos(lon) * cos(lat));
        gl_FragColor = textureCube(map, vec3(-dir.x, dir.y, dir.z));
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
    depthTest: false,
  });
  const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat);
  const qs = new THREE.Scene();
  qs.add(quad);
  renderer.setSize(job.width, job.width / 2, false);
  renderer.render(qs, new THREE.Camera());
  const url = canvas.toDataURL("image/jpeg", 0.92);
  scene.remove(cube);
  rt.dispose();
  mat.dispose();
  return url;
};
(window as unknown as Record<string, unknown>).ready = true;
