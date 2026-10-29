// Draws a ground-level plan (SVG) of a demonstration study from its massing.
// npx esbuild scripts/plan-svg.ts --bundle --platform=node | node - <variant> <out.svg>
import fs from "node:fs";
import { variants, type VariantId } from "../src/three/maquette/variants";

const [variantId, out] = process.argv.slice(2) as [VariantId, string];
const v = variants[variantId]();
const W = 1600;
const H = 1100;
const S = 30; // px per metre
const cx = W / 2;
const cy = H / 2 - 20;
const X = (x: number) => cx + x * S;
const Y = (z: number) => cy + z * S;

const ground = v.boxes.filter((b) => !b.upper && b.p[1] < 3 && b.p[1] > -0.5);
const rect = (b: (typeof v.boxes)[number], attrs: string) =>
  `<rect x="${X(b.p[0] - b.s[0] / 2).toFixed(1)}" y="${Y(b.p[2] - b.s[2] / 2).toFixed(1)}" width="${(b.s[0] * S).toFixed(1)}" height="${(b.s[2] * S).toFixed(1)}" ${attrs}/>`;

const podium = v.boxes.filter((b) => b.m === "stone" && b.p[1] < 0);
const parts: string[] = [];
for (const b of podium) parts.push(rect(b, `fill="#ECE8DF" stroke="#A89170" stroke-width="1"`));
for (const b of ground.filter((b) => b.m === "oak")) parts.push(rect(b, `fill="#F5F3EE"`));
for (const b of ground.filter((b) => b.m === "water")) parts.push(rect(b, `fill="url(#water)" stroke="#161715" stroke-width="1"`));
for (const b of ground.filter((b) => b.m === "coping")) parts.push(rect(b, `fill="none" stroke="#67645E" stroke-width="0.8"`));
for (const b of ground.filter((b) => b.m === "fabric")) parts.push(rect(b, `fill="none" stroke="#96938D" stroke-width="0.8"`));
for (const b of ground.filter((b) => b.m === "timber")) parts.push(rect(b, `fill="#7A6547"`));
for (const b of ground.filter((b) => b.m === "glass"))
  parts.push(rect(b, `fill="#F5F3EE" stroke="#161715" stroke-width="1.2"`));
for (const b of ground.filter((b) => b.m === "plaster" || b.m === "interiorWall")) parts.push(rect(b, `fill="#161715"`));
// roof overhang outline
for (const b of v.boxes.filter((b) => b.m === "plaster" && b.p[1] >= 3 && b.p[1] < 3.6 && b.s[1] < 1))
  parts.push(rect(b, `fill="none" stroke="#161715" stroke-width="0.8" stroke-dasharray="6 6"`));

const bar = [0, 5, 10].map((m) => `<line x1="${120 + m * S}" y1="${H - 90}" x2="${120 + m * S}" y2="${H - 80}" stroke="#161715"/><text x="${120 + m * S}" y="${H - 60}" text-anchor="middle">${m} m</text>`).join("");

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" font-family="Helvetica, Arial, sans-serif" font-size="15" fill="#161715">
<defs><pattern id="water" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="10" height="10" fill="#DCE6E4"/><line x1="0" y1="0" x2="0" y2="10" stroke="#9FB9B6" stroke-width="1"/></pattern></defs>
<rect width="${W}" height="${H}" fill="#F5F3EE"/>
${parts.join("\n")}
<line x1="120" y1="${H - 85}" x2="${120 + 10 * S}" y2="${H - 85}" stroke="#161715"/>${bar}
<text x="${W - 120}" y="${H - 80}" text-anchor="end" font-size="16">Ground level · demonstration study (not a project plan)</text>
<text x="${W - 120}" y="${H - 56}" text-anchor="end" fill="#67645E">Sea side ↑</text>
</svg>`;
fs.mkdirSync(out.split("/").slice(0, -1).join("/"), { recursive: true });
fs.writeFileSync(out, svg);
console.log("plan written", out);
