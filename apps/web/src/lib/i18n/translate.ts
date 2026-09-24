/**
 * Pure i18n helpers, usable from both server and client components.
 */

import { en, tr, type MessageKey } from "./messages";

export type Locale = "en" | "tr";
export const LOCALES: { code: Locale; label: string }[] = [
  { code: "en", label: "English" },
  { code: "tr", label: "Türkçe" },
];
export const LANG_COOKIE = "inktype-lang";

const DICTS: Record<Locale, Record<MessageKey, string>> = { en, tr };

export function resolveLocale(pref: string, browserLanguage?: string): Locale {
  if (pref === "en" || pref === "tr") return pref;
  return browserLanguage?.toLowerCase().startsWith("tr") ? "tr" : "en";
}

export function translate(locale: Locale, key: MessageKey, vars?: Record<string, string | number>): string {
  const template = DICTS[locale][key] ?? en[key];
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (whole, name: string) => (name in vars ? String(vars[name]) : whole));
}

/** "1h 04m" / "1 sa 04 dk" style durations. */
export function formatDurationL(ms: number, locale: Locale): string {
  const total = Math.round(ms / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const u = locale === "tr" ? { h: " sa", m: " dk", s: " sn" } : { h: "h", m: "m", s: "s" };
  const pad = (n: number) => String(n).padStart(2, "0");
  if (h > 0) return `${h}${u.h} ${pad(m)}${u.m}`;
  if (m > 0) return `${m}${u.m} ${pad(s)}${u.s}`;
  return `${s}${u.s}`;
}
