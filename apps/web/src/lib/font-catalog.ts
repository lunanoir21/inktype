/**
 * Reading fonts offered in settings. Each maps to a CSS variable defined by
 * fonts.ts (next/font), except OpenDyslexic, which is bundled from Fontsource.
 */

export type FontCategory = "serif" | "sans" | "mono" | "display";

export interface FontInfo {
  id: string;
  label: string;
  category: FontCategory;
  /** CSS font-family value. */
  family: string;
}

const stack = { serif: "Georgia, serif", sans: "system-ui, sans-serif", mono: "ui-monospace, monospace", display: "Georgia, serif" };

function f(id: string, label: string, category: FontCategory): FontInfo {
  return { id, label, category, family: `var(--font-${id}), ${stack[category]}` };
}

export const FONT_CATALOG: FontInfo[] = [
  f("literata", "Literata", "serif"),
  f("lora", "Lora", "serif"),
  f("crimson-pro", "Crimson Pro", "serif"),
  f("libre-baskerville", "Libre Baskerville", "serif"),
  f("eb-garamond", "EB Garamond", "serif"),
  f("merriweather", "Merriweather", "serif"),
  f("playfair-display", "Playfair Display", "serif"),
  f("source-serif", "Source Serif 4", "serif"),
  f("spectral", "Spectral", "serif"),
  f("cormorant-garamond", "Cormorant Garamond", "serif"),
  f("alegreya", "Alegreya", "serif"),
  f("bitter", "Bitter", "serif"),
  f("pt-serif", "PT Serif", "serif"),
  f("noto-serif", "Noto Serif", "serif"),
  f("inter", "Inter", "sans"),
  f("atkinson-hyperlegible", "Atkinson Hyperlegible", "sans"),
  f("instrument-sans", "Instrument Sans", "sans"),
  f("jost", "Jost", "sans"),
  f("nunito", "Nunito", "sans"),
  f("work-sans", "Work Sans", "sans"),
  f("lexend", "Lexend", "sans"),
  f("rubik", "Rubik", "sans"),
  f("ibm-plex-sans", "IBM Plex Sans", "sans"),
  f("open-sans", "Open Sans", "sans"),
  f("kanit", "Kanit", "sans"),
  f("philosopher", "Philosopher", "sans"),
  f("jetbrains-mono", "JetBrains Mono", "mono"),
  f("fira-code", "Fira Code", "mono"),
  f("courier-prime", "Courier Prime", "mono"),
  f("ibm-plex-mono", "IBM Plex Mono", "mono"),
  f("space-mono", "Space Mono", "mono"),
  f("special-elite", "Special Elite", "display"),
  f("courgette", "Courgette", "display"),
  f("dancing-script", "Dancing Script", "display"),
  f("comic-neue", "Comic Neue", "display"),
  f("alice", "Alice", "display"),
  f("concert-one", "Concert One", "display"),
  { id: "opendyslexic", label: "OpenDyslexic", category: "sans", family: "OpenDyslexic, system-ui, sans-serif" },
];

export function fontFamily(id: string): string {
  return (FONT_CATALOG.find((x) => x.id === id) ?? FONT_CATALOG[0]!).family;
}

export function isMonoFont(id: string): boolean {
  return FONT_CATALOG.find((x) => x.id === id)?.category === "mono";
}
