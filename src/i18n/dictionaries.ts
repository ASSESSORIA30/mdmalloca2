import "server-only";
import type { Locale } from "./config";

const loaders = {
  en: () => import("./en").then((m) => m.default),
  es: () => import("./es").then((m) => m.default),
  ca: () => import("./ca").then((m) => m.default),
};

export const getDictionary = (locale: Locale) => loaders[locale]();
export type { Dictionary } from "./en";
