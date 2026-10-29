import { Suspense } from "react";
import { connection } from "next/server";
import fs from "node:fs/promises";
import path from "node:path";
import { loadContent } from "@/lib/properties";
import { getServiceClient } from "@/lib/supabase-server";
import type { Property } from "@/content/schema";

/*
 * Private overview for the sales and content team. Protected by Basic auth in src/proxy.ts
 * (ADMIN_USERNAME / ADMIN_PASSWORD). It reads content and enquiries; editing happens in the
 * content source (JSON files via Git, or the Supabase `properties` table — see README).
 */

export default function Admin() {
  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <h1 className="font-serif text-4xl font-light">ModularDom · Content and enquiries</h1>
      <p className="mt-2 text-sm text-ash">Read-only overview. Content source: {process.env.CONTENT_SOURCE === "supabase" ? "Supabase" : "content/properties/*.json"}</p>
      <Suspense fallback={<p className="mt-10 text-ash">Loading…</p>}>
        <Overview />
      </Suspense>
    </main>
  );
}

async function exists(src: string) {
  if (/^https?:/.test(src)) return true;
  try {
    await fs.access(path.join(process.cwd(), "public", src));
    return true;
  } catch {
    return false;
  }
}

function mediaOf(p: Property) {
  const m = p.media;
  const list = [m.hero, m.heroPortrait, m.terrain, m.render, ...m.gallery].filter(Boolean).map((x) => ({ src: x!.src, demo: x!.demo }));
  for (const f of [p.films.hero, p.films.transformation]) if (f) list.push({ src: f.mp4, demo: f.demo }, { src: f.poster, demo: f.demo });
  for (const s of p.tour?.scenes ?? []) list.push({ src: s.panorama, demo: !!p.tour?.demo });
  for (const pl of p.plans) list.push({ src: pl.src, demo: pl.demo });
  if (p.model3d && p.model3d.type !== "maquette") list.push({ src: p.model3d.src, demo: p.model3d.demo });
  return list;
}

async function Overview() {
  await connection();
  const { items, issues } = await loadContent();
  const rows = await Promise.all(
    items.map(async (p) => {
      const media = mediaOf(p);
      const checks = await Promise.all(media.map(async (m) => ({ ...m, ok: await exists(m.src) })));
      const missingTranslations = [p.tagline, p.summary, p.zone].filter((v) => !v.es || !v.ca).length;
      return { p, total: checks.length, missing: checks.filter((c) => !c.ok), demo: checks.filter((c) => c.demo).length, missingTranslations };
    }),
  );
  const enquiries = await getEnquiries();

  return (
    <>
      {issues.length ? (
        <section className="mt-10 rounded-xl border border-error/40 p-5">
          <h2 className="font-medium text-error">Invalid content files</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {issues.map((i) => (
              <li key={i.file}>
                <code>{i.file}</code>: {i.message}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="mt-12">
        <h2 className="font-serif text-2xl">Residences</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="text-ash">
              <tr className="border-b border-mineral/15">
                {["Residence", "Status", "Price", "Coordinates", "Media", "Demo assets", "Missing files", "Translations"].map((h) => (
                  <th key={h} className="py-2 pr-4 font-normal">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map(({ p, total, missing, demo, missingTranslations }) => (
                <tr key={p.slug} className="border-b border-mineral/10 align-top">
                  <td className="py-3 pr-4">
                    <a className="underline" href={`/en/residences/${p.slug}`}>{p.name}</a>
                    <div className="text-xs text-ash">{p.slug}{p.published ? "" : " · unpublished"}{p.demo ? " · demo record" : ""}</div>
                  </td>
                  <td className="py-3 pr-4">{p.status.value}{p.status.confirmed ? "" : " (unconfirmed)"}</td>
                  <td className="py-3 pr-4">{p.price.mode === "amount" && p.price.confirmed ? `${p.price.amount} €` : "On request"}</td>
                  <td className="num py-3 pr-4">{p.location.lat.toFixed(4)}, {p.location.lng.toFixed(4)}<div className="text-xs text-ash">{p.location.precision}</div></td>
                  <td className="num py-3 pr-4">{total}</td>
                  <td className="num py-3 pr-4">{demo}</td>
                  <td className="py-3 pr-4">
                    {missing.length ? (
                      <ul className="text-xs text-error">{missing.map((m) => <li key={m.src}>{m.src}</li>)}</ul>
                    ) : (
                      <span className="text-ash">None</span>
                    )}
                  </td>
                  <td className="py-3 pr-4">{missingTranslations ? `${missingTranslations} fields incomplete` : "Complete"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-14">
        <h2 className="font-serif text-2xl">Recent enquiries</h2>
        <p className="mt-1 text-sm text-ash">{enquiries.source}</p>
        {enquiries.rows.length ? (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="text-ash">
                <tr className="border-b border-mineral/15">
                  {["Received", "Name", "Email", "Phone", "Intent", "Residence", "Message"].map((h) => (
                    <th key={h} className="py-2 pr-4 font-normal">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {enquiries.rows.map((e, i) => (
                  <tr key={i} className="border-b border-mineral/10 align-top">
                    <td className="num py-3 pr-4">{new Date(e.created_at).toLocaleString("en-GB")}</td>
                    <td className="py-3 pr-4">{e.name}</td>
                    <td className="py-3 pr-4"><a className="underline" href={`mailto:${e.email}`}>{e.email}</a></td>
                    <td className="py-3 pr-4">{e.phone ?? ""}</td>
                    <td className="py-3 pr-4">{e.intent}</td>
                    <td className="py-3 pr-4">{e.property_slug ?? ""}</td>
                    <td className="max-w-xs py-3 pr-4">{e.message ?? ""}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="mt-4 text-ash">No enquiries yet.</p>
        )}
      </section>
    </>
  );
}

type Row = { created_at: string; name: string; email: string; phone: string | null; intent: string; property_slug: string | null; message: string | null };

async function getEnquiries(): Promise<{ source: string; rows: Row[] }> {
  const db = getServiceClient();
  if (db) {
    const { data, error } = await db.from("enquiries").select("created_at,name,email,phone,intent,property_slug,message").order("created_at", { ascending: false }).limit(100);
    return { source: error ? `Supabase error: ${error.message}` : "Supabase · last 100", rows: (data as Row[]) ?? [] };
  }
  try {
    const raw = await fs.readFile(path.join(process.cwd(), ".data", "enquiries.ndjson"), "utf8");
    const rows = raw.trim().split("\n").filter(Boolean).map((l) => JSON.parse(l) as Row).reverse();
    return { source: "Local development file .data/enquiries.ndjson (configure Supabase for production)", rows };
  } catch {
    return { source: "Supabase is not configured", rows: [] };
  }
}
