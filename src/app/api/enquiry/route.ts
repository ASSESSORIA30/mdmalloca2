import { NextResponse, after, type NextRequest } from "next/server";
import fs from "node:fs/promises";
import path from "node:path";
import { enquirySchema, type Enquiry } from "@/lib/enquiry-schema";
import { getServiceClient } from "@/lib/supabase-server";

/*
 * Private enquiry endpoint.
 * Storage: Supabase (table `enquiries`, see supabase/migrations). Notification: Resend email to SALES_EMAIL.
 * CRM: optional POST of the same JSON to CRM_WEBHOOK_URL (HubSpot, Pipedrive, Salesforce via Zapier/Make, ...).
 * All secrets are server-side env vars; nothing here is exposed to the browser.
 */

const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 5;
const hits = new Map<string, number[]>(); // per instance; use Upstash/Vercel KV for a global limit

function rateLimited(ip: string) {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > MAX_PER_WINDOW;
}

async function verifyTurnstile(token: string | undefined, ip: string) {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return true;
  if (!token) return false;
  const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    body: new URLSearchParams({ secret, response: token, remoteip: ip }),
  });
  const data = (await res.json()) as { success: boolean };
  return data.success;
}

const escape = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

async function notify(e: Enquiry, id: string | null) {
  const key = process.env.RESEND_API_KEY;
  const to = process.env.SALES_EMAIL;
  const from = process.env.EMAIL_FROM || "ModularDom <noreply@modulardom.com>";
  if (key && to) {
    const rows: [string, string | undefined][] = [
      ["Intent", e.intent],
      ["Name", e.name],
      ["Email", e.email],
      ["Phone", e.phone ? `${e.phonePrefix ?? ""} ${e.phone}` : undefined],
      ["Country", e.country],
      ["Residence", e.property],
      ["Language", e.locale],
      ["Message", e.message],
      ["Reference", id ?? undefined],
    ];
    const html = `<table cellpadding="6" style="font-family:Helvetica,Arial,sans-serif;font-size:14px">${rows
      .filter(([, v]) => v)
      .map(([k, v]) => `<tr><td style="color:#67645E">${k}</td><td>${escape(String(v)).replace(/\n/g, "<br>")}</td></tr>`)
      .join("")}</table>`;
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to: to.split(","), reply_to: e.email, subject: `Private enquiry · ${e.name}${e.property ? ` · ${e.property}` : ""}`, html }),
    }).catch((err) => console.error("[enquiry] email failed", err));
  }
  const hook = process.env.CRM_WEBHOOK_URL;
  if (hook) {
    await fetch(hook, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...e, id, source: "modulardom-web" }) }).catch((err) =>
      console.error("[enquiry] CRM webhook failed", err),
    );
  }
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  if (rateLimited(ip)) return NextResponse.json({ ok: false, error: "rate" }, { status: 429 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid" }, { status: 400 });
  }
  const parsed = enquirySchema.safeParse(body);
  if (!parsed.success) {
    const fields = Object.fromEntries(parsed.error.issues.map((i) => [i.path.join("."), i.message]));
    return NextResponse.json({ ok: false, error: "invalid", fields }, { status: 422 });
  }
  const e = parsed.data;

  // Bots: honeypot filled or submitted faster than a person can type. Answer as if accepted.
  if (e.company || (e.startedAt && Date.now() - e.startedAt < 2500)) return NextResponse.json({ ok: true });
  if (!(await verifyTurnstile(e.turnstileToken, ip))) return NextResponse.json({ ok: false, error: "invalid" }, { status: 400 });

  const record = {
    intent: e.intent,
    name: e.name,
    email: e.email.toLowerCase(),
    phone: e.phone ? `${e.phonePrefix ?? ""} ${e.phone}`.trim() : null,
    country: e.country || null,
    property_slug: e.property || null,
    message: e.message || null,
    locale: e.locale,
    consent_at: new Date().toISOString(),
    user_agent: req.headers.get("user-agent")?.slice(0, 300) ?? null,
  };

  let id: string | null = null;
  const db = getServiceClient();
  if (db) {
    const { data, error } = await db.from("enquiries").insert(record).select("id").single();
    if (error) {
      console.error("[enquiry] storage failed", error);
      return NextResponse.json({ ok: false, error: "server" }, { status: 500 });
    }
    id = data.id;
  } else if (process.env.NODE_ENV !== "production") {
    // Local development without Supabase: append to .data/enquiries.ndjson (git-ignored).
    const dir = path.join(process.cwd(), ".data");
    await fs.mkdir(dir, { recursive: true });
    await fs.appendFile(path.join(dir, "enquiries.ndjson"), JSON.stringify({ ...record, created_at: record.consent_at }) + "\n");
  } else if (!process.env.RESEND_API_KEY) {
    // Never accept a lead in production that is neither stored nor sent anywhere.
    console.error("[enquiry] no storage or email configured");
    return NextResponse.json({ ok: false, error: "server" }, { status: 503 });
  }

  after(() => notify(e, id));
  return NextResponse.json({ ok: true });
}
