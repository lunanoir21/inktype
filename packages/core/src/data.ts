/**
 * Defaults, validation and merging for the `InktypeData` document.
 */

import type { BookProgress, CustomText, InktypeData, PageSession, Settings } from "./types";

export const DEFAULT_SETTINGS: Settings = {
  uiLanguage: "auto",
  font: "literata",
  fontSize: 24,
  boldText: true,
  lineWidth: "medium",
  theme: "classic-dark",
  customThemes: [],
  errorMode: "block",
  ignoreAccents: false,
  ignoreCase: false,
  skipPunctuation: false,
  showLiteralMistypes: false,
  soundKeypress: false,
  soundError: false,
  soundVolume: 0.5,
  cursorStyle: "box",
  smoothCaret: true,
  typingEffect: "none",
  cursorEffect: "none",
  background: "none",
  showLiveStats: true,
  statsUpdate: "live",
  focusMode: false,
  readingMode: false,
  autoScroll: true,
  virtualKeyboard: false,
  drawerWidth: 340,
  updatedAt: new Date(0).toISOString(),
};

/** Values renamed in earlier versions. */
const LEGACY: Partial<Record<keyof Settings, Record<string, string>>> = {
  font: { serif: "literata", sans: "inter", mono: "jetbrains-mono" },
  cursorStyle: { block: "box", caret: "line", underline: "under", outline: "ebox" },
  theme: { light: "paper", dark: "ink" },
};

export function emptyData(): InktypeData {
  return {
    version: 1,
    settings: { ...DEFAULT_SETTINGS },
    progress: {},
    sessions: [],
    customTexts: [],
    deletedCustomTexts: [],
    lastBookKey: null,
  };
}

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

/**
 * Coerce untrusted JSON (an import file, an old localStorage blob, a sync
 * payload) into a valid `InktypeData`, dropping anything malformed.
 */
export function sanitizeData(input: unknown): InktypeData {
  const base = emptyData();
  if (!isObject(input)) return base;

  const settings: Settings = { ...base.settings };
  if (isObject(input.settings)) {
    for (const key of Object.keys(DEFAULT_SETTINGS) as (keyof Settings)[]) {
      const value = input.settings[key];
      if (value !== undefined && typeof value === typeof DEFAULT_SETTINGS[key]) {
        const renamed = typeof value === "string" ? LEGACY[key]?.[value] : undefined;
        (settings as unknown as Record<string, unknown>)[key] = renamed ?? value;
      }
    }
    if (!Array.isArray(settings.customThemes)) settings.customThemes = [];
  }

  const progress: Record<string, BookProgress> = {};
  if (isObject(input.progress)) {
    for (const [key, value] of Object.entries(input.progress)) {
      if (isObject(value) && typeof value.page === "number" && typeof value.bookKey === "string") {
        progress[key] = value as unknown as BookProgress;
      }
    }
  }

  const sessions = Array.isArray(input.sessions)
    ? (input.sessions.filter(
        (s) => isObject(s) && typeof s.id === "string" && typeof s.at === "string" && typeof s.wpm === "number",
      ) as unknown as PageSession[]).map((s) => ({ ...s, keyHits: s.keyHits ?? {}, keyMisses: s.keyMisses ?? {} }))
    : [];

  const customTexts = Array.isArray(input.customTexts)
    ? (input.customTexts.filter(
        (t) => isObject(t) && typeof t.id === "string" && typeof t.body === "string",
      ) as unknown as CustomText[])
    : [];

  const deletedCustomTexts = Array.isArray(input.deletedCustomTexts)
    ? input.deletedCustomTexts.filter((x): x is string => typeof x === "string")
    : [];

  return {
    version: 1,
    settings,
    progress,
    sessions,
    customTexts,
    deletedCustomTexts,
    lastBookKey: typeof input.lastBookKey === "string" ? input.lastBookKey : null,
  };
}

function later<T extends { updatedAt: string }>(a: T | undefined, b: T | undefined): T | undefined {
  if (!a) return b;
  if (!b) return a;
  return b.updatedAt > a.updatedAt ? b : a;
}

/**
 * Merge two data documents (e.g. this device and the server).
 *
 * - Sessions are append-only: union by id.
 * - Progress, custom texts and settings: last writer wins, per item.
 * - Deleted custom texts stay deleted everywhere.
 *
 * The merge is commutative, so syncing in any order converges.
 */
export function mergeData(a: InktypeData, b: InktypeData): InktypeData {
  const sessionsById = new Map<string, PageSession>();
  for (const s of [...a.sessions, ...b.sessions]) sessionsById.set(s.id, s);
  const sessions = [...sessionsById.values()].sort((x, y) =>
    x.at === y.at ? x.id.localeCompare(y.id) : x.at.localeCompare(y.at),
  );

  const progress: Record<string, BookProgress> = {};
  for (const key of new Set([...Object.keys(a.progress), ...Object.keys(b.progress)])) {
    const winner = later(a.progress[key], b.progress[key]);
    if (winner) progress[key] = winner;
  }

  const deleted = new Set([...a.deletedCustomTexts, ...b.deletedCustomTexts]);
  const textsById = new Map<string, CustomText>();
  for (const t of [...a.customTexts, ...b.customTexts]) {
    if (deleted.has(t.id)) continue;
    const winner = later(textsById.get(t.id), t);
    if (winner) textsById.set(t.id, winner);
  }
  for (const id of deleted) delete progress[`custom:${id}`];

  const settings = b.settings.updatedAt > a.settings.updatedAt ? b.settings : a.settings;

  // The most recently touched book is the one to continue.
  const lastBookKey =
    Object.values(progress).sort((x, y) => y.updatedAt.localeCompare(x.updatedAt))[0]?.bookKey ??
    a.lastBookKey ??
    b.lastBookKey;

  return {
    version: 1,
    settings,
    progress,
    sessions,
    customTexts: [...textsById.values()].sort((x, y) => y.createdAt.localeCompare(x.createdAt)),
    deletedCustomTexts: [...deleted].sort(),
    lastBookKey,
  };
}
