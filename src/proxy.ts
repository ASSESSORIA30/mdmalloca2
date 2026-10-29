import { NextResponse, type NextRequest } from "next/server";
import { DEFAULT_LOCALE, LOCALES } from "@/i18n/config";

function preferredLocale(req: NextRequest) {
  const header = req.headers.get("accept-language") ?? "";
  const wanted = header
    .split(",")
    .map((part) => {
      const [tag, q] = part.trim().split(";q=");
      return { tag: tag.toLowerCase().slice(0, 2), q: q ? Number(q) : 1 };
    })
    .sort((a, b) => b.q - a.q);
  return wanted.find((w) => (LOCALES as readonly string[]).includes(w.tag))?.tag ?? DEFAULT_LOCALE;
}

function unauthorised() {
  return new NextResponse("Authentication required", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="ModularDom admin", charset="UTF-8"' },
  });
}

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Admin: separate from the public site, protected by credentials from env.
  if (pathname.startsWith("/admin") || pathname.startsWith("/api/admin")) {
    const user = process.env.ADMIN_USERNAME;
    const pass = process.env.ADMIN_PASSWORD;
    if (!user || !pass) return new NextResponse("Admin is disabled. Set ADMIN_USERNAME and ADMIN_PASSWORD.", { status: 404 });
    const auth = req.headers.get("authorization");
    if (!auth?.startsWith("Basic ")) return unauthorised();
    const [u, p] = atob(auth.slice(6)).split(":");
    if (u !== user || p !== pass) return unauthorised();
    return NextResponse.next();
  }

  const hasLocale = LOCALES.some((l) => pathname === `/${l}` || pathname.startsWith(`/${l}/`));
  if (hasLocale) return NextResponse.next();

  const url = req.nextUrl.clone();
  url.pathname = `/${preferredLocale(req)}${pathname === "/" ? "" : pathname}`;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!_next|api/enquiry|projects|hdri|brand|favicon|icon|apple-icon|robots.txt|sitemap.xml|.*\\.[a-z0-9]+$).*)"],
};
