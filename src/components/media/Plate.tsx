import Image from "next/image";
import { t, type Locale, type Media } from "@/content/schema";

type Props = {
  media: Media;
  locale: Locale;
  sizes: string;
  demoLabel?: string;
  priority?: boolean;
  /** cover crops around the focal point; contain never crops (use for plans and renders that must stay whole) */
  fit?: "cover" | "contain";
  className?: string;
  imgClassName?: string;
  reveal?: boolean;
};

/** An image in a fixed frame, with the demonstration mark when the asset is provisional. */
export function Plate({ media, locale, sizes, demoLabel, priority, fit = "cover", className = "", imgClassName = "", reveal }: Props) {
  return (
    <figure className={`relative overflow-hidden bg-mineral-2 ${className}`} {...(reveal ? { "data-reveal-image": "" } : {})}>
      <Image
        src={media.src}
        alt={t(media.alt, locale)}
        fill
        sizes={sizes}
        priority={priority}
        quality={82}
        className={`${fit === "contain" ? "object-contain" : "object-cover"} ${imgClassName}`}
        style={{ objectPosition: media.focal }}
      />
      {media.demo && demoLabel ? (
        <figcaption className="pointer-events-none absolute bottom-3 left-3 z-10">
          <span className="demo-mark">{demoLabel}</span>
        </figcaption>
      ) : null}
    </figure>
  );
}
