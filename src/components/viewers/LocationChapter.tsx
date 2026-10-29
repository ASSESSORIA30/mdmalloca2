"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";

const LocationMap = dynamic(() => import("./LocationMap"), { ssr: false });

type MapProps = React.ComponentProps<typeof LocationMap>;

/** Mounts the map only when it approaches the viewport. */
export function LocationChapter(props: MapProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [near, setNear] = useState(false);
  useEffect(() => {
    const io = new IntersectionObserver(([e]) => e.isIntersecting && setNear(true), { rootMargin: "600px 0px" });
    if (ref.current) io.observe(ref.current);
    return () => io.disconnect();
  }, []);
  return (
    <div ref={ref} className="relative aspect-[4/5] bg-mineral-2 sm:aspect-[16/10]">
      {near ? <LocationMap {...props} /> : null}
    </div>
  );
}
