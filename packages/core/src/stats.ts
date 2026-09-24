/**
 * Aggregate statistics derived from completed page sessions.
 */

import type { PageSession } from "./types";

export interface Summary {
  pages: number;
  chars: number;
  timeMs: number;
  errors: number;
  /** Time-weighted average WPM across all sessions. */
  avgWpm: number;
  bestWpm: number;
  /** Keystroke-weighted average accuracy. */
  accuracy: number;
}

export function summarize(sessions: readonly PageSession[]): Summary {
  let chars = 0;
  let timeMs = 0;
  let errors = 0;
  let bestWpm = 0;
  let hits = 0;
  for (const s of sessions) {
    chars += s.chars;
    timeMs += s.durationMs;
    errors += s.errors;
    bestWpm = Math.max(bestWpm, s.wpm);
    hits += Object.values(s.keyHits).reduce((a, b) => a + b, 0);
  }
  return {
    pages: sessions.length,
    chars,
    timeMs,
    errors,
    avgWpm: timeMs > 0 ? chars / 5 / (timeMs / 60000) : 0,
    bestWpm,
    accuracy: hits + errors === 0 ? 1 : hits / (hits + errors),
  };
}

/** Local calendar day key (YYYY-MM-DD) for a date. */
export function dayKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export interface Streak {
  current: number;
  longest: number;
  /** Whether the reader already practised today. */
  today: boolean;
}

/**
 * Daily streak: consecutive local days with at least one completed page.
 * The current streak stays alive until the end of today — not having typed
 * yet today does not break yesterday's streak.
 */
export function computeStreak(sessions: readonly PageSession[], now: Date = new Date()): Streak {
  const days = new Set(sessions.map((s) => dayKey(new Date(s.at))));
  if (days.size === 0) return { current: 0, longest: 0, today: false };

  const today = days.has(dayKey(now));
  let current = 0;
  let cursor = today ? now : addDays(now, -1);
  while (days.has(dayKey(cursor))) {
    current++;
    cursor = addDays(cursor, -1);
  }

  const sorted = [...days].sort();
  let longest = 0;
  let run = 0;
  let prev: string | null = null;
  for (const day of sorted) {
    if (prev !== null && dayKey(addDays(new Date(`${prev}T12:00:00`), 1)) === day) run++;
    else run = 1;
    longest = Math.max(longest, run);
    prev = day;
  }
  return { current, longest, today };
}

export type Period = "day" | "week" | "month";

export interface SeriesPoint {
  /** Period start as YYYY-MM-DD. */
  key: string;
  label: string;
  wpm: number;
  accuracy: number;
  pages: number;
  timeMs: number;
}

/** Monday-based week start. */
function startOfWeek(date: Date): Date {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const offset = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - offset);
  return d;
}

function periodStart(date: Date, period: Period): Date {
  if (period === "day") return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  if (period === "week") return startOfWeek(date);
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function stepPeriod(date: Date, period: Period, n: number): Date {
  const d = new Date(date);
  if (period === "day") d.setDate(d.getDate() + n);
  else if (period === "week") d.setDate(d.getDate() + 7 * n);
  else d.setMonth(d.getMonth() + n);
  return d;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function label(date: Date, period: Period): string {
  if (period === "month") return `${MONTHS[date.getMonth()]} ${String(date.getFullYear()).slice(2)}`;
  return `${MONTHS[date.getMonth()]} ${date.getDate()}`;
}

/**
 * WPM/accuracy time series grouped by day, week or month, covering the last
 * `count` periods (empty periods included, with zero pages).
 */
export function series(
  sessions: readonly PageSession[],
  period: Period,
  count: number,
  now: Date = new Date(),
): SeriesPoint[] {
  const first = stepPeriod(periodStart(now, period), period, -(count - 1));
  const buckets = new Map<string, PageSession[]>();
  for (let i = 0; i < count; i++) buckets.set(dayKey(stepPeriod(first, period, i)), []);
  for (const s of sessions) {
    const key = dayKey(periodStart(new Date(s.at), period));
    buckets.get(key)?.push(s);
  }
  return [...buckets.entries()].map(([key, list]) => {
    const sum = summarize(list);
    return {
      key,
      label: label(new Date(`${key}T12:00:00`), period),
      wpm: sum.avgWpm,
      accuracy: sum.accuracy,
      pages: sum.pages,
      timeMs: sum.timeMs,
    };
  });
}

export interface KeyStat {
  key: string;
  hits: number;
  misses: number;
  /** misses / (hits + misses) */
  errorRate: number;
}

/** Per-key error rates across sessions, for the keyboard heatmap. */
export function keyStats(sessions: readonly PageSession[]): Record<string, KeyStat> {
  const out: Record<string, KeyStat> = {};
  const get = (key: string) => (out[key] ??= { key, hits: 0, misses: 0, errorRate: 0 });
  for (const s of sessions) {
    for (const [k, n] of Object.entries(s.keyHits)) get(k).hits += n;
    for (const [k, n] of Object.entries(s.keyMisses)) get(k).misses += n;
  }
  for (const stat of Object.values(out)) {
    const total = stat.hits + stat.misses;
    stat.errorRate = total === 0 ? 0 : stat.misses / total;
  }
  return out;
}

/** Keys with the highest error rate (ignoring rarely-typed keys). */
export function weakestKeys(stats: Record<string, KeyStat>, limit = 5, minSamples = 20): KeyStat[] {
  return Object.values(stats)
    .filter((s) => s.hits + s.misses >= minSamples && s.misses > 0)
    .sort((a, b) => b.errorRate - a.errorRate)
    .slice(0, limit);
}

/** Human-readable duration, e.g. "1h 04m" or "3m 12s". */
export function formatDuration(ms: number): string {
  const total = Math.round(ms / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (h > 0) return `${h}h ${String(m).padStart(2, "0")}m`;
  if (m > 0) return `${m}m ${String(s).padStart(2, "0")}s`;
  return `${s}s`;
}
