/**
 * Themes and "looks".
 *
 * A theme is five colours; surface and line tones are derived from them so
 * every theme — built-in or user-made — is defined the same way. Colours are
 * exposed as "r g b" CSS variables so Tailwind can apply alpha (`bg-fg/10`).
 *
 * A look (preset) bundles a theme with a font, cursor and background.
 */

import type { CursorStyle, CustomTheme, Settings } from "@inktype/core";

export interface ThemeVars {
  bg: string;
  fg: string;
  muted: string;
  accent: string;
  error: string;
  surface: string;
  line: string;
}

type Colors = CustomTheme["colors"];
const t = (background: string, foreground: string, muted: string, accent: string, error: string): Colors => ({
  background,
  foreground,
  muted,
  accent,
  error,
});

/** Built-in themes, grouped dark then light. All free, all editable (copy to customise). */
export const BUILTIN_THEMES: Record<string, { label: string; colors: Colors }> = {
  "classic-dark": { label: "Classic Dark", colors: t("#131313", "#e9e7e2", "#77746f", "#7fd6a4", "#ff6b6b") },
  "night-sky": { label: "Night Sky", colors: t("#0b0d14", "#e4e6ef", "#6a6f86", "#9fb4ff", "#ff7a8a") },
  candlelight: { label: "Candlelight", colors: t("#1b1611", "#efe2cc", "#8a7a63", "#f0a84a", "#ff7059") },
  terminal: { label: "Terminal", colors: t("#0a0f0c", "#bff5cf", "#4d7a5c", "#39ff88", "#ff5f5f") },
  ocean: { label: "Ocean", colors: t("#0e1a22", "#dcebf0", "#5d7885", "#4fd1c5", "#ff8a80") },
  "plain-gray": { label: "Plain Gray", colors: t("#1c1d1f", "#ececec", "#6f7175", "#d6d6d6", "#f07171") },
  aurora: { label: "Aurora", colors: t("#0d0f16", "#e6e4f2", "#6c6a86", "#8be0c0", "#ff7aa8") },
  forest: { label: "Forest", colors: t("#111a14", "#dfe8d8", "#6b7d68", "#b5d99c", "#ff8f70") },
  ink: { label: "Ink", colors: t("#151412", "#e2ddd3", "#76716a", "#8cacde", "#ef6b60") },
  timber: { label: "Timber", colors: t("#21180f", "#ead9c0", "#8c7456", "#d9934a", "#ff6f5e") },
  cinder: { label: "Cinder", colors: t("#1a1a1d", "#d8d4cf", "#6b6863", "#ff7043", "#ff4d6d") },
  lagoon: { label: "Lagoon", colors: t("#0c2226", "#d6f0ec", "#5a8580", "#5ee1c9", "#ff8f8f") },
  platoon: { label: "Platoon", colors: t("#1f231b", "#d9dcc8", "#7a806a", "#b8c26b", "#e87c5a") },
  pulse: { label: "Pulse", colors: t("#130f1c", "#ece6ff", "#766d90", "#ff4fa3", "#ffb347") },
  vampire: { label: "Vampire", colors: t("#1e1f29", "#f8f8f2", "#6c7293", "#bd93f9", "#ff5555") },
  nord: { label: "Nord", colors: t("#2e3440", "#e5e9f0", "#7b88a1", "#88c0d0", "#bf616a") },
  retro: { label: "Retro", colors: t("#282828", "#ebdbb2", "#928374", "#fabd2f", "#fb4934") },
  "solar-dark": { label: "Solar Dark", colors: t("#002b36", "#eee8d5", "#657b83", "#b58900", "#dc322f") },
  "classic-light": { label: "Classic Light", colors: t("#f7f7f5", "#1a1a1a", "#9b9892", "#2f8f5b", "#d23c3c") },
  "ink-paper": { label: "Ink & Paper", colors: t("#f4f4f1", "#1b2233", "#9a9ea8", "#2f4f8f", "#c0392b") },
  paper: { label: "Paper", colors: t("#fbfaf7", "#1c1b19", "#8e8980", "#254880", "#c4302b") },
  sepia: { label: "Sepia", colors: t("#f4ecd8", "#433422", "#9c886a", "#8f4822", "#b42828") },
  newsprint: { label: "Newsprint", colors: t("#e7e5df", "#161616", "#8f8c85", "#161616", "#c62828") },
  bumblebee: { label: "Bumblebee", colors: t("#fff6d6", "#2b2410", "#a39463", "#d49b00", "#c73e1d") },
  bubblegum: { label: "Bubblegum", colors: t("#fdeef4", "#3b1f2b", "#b08a9a", "#e0487f", "#c62828") },
  smoothie: { label: "Smoothie", colors: t("#f1ecfa", "#2a2340", "#9a92b3", "#7a5cd6", "#d64161") },
  terracotta: { label: "Terracotta", colors: t("#f6e9df", "#3a2319", "#a88a78", "#c1582f", "#b3261e") },
  mellow: { label: "Mellow", colors: t("#eef0e6", "#2d3228", "#959c88", "#6f8f4e", "#c2452d") },
  surf: { label: "Surf", colors: t("#e8f4f6", "#14303a", "#86a3ab", "#1b8aa6", "#d0453b") },
  beachside: { label: "Beachside", colors: t("#f7efe2", "#2f2a22", "#a39a88", "#e07a5f", "#c0392b") },
  "solar-light": { label: "Solar Light", colors: t("#fdf6e3", "#073642", "#93a1a1", "#268bd2", "#dc322f") },
};

export interface Look {
  id: string;
  label: string;
  theme: string;
  font: string;
  cursorStyle: CursorStyle;
  background: string;
  boldText: boolean;
}

/** The ten designed looks. Picking one sets theme, font, cursor and background together. */
export const LOOKS: Look[] = [
  { id: "classic-dark", label: "Classic Dark", theme: "classic-dark", font: "literata", cursorStyle: "box", background: "none", boldText: true },
  { id: "night-sky", label: "Night Sky", theme: "night-sky", font: "lora", cursorStyle: "line", background: "night-sky", boldText: true },
  { id: "ink-paper", label: "Ink & Paper", theme: "ink-paper", font: "crimson-pro", cursorStyle: "under", background: "none", boldText: false },
  { id: "candlelight", label: "Candlelight", theme: "candlelight", font: "libre-baskerville", cursorStyle: "box", background: "candlelight", boldText: false },
  { id: "terminal", label: "Terminal", theme: "terminal", font: "fira-code", cursorStyle: "box", background: "crt", boldText: false },
  { id: "ocean", label: "Ocean", theme: "ocean", font: "crimson-pro", cursorStyle: "under", background: "underwater", boldText: false },
  { id: "plain-gray", label: "Plain Gray", theme: "plain-gray", font: "atkinson-hyperlegible", cursorStyle: "line", background: "none", boldText: false },
  { id: "aurora", label: "Aurora", theme: "aurora", font: "literata", cursorStyle: "dot", background: "aurora", boldText: true },
  { id: "newsprint", label: "Newsprint", theme: "newsprint", font: "courier-prime", cursorStyle: "high", background: "none", boldText: false },
  { id: "forest", label: "Forest", theme: "forest", font: "lora", cursorStyle: "box", background: "none", boldText: false },
];

export function hexToRgb(hex: string): [number, number, number] {
  let h = hex.replace("#", "").trim();
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  const n = parseInt(h.slice(0, 6), 16);
  if (Number.isNaN(n)) return [0, 0, 0];
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function mix(a: [number, number, number], b: [number, number, number], amount: number): string {
  return a.map((v, i) => Math.round(v + ((b[i] ?? 0) - v) * amount)).join(" ");
}

function luminance([r, g, b]: [number, number, number]): number {
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
}

export function colorsToVars(colors: Colors): { vars: ThemeVars; dark: boolean } {
  const bg = hexToRgb(colors.background);
  const fg = hexToRgb(colors.foreground);
  const rgb = (hex: string) => hexToRgb(hex).join(" ");
  return {
    dark: luminance(bg) < 0.5,
    vars: {
      bg: bg.join(" "),
      fg: fg.join(" "),
      muted: rgb(colors.muted),
      accent: rgb(colors.accent),
      error: rgb(colors.error),
      surface: mix(bg, fg, 0.05),
      line: mix(bg, fg, 0.13),
    },
  };
}

/** @deprecated alias kept for callers that pass a whole theme. */
export function customThemeVars(theme: CustomTheme) {
  return colorsToVars(theme.colors);
}

export function themeColors(settings: Pick<Settings, "theme" | "customThemes">): Colors {
  const custom = settings.customThemes.find((c) => c.id === settings.theme);
  if (custom) return custom.colors;
  const builtin = BUILTIN_THEMES[settings.theme];
  if (builtin) return builtin.colors;
  // "system" (or a deleted custom theme) follows the OS preference.
  const prefersDark = typeof window === "undefined" || window.matchMedia("(prefers-color-scheme: dark)").matches;
  return BUILTIN_THEMES[prefersDark ? "classic-dark" : "classic-light"]!.colors;
}

export function resolveTheme(settings: Pick<Settings, "theme" | "customThemes">) {
  return colorsToVars(themeColors(settings));
}

export function applyTheme(settings: Pick<Settings, "theme" | "customThemes">): void {
  const { vars, dark } = resolveTheme(settings);
  const root = document.documentElement;
  for (const [key, value] of Object.entries(vars)) root.style.setProperty(`--${key}`, value);
  root.style.colorScheme = dark ? "dark" : "light";
  root.dataset.theme = settings.theme;
  root.dataset.dark = String(dark);
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", `rgb(${vars.bg})`);
}
