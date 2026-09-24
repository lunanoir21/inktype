/**
 * The typing engine.
 *
 * A small, pure state machine: every function takes a state and returns a new
 * one, never mutating its input. That keeps it trivially testable and lets the
 * React layer use it directly as a reducer.
 *
 * Two error modes are supported:
 *
 * - "block":   a wrong key is recorded as an error but the cursor stays put.
 *              The reader must type the correct character to move on.
 * - "advance": a wrong key is shown in red and the cursor moves on. Mistakes
 *              can be fixed with Backspace, but they still count as errors.
 */

import { stripDiacritics } from "./normalize";

export type ErrorMode = "block" | "advance";

export type CharState = "pending" | "correct" | "incorrect";

export interface EngineOptions {
  mode?: ErrorMode;
  /** Treat "é" and "e" as the same key. */
  ignoreAccents?: boolean;
  /** Treat upper and lower case as the same key. */
  ignoreCase?: boolean;
  /** Punctuation and symbols are filled in automatically. */
  skipPunctuation?: boolean;
  /** Resume mid-page: characters before this index count as already typed. */
  startPos?: number;
}

export interface EngineState {
  readonly text: string;
  readonly mode: ErrorMode;
  readonly ignoreAccents: boolean;
  readonly ignoreCase: boolean;
  readonly skipPunctuation: boolean;
  /** Index of the character the cursor is on. */
  readonly pos: number;
  /** Per-character correctness. */
  readonly marks: readonly CharState[];
  /** What was actually typed at each position (advance mode shows it). */
  readonly typed: readonly (string | null)[];
  /** Whether an error ever happened at a position (even if later fixed). */
  readonly hadError: readonly boolean[];
  /** Index where this session began (resumed pages start > 0). */
  readonly startPos: number;
  readonly keystrokes: number;
  readonly correctKeystrokes: number;
  readonly errors: number;
  /** Correct presses per expected character. */
  readonly keyHits: Readonly<Record<string, number>>;
  /** Wrong presses per expected character (drives the weak-key heatmap). */
  readonly keyMisses: Readonly<Record<string, number>>;
  readonly startedAt: number | null;
  readonly lastInputAt: number | null;
  /** Active typing time. Long idle gaps are capped so AFK time is not counted. */
  readonly activeMs: number;
  readonly finished: boolean;
}

/** Gaps between keystrokes longer than this are treated as idle time. */
export const IDLE_CAP_MS = 4000;

/** Characters that "skip punctuation" types for the reader. */
export function isSkippable(ch: string | undefined): boolean {
  return ch !== undefined && /[\p{P}\p{S}]/u.test(ch);
}

/** Advance over punctuation when skipPunctuation is on (not counted as keystrokes). */
function autoSkip(state: EngineState, marks: CharState[], typed: (string | null)[], pos: number): number {
  if (!state.skipPunctuation) return pos;
  while (pos < state.text.length && isSkippable(state.text[pos])) {
    marks[pos] = "correct";
    typed[pos] = state.text[pos] ?? null;
    pos++;
  }
  return pos;
}

export function createEngine(text: string, options: EngineOptions = {}): EngineState {
  const state = createRaw(text, options);
  if (!state.skipPunctuation || state.finished) return state;
  const marks = state.marks.slice();
  const typed = state.typed.slice();
  const pos = autoSkip(state, marks, typed, state.pos);
  return { ...state, marks, typed, pos, startPos: pos, finished: pos >= text.length };
}

function createRaw(text: string, options: EngineOptions): EngineState {
  const startPos = Math.max(0, Math.min(options.startPos ?? 0, text.length));
  const marks: CharState[] = Array.from({ length: text.length }, (_, i) =>
    i < startPos ? "correct" : "pending",
  );
  return {
    text,
    mode: options.mode ?? "block",
    ignoreAccents: options.ignoreAccents ?? false,
    ignoreCase: options.ignoreCase ?? false,
    skipPunctuation: options.skipPunctuation ?? false,
    pos: startPos,
    marks,
    typed: Array.from({ length: text.length }, (_, i) => (i < startPos ? (text[i] ?? null) : null)),
    hadError: new Array<boolean>(text.length).fill(false),
    startPos,
    keystrokes: 0,
    correctKeystrokes: 0,
    errors: 0,
    keyHits: {},
    keyMisses: {},
    startedAt: null,
    lastInputAt: null,
    activeMs: 0,
    finished: text.length === 0 || startPos >= text.length,
  };
}

/** Does the typed character satisfy the expected one? */
export function charsMatch(
  typed: string,
  expected: string,
  opts: { ignoreAccents?: boolean; ignoreCase?: boolean } = {},
): boolean {
  if (typed === expected) return true;
  // A paragraph break can be typed with Enter or Space.
  if (expected === "\n") return typed === " " || typed === "\n";
  let a = typed;
  let b = expected;
  if (opts.ignoreCase) {
    a = a.toLowerCase();
    b = b.toLowerCase();
  }
  if (opts.ignoreAccents) {
    a = stripDiacritics(a);
    b = stripDiacritics(b);
  }
  return a === b;
}

function tick(state: EngineState, now: number): Pick<EngineState, "startedAt" | "lastInputAt" | "activeMs"> {
  if (state.startedAt === null || state.lastInputAt === null) {
    return { startedAt: now, lastInputAt: now, activeMs: state.activeMs };
  }
  const gap = Math.max(0, now - state.lastInputAt);
  return {
    startedAt: state.startedAt,
    lastInputAt: now,
    activeMs: state.activeMs + Math.min(gap, IDLE_CAP_MS),
  };
}

function bump(map: Readonly<Record<string, number>>, key: string): Record<string, number> {
  return { ...map, [key]: (map[key] ?? 0) + 1 };
}

/** Normalize a key for stats: whitespace becomes a readable token. */
export function statKey(ch: string): string {
  if (ch === " " || ch === "\n") return "space";
  return ch.toLowerCase();
}

/** Process one typed character. */
export function typeChar(state: EngineState, ch: string, now: number): EngineState {
  if (state.finished || ch.length === 0) return state;
  const expected = state.text[state.pos];
  if (expected === undefined) return state;

  const ok = charsMatch(ch, expected, state);
  const timing = tick(state, now);
  const key = statKey(expected);

  const marks = state.marks.slice();
  const typed = state.typed.slice();
  const hadError = state.hadError.slice();

  let pos = state.pos;
  if (ok) {
    marks[pos] = "correct";
    typed[pos] = ch;
    pos += 1;
  } else {
    hadError[pos] = true;
    typed[pos] = ch;
    marks[pos] = "incorrect";
    if (state.mode === "advance") pos += 1;
  }
  if (ok || state.mode === "advance") pos = autoSkip(state, marks, typed, pos);

  const finished = pos >= state.text.length && (state.mode === "advance" || ok);

  return {
    ...state,
    ...timing,
    pos,
    marks,
    typed,
    hadError,
    keystrokes: state.keystrokes + 1,
    correctKeystrokes: state.correctKeystrokes + (ok ? 1 : 0),
    errors: state.errors + (ok ? 0 : 1),
    keyHits: ok ? bump(state.keyHits, key) : state.keyHits,
    keyMisses: ok ? state.keyMisses : bump(state.keyMisses, key),
    finished,
  };
}

/** Type a whole string (handy for tests and paste-free replays). */
export function typeString(state: EngineState, input: string, now: number): EngineState {
  let s = state;
  for (const ch of input) s = typeChar(s, ch, now);
  return s;
}

/**
 * Delete the previous character (advance mode) or clear a pending error
 * (block mode). Never moves before the session's start position.
 */
export function backspace(state: EngineState, now: number): EngineState {
  if (state.finished) return state;

  if (state.mode === "block") {
    // Nothing to delete: the cursor never passes an error. Just clear the red mark.
    if (state.marks[state.pos] !== "incorrect") return state;
    const marks = state.marks.slice();
    marks[state.pos] = "pending";
    const typed = state.typed.slice();
    typed[state.pos] = null;
    return { ...state, marks, typed };
  }

  if (state.pos <= state.startPos) return state;
  let pos = state.pos - 1;
  const marks = state.marks.slice();
  const typed = state.typed.slice();
  // Auto-typed punctuation is removed together with the character before it.
  while (state.skipPunctuation && pos > state.startPos && isSkippable(state.text[pos])) {
    marks[pos] = "pending";
    typed[pos] = null;
    pos--;
  }
  marks[pos] = "pending";
  typed[pos] = null;
  return { ...state, ...tick(state, now), pos, marks, typed };
}

/** Delete back to the start of the current/previous word (Ctrl+Backspace). */
export function backspaceWord(state: EngineState, now: number): EngineState {
  if (state.mode === "block") return backspace(state, now);
  let s = state;
  // Skip whitespace directly before the cursor, then the word itself.
  while (s.pos > s.startPos && /\s/.test(s.text[s.pos - 1] ?? "")) s = backspace(s, now);
  while (s.pos > s.startPos && !/\s/.test(s.text[s.pos - 1] ?? "")) s = backspace(s, now);
  return s;
}

/** Active time including the gap since the last keystroke (for live display). */
export function elapsedMs(state: EngineState, now: number): number {
  if (state.lastInputAt === null) return state.activeMs;
  if (state.finished) return state.activeMs;
  return state.activeMs + Math.min(Math.max(0, now - state.lastInputAt), IDLE_CAP_MS);
}

/** Characters correctly typed during this session (excludes resumed prefix). */
export function correctChars(state: EngineState): number {
  let n = 0;
  for (let i = state.startPos; i < state.pos; i++) if (state.marks[i] === "correct") n++;
  return n;
}

/** Net words per minute: correct characters / 5 per minute of active time. */
export function wpm(chars: number, ms: number): number {
  if (ms <= 0) return 0;
  return chars / 5 / (ms / 60000);
}

/** Accuracy as a fraction 0..1 of keystrokes that were correct. */
export function accuracy(correct: number, total: number): number {
  return total === 0 ? 1 : correct / total;
}

export interface LiveStats {
  wpm: number;
  accuracy: number;
  errors: number;
  elapsedMs: number;
  progress: number;
}

export function liveStats(state: EngineState, now: number): LiveStats {
  const ms = elapsedMs(state, now);
  return {
    // Avoid absurd numbers during the first second of typing.
    wpm: ms < 1000 ? 0 : wpm(correctChars(state), ms),
    accuracy: accuracy(state.correctKeystrokes, state.keystrokes),
    errors: state.errors,
    elapsedMs: ms,
    progress: state.text.length === 0 ? 1 : state.pos / state.text.length,
  };
}

/**
 * Bank the time since the last keystroke when the reader pauses, so the pause
 * itself is not counted when they resume.
 */
export function pauseTiming(state: EngineState, now: number): EngineState {
  if (state.lastInputAt === null || state.finished) return state;
  return { ...state, ...tick(state, now) };
}

/** Restart the idle clock on resume. */
export function resumeTiming(state: EngineState, now: number): EngineState {
  if (state.lastInputAt === null || state.finished) return state;
  return { ...state, lastInputAt: now };
}
