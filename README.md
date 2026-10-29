# ModularDom — Mallorca Private Residences

A private digital presentation for a small collection of residences in Mallorca:
a cinematic home page, a collection index, and a **Private Showroom** for each
residence (film, before/after, architecture, gallery, interactive 3D model, 360°
tour, plans, location and a private enquiry), in English, Spanish and Catalan.

Built with Next.js 16 (App Router, Cache Components), TypeScript, Tailwind CSS 4,
GSAP, React Three Fiber / drei, Photo Sphere Viewer, MapLibre GL, zod and
Supabase-ready APIs. See `DESIGN.md` for the visual system.

> **Everything visual is demonstration content until you supply the project files.**
> The plates, films, panoramas, plan and 3D volumes are generated from an abstract
> study maquette (`src/three/maquette`). They are labelled *Demonstration* on the
> site and flagged `demo: true` in content. Figures are flagged as indicative, and
> prices show *Price on request* until confirmed.

---

## 1. Run locally

Requirements: Node.js ≥ 20.9.

```bash
npm install          # also copies the MapLibre worker to public/vendor
cp .env.example .env.local
npm run dev          # http://localhost:3000 → redirects to /en (or the browser language)
```

Other scripts: `npm run build`, `npm start`, `npm run typecheck`, `npm run lint`.

Routes:

| Route | Page |
| --- | --- |
| `/{en,es,ca}` | Home: film hero, collection, before/after, showroom, island, private CTA |
| `/{locale}/residences` | The collection |
| `/{locale}/residences/[slug]` | The Private Showroom of one residence |
| `/{locale}/experience` | The Mallorca Experience (editorial) |
| `/{locale}/contact` | Private enquiry (`?intent=dossier&property=<slug>` preselects) |
| `/{locale}/legal/{privacy,legal-notice,cookies}` | Legal templates |
| `/admin` | Private overview (Basic auth) |
| `/api/enquiry` | Enquiry endpoint |

The default language is English. Change it with `NEXT_PUBLIC_DEFAULT_LOCALE`.

## 2. Add or edit a residence

Each residence is one JSON file in `content/properties/<slug>.json`. It is
validated at build time against `src/content/schema.ts` (zod). The `/admin`
page lists any invalid file and any missing media.

1. Copy an existing file, rename it to the new slug (lowercase, hyphens), and set `"slug"` to match.
2. Fill in the text in `en` (required), `es` and `ca` (optional; they fall back to English).
3. Set `"demo": false` on the record and on every real media item.
4. Specifications: use `null` for anything unknown (it shows *To be confirmed*), and set
   `"illustrative": false` only when the figures are confirmed.
5. Price: keep `"mode": "on-request"`, or use `"mode": "amount"` with `"confirmed": true`.
   An amount is never shown unless it is confirmed.
6. Status: `available | reserved | sold | coming-soon | in-preparation`. It is shown only
   with `"confirmed": true`.
7. Location: `"precision": "approximate"` shows a shaded area (with `radiusMeters`) and
   never a pin. Use `"exact"` only when the position may be public.
8. Architecture sections are published only with `"verified": true` once demo mode is off.

The order of the collection follows `"order"`. Set `"published": false` to hide a residence.

**Without touching files:** set `CONTENT_SOURCE=supabase` and store each residence
as a row in `public.properties` (`slug`, `published`, `document` = the same JSON).
Editors can then work in Supabase Studio. The schema and the site do not change.

## 3. Upload renders, photos and plans

Put files in `public/projects/<slug>/` (see `public/projects/README.md`):

```
terrain/   photos of the plot     renders/  architectural renders
videos/    films and posters      models/   GLB or HTML viewer
panoramas/ equirectangular 360°   plans/    SVG or PNG plans
```

Then reference them in the residence JSON, for example:

```json
"hero": { "src": "/projects/residence-horizon/renders/arrival.jpg", "width": 3840, "height": 2160,
          "alt": { "en": "Arrival court at dusk" }, "demo": false, "focal": "45% 60%" }
```

- Keep originals large (≥ 2400 px wide). `next/image` serves AVIF/WebP at the right size.
- `focal` is the CSS `object-position` that keeps the important part in frame on narrow
  screens. Plans and the gallery's full-screen view always use `contain`, so renders are
  never cropped.
- **Before/after:** `media.terrain` and `media.render` must be shot from the same camera
  position and lens, so the comparison is credible.
- Gallery categories: `exterior`, `interior`, `architecture`, `lifestyle`, `construction`.

## 4. Add films

`films.hero` (ambient, muted, loops behind the arrival screen) and
`films.transformation` (played with controls) take:

```json
{ "mp4": "/projects/<slug>/videos/transformation.mp4",
  "webm": "/projects/<slug>/videos/transformation.webm",
  "mobileMp4": "/projects/<slug>/videos/transformation-720.mp4",
  "poster": "/projects/<slug>/videos/transformation-poster.jpg",
  "durationSeconds": 42, "demo": false }
```

Recommended encodes (ffmpeg):

```bash
ffmpeg -i master.mov -c:v libx264 -preset slow -crf 21 -pix_fmt yuv420p -movflags +faststart -an hero.mp4
ffmpeg -i master.mov -c:v libvpx-vp9 -b:v 0 -crf 34 -row-mt 1 -an hero.webm
ffmpeg -i master.mov -vf scale=-2:720 -c:v libx264 -crf 24 -preset slow -movflags +faststart -an hero-720.mp4
ffmpeg -ss 2 -i master.mov -frames:v 1 -q:v 3 hero-poster.jpg
```

Ambient films never autoplay with *reduced motion* or *Save-Data*: the poster is shown
instead. They pause when off screen. Larger films are better hosted on a video CDN
(Mux, Cloudflare Stream or Vercel Blob). Put the absolute URL in `mp4`.

## 5. Integrate 3D models

Set `model3d` in the residence JSON:

- **GLB / glTF (recommended):** `{ "type": "glb", "src": "/projects/<slug>/models/residence.glb", "demo": false }`.
  Export from Revit/ArchiCAD/Rhino → Blender → glTF 2.0 with PBR materials, baked AO,
  textures ≤ 4K (KTX2/WebP) and Draco or Meshopt compression (`npx gltf-transform optimize in.glb out.glb --compress meshopt --texture-compress webp`).
  The viewer adds HDRI image-based lighting (`/public/hdri`, CC0 Poly Haven), soft
  shadows, day/evening light and camera stations derived from the model bounds. Author
  precise stations by extending `GlbScene` in `src/components/viewers/ModelViewer.tsx`.
- **Your existing HTML viewer:** copy it to `public/projects/<slug>/models/viewer/` and use
  `{ "type": "iframe", "src": "/projects/<slug>/models/viewer/index.html" }`.
- **Demonstration maquette:** `{ "type": "maquette", "variant": "horizon" | "patio" | "terraces", "demo": true }`.

The 3D code (Three.js, R3F, drei) is downloaded only when the visitor presses
*Load the 3D model*. It is preloaded on hover or focus, and renders on demand rather
than continuously, to save battery.

Photorealism depends on the source model. A professional model with real materials
and textures is needed for a photorealistic result.

## 6. 360° tours

`tour.scenes[]` takes equirectangular 2:1 panoramas (≥ 6000 × 3000, JPG). Each link
has a `yaw`/`pitch` in radians (yaw 0 = image centre, positive = to the right).
`planPosition` places the room on the orientation plan (`tour.plan`), as fractions
of its width and height. Flat photos must never be used as panoramas.

## 7. Forms, storage and notifications

1. Create a Supabase project and run `supabase/migrations/0001_init.sql`
   (SQL editor, or `supabase db push`). It creates `properties`, `enquiries` and `staff`
   with row level security. The website writes server-side with the service role key,
   which never reaches the browser.
2. Set `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`.
3. Email notification: create a [Resend](https://resend.com) API key, verify your sending
   domain, and set `RESEND_API_KEY`, `SALES_EMAIL` and `EMAIL_FROM`.
4. CRM: set `CRM_WEBHOOK_URL`. Each enquiry is POSTed as JSON (connect HubSpot,
   Pipedrive or Salesforce directly or through Zapier/Make).
5. Anti-spam is built in (honeypot, a minimum fill time, and a rate limit per IP). For
   stronger protection add Cloudflare Turnstile keys (`NEXT_PUBLIC_TURNSTILE_SITE_KEY`,
   `TURNSTILE_SECRET_KEY`). For a global rate limit across instances, replace the
   in-memory limiter in `src/app/api/enquiry/route.ts` with Upstash/Vercel KV.

In development without Supabase, enquiries are written to `.data/enquiries.ndjson`.
In production, an enquiry that can be neither stored nor emailed is rejected
(HTTP 503) rather than silently lost.

## 8. Admin

`/admin` is a separate root layout, protected by Basic auth (`ADMIN_USERNAME`,
`ADMIN_PASSWORD`; disabled when unset). It shows every residence with its status,
price mode, coordinates, demo and missing media, translation gaps, and the latest
enquiries. Editing happens in the content source (JSON via Git, or Supabase Studio
with the `staff` roles `admin`, `editor` and `sales`). For a full editing UI later,
point a headless CMS (Sanity, Payload or Keystatic) at the same schema in
`src/content/schema.ts`.

## 9. Environment variables

See `.env.example`. Only variables prefixed `NEXT_PUBLIC_` reach the browser; all
keys and secrets stay server-side.

## 10. Deploy to Vercel

1. Push the repository to GitHub and import it in Vercel (framework: Next.js; defaults are fine).
2. Add the environment variables from `.env.example` in *Project → Settings → Environment Variables*.
3. Set `NEXT_PUBLIC_SITE_URL` to the production domain.
4. When real content is in place, set `NEXT_PUBLIC_DEMO_MODE=false`. This removes the
   demonstration notices, publishes only verified sections, and allows indexing
   (robots.txt and the sitemap).
5. Large media: prefer Vercel Blob, Supabase Storage (`projects` bucket) or a video CDN,
   and reference the absolute URLs (add the host to `images.remotePatterns` in `next.config.ts`).

## SEO, accessibility and performance

- Per-page metadata, Open Graph, `hreflang` alternates (`en`, `es-ES`, `ca-ES`, `x-default`),
  `sitemap.xml`, `robots.txt`, and `SingleFamilyResidence` JSON-LD (no price or exact
  coordinates unless confirmed and public).
- Security headers in `next.config.ts`. The admin is `noindex`.
- Keyboard: skip link, visible focus, a slider with arrows/Home/End, gallery ←/→/Esc,
  plan viewer +/−/0/arrows. Touch: swipe, pinch and drag. `prefers-reduced-motion` respected.
- Heavy modules (3D, 360°, maps) are split and loaded on demand. Images are AVIF/WebP and
  responsive, and the hero poster is the LCP element.
- Cookies: none beyond a session preference, so no consent banner is needed. Add one
  before introducing analytics (see `/legal/cookies`).

## Maps and licences

The location map uses MapLibre GL (open source, no licence fee). Satellite imagery
uses Mapbox when `NEXT_PUBLIC_MAPBOX_TOKEN` is set (recommended for production).
Otherwise it falls back to Esri World Imagery, whose terms require an ArcGIS
licence for commercial use. The vector map uses OpenFreeMap, recoloured to the
palette at runtime. HDRIs are CC0 (Poly Haven via `@pmndrs/assets`).

## Regenerating the demonstration media

```bash
npm run render:demo   # plates + panoramas → public/projects/_demo (needs Playwright + Chromium)
```

Films are rendered frame by frame from `.render/films.json` with the same runner
(`node scripts/render/run.mjs .render .render/films.json .render/frames`), then
encoded with ffmpeg. The plan SVG comes from `scripts/plan-svg.ts`.

## Structure

```
content/properties/*.json   residences (editable data)
content/experience.json     Mallorca Experience modules
src/app/[locale]/…          public routes          src/app/admin  private overview
src/app/api/enquiry         enquiry endpoint        src/proxy.ts   locale redirect + admin auth
src/components/…            chrome, home, residence, media, viewers, forms
src/content/schema.ts       content model (zod)     src/i18n/      en / es / ca dictionaries
src/three/maquette          demonstration maquette (shared by viewer and render pipeline)
supabase/migrations         database schema and RLS
scripts/                    render pipeline, plan generator, vendor copy, demo seed
```
