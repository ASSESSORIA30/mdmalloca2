import Image from "next/image";
import { site } from "@/lib/site";

/** Typographic wordmark until the ModularDom logo file is supplied (see site.logo). */
export function Wordmark({ className = "" }: { className?: string }) {
  if (site.logo) return <Image src={site.logo.src} width={site.logo.width} height={site.logo.height} alt="ModularDom" className={className} priority />;
  return (
    <span className={`inline-flex flex-col leading-none ${className}`}>
      <span className="font-sans text-[0.9375rem] font-medium tracking-[0.34em]">MODULARDOM</span>
      <span className="mt-1.5 font-serif text-[0.8125rem] italic tracking-[0.01em] opacity-75">Mallorca Private Residences</span>
    </span>
  );
}
