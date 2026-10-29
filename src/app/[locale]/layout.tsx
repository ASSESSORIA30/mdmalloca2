import type { Metadata, Viewport } from "next";
import { Hanken_Grotesk, Newsreader } from "next/font/google";
import { notFound } from "next/navigation";
import { getDictionary } from "@/i18n/dictionaries";
import { LOCALES, isLocale } from "@/i18n/config";
import { site } from "@/lib/site";
import { Header } from "@/components/chrome/Header";
import { Footer } from "@/components/chrome/Footer";
import { DemoNotice } from "@/components/chrome/DemoNotice";
import { RevealObserver } from "@/components/chrome/RevealObserver";
import "../globals.css";

const newsreader = Newsreader({
  subsets: ["latin"],
  axes: ["opsz"],
  style: ["normal", "italic"],
  variable: "--font-newsreader",
  display: "swap",
});
const hanken = Hanken_Grotesk({ subsets: ["latin"], variable: "--font-hanken", display: "swap" });

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

export const viewport: Viewport = {
  themeColor: "#161715",
  width: "device-width",
  initialScale: 1,
};

export async function generateMetadata({ params }: LayoutProps<"/[locale]">): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const dict = await getDictionary(locale);
  return {
    metadataBase: new URL(site.url),
    title: { default: `${dict.meta.defaultTitle} · ModularDom`, template: "%s · ModularDom" },
    description: dict.meta.defaultDescription,
    applicationName: dict.meta.siteName,
    openGraph: { siteName: dict.meta.siteName, type: "website", locale },
    twitter: { card: "summary_large_image" },
    robots: site.demoMode ? { index: false, follow: false } : undefined,
  };
}

export default async function LocaleLayout({ children, params }: LayoutProps<"/[locale]">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const dict = await getDictionary(locale);

  return (
    <html lang={locale} suppressHydrationWarning className={`${newsreader.variable} ${hanken.variable}`}>
      <head>
        {/* opt into reveal styles only when JS runs, so content is never hidden without it */}
        <script dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('js')" }} />
      </head>
      <body>
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-stone focus:px-5 focus:py-3">
          {dict.nav.skip}
        </a>
        <Header locale={locale} dict={dict.nav} />
        <main id="main">{children}</main>
        <Footer locale={locale} dict={dict} />
        {site.demoMode ? <DemoNotice text={dict.demo.notice} dismiss={dict.demo.dismiss} /> : null}
        <RevealObserver />
      </body>
    </html>
  );
}
