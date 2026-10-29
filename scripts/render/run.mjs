// Usage: node scripts/render/run.mjs <bundleDir> <jobs.json> <outDir>
// Renders plates / panoramas / frame sequences of the demonstration maquette.
import { createRequire } from "node:module";
const { chromium } = createRequire(import.meta.url)(process.env.PLAYWRIGHT_PATH || "playwright");
import fs from "node:fs";
import path from "node:path";

const [bundleDir, jobsFile, outDir] = process.argv.slice(2);
const jobs = JSON.parse(fs.readFileSync(jobsFile, "utf8"));
fs.mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch({ args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
const page = await browser.newPage();
page.on("console", (m) => m.type() === "error" && console.error("[page]", m.text()));
page.on("pageerror", (e) => console.error("[pageerror]", e.message));
await page.goto("file://" + path.resolve(bundleDir, "index.html"));
await page.waitForFunction(() => window.ready === true, null, { timeout: 120000 });

for (const job of jobs) {
  const file = path.join(outDir, job.out);
  if (fs.existsSync(file) && !job.force) continue;
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const t0 = Date.now();
  const url = await page.evaluate((j) => (j.panorama ? window.renderPanorama(j) : window.renderPlate(j)), job);
  fs.writeFileSync(file, Buffer.from(url.split(",")[1], "base64"));
  console.log(job.out, ((Date.now() - t0) / 1000).toFixed(1) + "s");
}
await browser.close();
