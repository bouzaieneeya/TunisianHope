import ar from "./locales/ar.json";
import en from "./locales/en.json";
import fr from "./locales/fr.json";

export type Locale = "en" | "fr" | "ar";

export const LOCALES: { code: Locale; labelKey: string }[] = [
  { code: "en", labelKey: "language.en" },
  { code: "fr", labelKey: "language.fr" },
  { code: "ar", labelKey: "language.ar" },
];

const messages: Record<Locale, Record<string, unknown>> = { en, fr, ar };

export function isRtl(locale: Locale): boolean {
  return locale === "ar";
}

function resolve(obj: Record<string, unknown>, path: string): string | undefined {
  const parts = path.split(".");
  let cur: unknown = obj;
  for (const p of parts) {
    if (cur == null || typeof cur !== "object") return undefined;
    cur = (cur as Record<string, unknown>)[p];
  }
  return typeof cur === "string" ? cur : undefined;
}

export function translate(locale: Locale, key: string): string {
  return resolve(messages[locale], key) ?? resolve(messages.en, key) ?? key;
}

export const STORAGE_KEY = "tunisian-hope-locale";

export function getStoredLocale(): Locale {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === "en" || stored === "fr" || stored === "ar") return stored;
  return "en";
}
