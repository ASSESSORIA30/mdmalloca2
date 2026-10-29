// Writes the three demonstration residences to content/properties/.
// Every record is flagged demo:true; replace with real data (see README).
import fs from "node:fs";

const L = (en, es, ca) => ({ en, es, ca });
const demoAlt = (what) => L(`Demonstration plate: ${what}, study maquette`, `Imagen de demostración: ${what}, maqueta de estudio`, `Imatge de demostració: ${what}, maqueta d'estudi`);
const img = (variant, file, what, extra = {}) => ({
  src: `/projects/_demo/${variant}/${file}`,
  alt: demoAlt(what),
  width: file.includes("portrait") ? 1200 : ["hero.jpg", "terrain.jpg", "render.jpg"].includes(file) ? 2400 : 2000,
  height: file.includes("portrait") ? 1600 : ["hero.jpg", "terrain.jpg", "render.jpg"].includes(file) ? 1350 : 1125,
  demo: true,
  ...extra,
});

const architecture = [
  {
    id: "concept",
    title: L("Concept", "Concepto", "Concepte"),
    body: L(
      "Placeholder for the architectural concept from the project report. Describe how the residence answers its plot: orientation, views, the slope and what was kept.",
      "Texto provisional para el concepto arquitectónico de la memoria del proyecto. Describa cómo responde la residencia a su parcela: orientación, vistas, pendiente y lo que se ha conservado.",
      "Text provisional per al concepte arquitectònic de la memòria del projecte. Descriviu com respon la residència a la parcel·la: orientació, vistes, pendent i què s'ha conservat.",
    ),
    verified: false,
  },
  {
    id: "materials",
    title: L("Materials and finishes", "Materiales y acabados", "Materials i acabats"),
    body: L(
      "Placeholder. List only materials confirmed in the project specification.",
      "Texto provisional. Indique solo materiales confirmados en la especificación del proyecto.",
      "Text provisional. Indiqueu només materials confirmats a l'especificació del projecte.",
    ),
    verified: false,
  },
  {
    id: "indoor-outdoor",
    title: L("Inside and out", "Interior y exterior", "Interior i exterior"),
    body: L(
      "Placeholder for how living spaces open to terraces, pool and garden.",
      "Texto provisional sobre cómo se abren los espacios a terrazas, piscina y jardín.",
      "Text provisional sobre com s'obren els espais a terrasses, piscina i jardí.",
    ),
    verified: false,
  },
  {
    id: "light",
    title: L("Natural light", "Luz natural", "Llum natural"),
    body: L("Placeholder for orientation and daylight studies.", "Texto provisional para orientación y estudios de luz natural.", "Text provisional per a orientació i estudis de llum natural."),
    verified: false,
  },
  {
    id: "construction",
    title: L("Industrialised construction", "Construcción industrializada", "Construcció industrialitzada"),
    body: L(
      "Placeholder. Describe the ModularDom building process for this residence with confirmed facts only: what is made off site, how it is assembled, and timings once verified.",
      "Texto provisional. Describa el proceso constructivo de ModularDom para esta residencia solo con datos confirmados: qué se fabrica fuera de obra, cómo se monta y plazos una vez verificados.",
      "Text provisional. Descriviu el procés constructiu de ModularDom per a aquesta residència només amb dades confirmades: què es fabrica fora d'obra, com es munta i terminis un cop verificats.",
    ),
    verified: false,
  },
  {
    id: "energy",
    title: L("Energy", "Energía", "Energia"),
    body: L(
      "Publish energy ratings or certifications only once documented.",
      "Publique calificaciones energéticas o certificaciones solo cuando estén documentadas.",
      "Publiqueu qualificacions energètiques o certificacions només quan estiguin documentades.",
    ),
    verified: false,
  },
];

const demoFeatures = [
  L("Sea views (to be confirmed on site)", "Vistas al mar (por confirmar in situ)", "Vistes a la mar (per confirmar in situ)"),
  L("Infinity pool (study)", "Piscina desbordante (estudio)", "Piscina desbordant (estudi)"),
  L("Terraces and pergola (study)", "Terrazas y pérgola (estudio)", "Terrasses i pèrgola (estudi)"),
  L("Industrialised construction by ModularDom", "Construcción industrializada de ModularDom", "Construcció industrialitzada de ModularDom"),
];

function residence({ slug, order, name, variant, tagline, zone, lat, lng, gallery, films, tour, plans, specs }) {
  return {
    slug,
    order,
    published: true,
    demo: true,
    name,
    tagline,
    municipality: L("Demonstration plot", "Parcela de demostración", "Parcel·la de demostració"),
    zone,
    summary: L(
      "A demonstration record showing how a residence is presented. Replace the text, figures and media with the project's confirmed information.",
      "Un registro de demostración que muestra cómo se presenta una residencia. Sustituya textos, cifras y archivos por la información confirmada del proyecto.",
      "Un registre de demostració que mostra com es presenta una residència. Substituïu textos, xifres i fitxers per la informació confirmada del projecte.",
    ),
    location: {
      lat,
      lng,
      precision: "approximate",
      radiusMeters: 3500,
      note: L("Illustrative position, not a real plot.", "Posición ilustrativa, no corresponde a una parcela real.", "Posició il·lustrativa, no correspon a cap parcel·la real."),
    },
    specs: { ...specs, illustrative: true },
    price: { mode: "on-request", amount: null, currency: "EUR", confirmed: false },
    status: { value: "in-preparation", confirmed: false },
    features: demoFeatures,
    architecture: architecture.map((a, i) =>
      i === 0 ? { ...a, image: img(variant, "detail.jpg", "architectural detail") } : i === 2 ? { ...a, image: img(variant, "pool.jpg", "pool terrace") } : a,
    ),
    media: {
      hero: img(variant, "hero.jpg", "residence and landscape"),
      heroPortrait: img(variant, "hero-portrait.jpg", "residence and landscape", { focal: "50% 60%" }),
      terrain: img(variant, "terrain.jpg", "the land before construction"),
      render: img(variant, "render.jpg", "the residence from the same viewpoint"),
      gallery,
    },
    films,
    model3d: { type: "maquette", variant, demo: true },
    ...(tour ? { tour } : {}),
    plans,
    seo: {},
  };
}

const g = (variant, file, what, category, extra) => ({ ...img(variant, file, what, extra), category });

// panorama stations (x, z) from scripts/render/jobs.mjs; yaw 0 faces the sea (-z)
const stations = { living: [1, 0.8], terrace: [-17, -7.5], pool: [10, -7.6], garden: [25, -2] };
const link = (from, to) => {
  const [ax, az] = stations[from];
  const [bx, bz] = stations[to];
  const dist = Math.hypot(bx - ax, bz - az);
  return { to, yaw: +Math.atan2(bx - ax, -(bz - az)).toFixed(3), pitch: +(-Math.atan2(1.6, dist)).toFixed(3) };
};
const horizonTour = {
  demo: true,
  plan: "/projects/_demo/horizon/plans/ground-floor.svg",
  scenes: [
    { id: "living", title: L("Living room", "Salón", "Sala d'estar"), panorama: "/projects/_demo/horizon/panoramas/living.jpg", initialYaw: 0, planPosition: [0.47, 0.42], links: [link("living", "terrace"), link("living", "pool")] },
    { id: "terrace", title: L("West terrace", "Terraza oeste", "Terrassa oest"), panorama: "/projects/_demo/horizon/panoramas/terrace.jpg", initialYaw: 0.3, planPosition: [0.14, 0.62], links: [link("terrace", "living"), link("terrace", "pool")] },
    { id: "pool", title: L("Pool deck", "Solárium de la piscina", "Solàrium de la piscina"), panorama: "/projects/_demo/horizon/panoramas/pool.jpg", initialYaw: -0.4, planPosition: [0.62, 0.7], links: [link("pool", "living"), link("pool", "garden"), link("pool", "terrace")] },
    { id: "garden", title: L("East garden", "Jardín este", "Jardí est"), panorama: "/projects/_demo/horizon/panoramas/garden.jpg", initialYaw: -1.2, planPosition: [0.88, 0.5], links: [link("garden", "pool")] },
  ],
};

const film = (name, title, duration) => ({
  mp4: `/projects/_demo/horizon/videos/${name}.mp4`,
  webm: `/projects/_demo/horizon/videos/${name}.webm`,
  mobileMp4: `/projects/_demo/horizon/videos/${name}-720.mp4`,
  poster: `/projects/_demo/horizon/videos/${name}-poster.jpg`,
  durationSeconds: duration,
  demo: true,
  title,
});
const films = {
  hero: film("hero", L("Arrival", "Llegada", "Arribada"), 10),
  transformation: film("transformation", L("From land to residence", "Del terreno a la residencia", "Del terreny a la residència"), 14),
};

const out = [
  residence({
    slug: "residence-horizon",
    order: 1,
    name: "Residence Horizon",
    variant: "horizon",
    tagline: L("Two horizontal volumes open to the evening sea.", "Dos volúmenes horizontales abiertos al mar del atardecer.", "Dos volums horitzontals oberts a la mar del capvespre."),
    zone: L("Southwest coast · demonstration", "Costa suroeste · demostración", "Costa sud-oest · demostració"),
    lat: 39.535,
    lng: 2.43,
    specs: { plotArea: { value: 4200, unit: "m²" }, builtArea: { value: 480, unit: "m²" }, bedrooms: 5, bathrooms: 6 },
    gallery: [
      g("horizon", "hero.jpg", "arrival view", "exterior"),
      g("horizon", "facade.jpg", "sea façade", "exterior"),
      g("horizon", "living.jpg", "living room facing the sea", "interior"),
      g("horizon", "detail.jpg", "cantilever detail", "architecture"),
      g("horizon", "pool.jpg", "pool and pergola", "lifestyle"),
      g("horizon", "pool-dusk.jpg", "pool at dusk", "lifestyle"),
      g("horizon", "facade-night.jpg", "façade in the evening", "exterior"),
      g("horizon", "aerial.jpg", "aerial view", "architecture"),
      g("horizon", "terrace.jpg", "view from the terrace", "lifestyle"),
      g("horizon", "construction.jpg", "modules being placed", "construction"),
    ],
    films,
    tour: horizonTour,
    plans: [{ id: "ground", title: L("Ground level · study", "Planta baja · estudio", "Planta baixa · estudi"), src: "/projects/_demo/horizon/plans/ground-floor.svg", width: 1600, height: 1100, demo: true }],
  }),
  residence({
    slug: "residence-patio",
    order: 2,
    name: "Residence Patio",
    variant: "patio",
    tagline: L("A single storey gathered around a courtyard pool.", "Una sola planta reunida en torno a un patio con piscina.", "Una sola planta reunida al voltant d'un pati amb piscina."),
    zone: L("East coast · demonstration", "Costa este · demostración", "Costa est · demostració"),
    lat: 39.6,
    lng: 3.33,
    specs: { plotArea: { value: 5600, unit: "m²" }, builtArea: { value: 420, unit: "m²" }, bedrooms: 4, bathrooms: 5 },
    gallery: [
      g("patio", "hero.jpg", "courtyard house", "exterior"),
      g("patio", "aerial.jpg", "aerial view", "architecture"),
      g("patio", "pool.jpg", "courtyard pool", "lifestyle"),
      g("patio", "living.jpg", "living wing", "interior"),
      g("patio", "facade.jpg", "south façade", "exterior"),
      g("patio", "detail.jpg", "roof edge", "architecture"),
    ],
    films: { transformation: films.transformation },
    plans: [],
  }),
  residence({
    slug: "residence-terraces",
    order: 3,
    name: "Residence Terraces",
    variant: "terraces",
    tagline: L("Three levels stepping up the slope, each with its own terrace.", "Tres niveles que ascienden por la ladera, cada uno con su terraza.", "Tres nivells que pugen pel pendent, cadascun amb la seva terrassa."),
    zone: L("Northwest, Serra de Tramuntana · demonstration", "Noroeste, Serra de Tramuntana · demostración", "Nord-oest, Serra de Tramuntana · demostració"),
    lat: 39.76,
    lng: 2.66,
    specs: { plotArea: null, builtArea: null, bedrooms: null, bathrooms: null },
    gallery: [
      g("terraces", "hero.jpg", "stepped residence at dusk", "exterior"),
      g("terraces", "pool.jpg", "lower pool", "lifestyle"),
      g("terraces", "facade.jpg", "sea façade at dusk", "exterior"),
      g("terraces", "living.jpg", "living room", "interior"),
      g("terraces", "terrace.jpg", "roof terrace", "lifestyle"),
      g("terraces", "aerial.jpg", "aerial view", "architecture"),
    ],
    films: {},
    plans: [],
  }),
];

for (const p of out) fs.writeFileSync(`content/properties/${p.slug}.json`, JSON.stringify(p, null, 2) + "\n");
console.log("wrote", out.map((p) => p.slug).join(", "));
