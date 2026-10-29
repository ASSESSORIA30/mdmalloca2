import type { Metadata } from "next";
import "../globals.css";

export const metadata: Metadata = { title: "Admin · ModularDom", robots: { index: false, follow: false } };

/** Separate root layout: the admin shares no chrome, fonts or scripts with the public site. */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-stone font-sans text-mineral">{children}</body>
    </html>
  );
}
