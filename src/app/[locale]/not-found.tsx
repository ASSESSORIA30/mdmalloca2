import Link from "next/link";

export default function NotFound() {
  return (
    <section data-surface="light" className="shell grid min-h-[80svh] place-content-center py-40">
      <span aria-hidden className="horizon mb-10 w-16" />
      <h1 className="h2 max-w-[16ch]">This page is not part of the collection.</h1>
      <Link href="/" className="link-line mt-8">
        Return home
      </Link>
    </section>
  );
}
