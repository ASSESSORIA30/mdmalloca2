import "server-only";
import fs from "node:fs/promises";
import path from "node:path";
import { cacheLife } from "next/cache";
import { property, type Property } from "@/content/schema";

const DIR = path.join(process.cwd(), "content", "properties");

export type ContentIssue = { file: string; message: string };

async function readFromFiles(): Promise<{ items: Property[]; issues: ContentIssue[] }> {
  const files = (await fs.readdir(DIR)).filter((f) => f.endsWith(".json"));
  const items: Property[] = [];
  const issues: ContentIssue[] = [];
  await Promise.all(
    files.map(async (file) => {
      const raw = JSON.parse(await fs.readFile(path.join(DIR, file), "utf8"));
      const parsed = property.safeParse(raw);
      if (parsed.success) items.push(parsed.data);
      else issues.push({ file, message: parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ") });
    }),
  );
  return { items, issues };
}

/** Optional: properties stored as JSONB documents in Supabase (CONTENT_SOURCE=supabase). */
async function readFromSupabase(): Promise<{ items: Property[]; issues: ContentIssue[] }> {
  const { getServiceClient } = await import("./supabase-server");
  const client = getServiceClient();
  if (!client) throw new Error("CONTENT_SOURCE=supabase but Supabase is not configured");
  const { data, error } = await client.from("properties").select("slug, document").eq("published", true);
  if (error) throw error;
  const items: Property[] = [];
  const issues: ContentIssue[] = [];
  for (const row of data ?? []) {
    const parsed = property.safeParse(row.document);
    if (parsed.success) items.push(parsed.data);
    else issues.push({ file: `supabase:${row.slug}`, message: parsed.error.message });
  }
  return { items, issues };
}

export async function loadContent() {
  "use cache";
  cacheLife("hours");
  const result = process.env.CONTENT_SOURCE === "supabase" ? await readFromSupabase() : await readFromFiles();
  result.items.sort((a, b) => a.order - b.order);
  return result;
}

export async function getProperties() {
  const { items } = await loadContent();
  return items.filter((p) => p.published);
}

export async function getProperty(slug: string) {
  const items = await getProperties();
  return items.find((p) => p.slug === slug) ?? null;
}
