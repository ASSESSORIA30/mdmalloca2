// Generates the job lists for the demonstration asset set.
// node scripts/render/jobs.mjs <outDir>  →  plates.json, films.json
import fs from "node:fs";
import path from "node:path";

const out = process.argv[2];
const studies = [
  { variant: "horizon", atmosphere: "golden" },
  { variant: "patio", atmosphere: "golden" },
  { variant: "terraces", atmosphere: "dusk" },
];
const plates = [];
for (const { variant, atmosphere } of studies) {
  const base = { variant, atmosphere, width: 2400, height: 1350 };
  plates.push({ ...base, out: `${variant}/hero.jpg`, view: "hero" });
  plates.push({ ...base, out: `${variant}/terrain.jpg`, view: "survey", developed: 0, build: 0 });
  plates.push({ ...base, out: `${variant}/render.jpg`, view: "survey" });
  for (const view of ["facade", "pool", "terrace", "living", "detail", "aerial"])
    plates.push({ ...base, width: 2000, height: 1125, out: `${variant}/${view}.jpg`, view });
  plates.push({ ...base, width: 1200, height: 1600, out: `${variant}/hero-portrait.jpg`, view: "hero", dolly: -6 });
}
plates.push({ variant: "horizon", atmosphere: "night", width: 2000, height: 1125, out: "horizon/facade-night.jpg", view: "facade" });
plates.push({ variant: "horizon", atmosphere: "dusk", width: 2000, height: 1125, out: "horizon/pool-dusk.jpg", view: "pool" });
for (const [view, atmosphere] of [["coast", "golden"], ["hills", "golden"], ["sea", "dusk"], ["coast", "day"]])
  plates.push({ variant: "horizon", atmosphere, view, developed: 0, build: 0, width: 2400, height: 1350, out: `landscape/${view}-${atmosphere}.jpg` });
// equirectangular panoramas for the 360° tour
for (const [id, at, atmosphere] of [
  ["living", [1, 1.6, 0.8], "golden"],
  ["terrace", [-17, 1.7, -7.5], "golden"],
  ["pool", [10, 1.7, -7.6], "golden"],
  ["garden", [25, 1.7, -2], "golden"],
])
  plates.push({ panorama: true, variant: "horizon", at, atmosphere, width: 4096, out: `horizon/panoramas/${id}.jpg` });

// films
const films = [];
const fps = 24;
const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const clamp = (x) => Math.min(1, Math.max(0, x));
let n = 10 * fps;
for (let i = 0; i < n; i++) {
  const t = i / (n - 1);
  films.push({ variant: "horizon", atmosphere: "golden", view: "hero", dolly: ease(t) * 10, time: i / fps, width: 1600, height: 900, quality: "high", out: `film-hero/f${String(i).padStart(4, "0")}.jpg` });
}
n = 14 * fps;
for (let i = 0; i < n; i++) {
  const t = i / (n - 1);
  films.push({
    variant: "horizon",
    atmosphere: "golden",
    view: "hero",
    from: "survey",
    t: ease(clamp((t - 0.55) / 0.45)),
    developed: ease(clamp((t - 0.12) / 0.2)),
    build: clamp((t - 0.3) / 0.55),
    time: i / fps,
    width: 1600,
    height: 900,
    out: `film-transformation/f${String(i).padStart(4, "0")}.jpg`,
  });
}
fs.mkdirSync(out, { recursive: true });
fs.writeFileSync(path.join(out, "plates.json"), JSON.stringify(plates));
fs.writeFileSync(path.join(out, "films.json"), JSON.stringify(films));
console.log(plates.length, "plates,", films.length, "frames");
