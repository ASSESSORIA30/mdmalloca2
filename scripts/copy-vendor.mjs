// Copies browser workers that must be served as standalone files (run on postinstall).
import fs from "node:fs";
fs.mkdirSync("public/vendor", { recursive: true });
fs.copyFileSync("node_modules/maplibre-gl/dist/maplibre-gl-worker.mjs", "public/vendor/maplibre-gl-worker.mjs");
console.log("vendor: maplibre worker copied");
