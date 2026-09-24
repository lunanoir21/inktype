/**
 * Shared data model. Everything a reader produces lives in a single
 * `InktypeData` document: it is what we persist in localStorage, what we
 * export as JSON, and what we sync to a self-hosted server.
 */

export type TextSource = "gutenberg" | "wikisource" | "custom";

/** One completed page. Sessions are the source of truth for all statistics. */
export interface PageSession {
  id: string;
  /** ISO timestamp of completion. */
  at: string;
  /** Book key, e.g. "gutenberg:1342", "wikisource:tr:Kaşağı" or "custom:<uuid>". */
  bookKey: string;
  page: number;
  chars: number;
  durationMs: number;
  wpm: number;
  accuracy: number;
  errors: number;
  keyHits: Record<string, number>;
  keyMisses: Record<string, number>;
}

export interface BookProgress {
  bookKey: string;
  source: TextSource;
  title: string;
  author: string;
  /** Current page index (0-based). Pages before it are done. */
  page: number;
  /** Cursor offset inside the current page, so reading resumes mid-page. */
  pos: number;
  totalPages: number;
  completed: boolean;
  updatedAt: string;
}

export interface CustomText {
  id: string;
  title: string;
  body: string;
  sourceUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CustomTheme {
  id: string;
  name: string;
  colors: {
    background: string;
    foreground: string;
    muted: string;
    accent: string;
    error: string;
  };
}

export type LineWidth = "narrow" | "medium" | "wide";

/**
 * Cursor shapes. "box" fills the character, "ebox" outlines it, "line" is a
 * caret, "high" recolours the character, and the "h-" variants combine a
 * highlight with an underline or dot.
 */
export type CursorStyle = "box" | "ebox" | "line" | "under" | "dot" | "high" | "hunder" | "hdot" | "none";

export type StatsUpdate = "live" | "word" | "line" | "page";

export interface Settings {
  /** Interface language: "auto" follows the browser, or "en" / "tr". */
  uiLanguage: string;
  /** Font id (see the web app's font catalogue). */
  font: string;
  fontSize: number;
  boldText: boolean;
  lineWidth: LineWidth;
  /** "system" | a built-in theme id | a custom theme id. */
  theme: string;
  customThemes: CustomTheme[];
  errorMode: "block" | "advance";
  ignoreAccents: boolean;
  ignoreCase: boolean;
  /** Punctuation and symbols are typed automatically. */
  skipPunctuation: boolean;
  /** Show the key that was actually pressed instead of the expected one. */
  showLiteralMistypes: boolean;
  soundKeypress: boolean;
  soundError: boolean;
  soundVolume: number;
  cursorStyle: CursorStyle;
  smoothCaret: boolean;
  /** Visual effect played on each correct keystroke ("none" to disable). */
  typingEffect: string;
  /** Trail/particles that follow the cursor ("none" to disable). */
  cursorEffect: string;
  /** Animated background behind the text ("none" to disable). */
  background: string;
  showLiveStats: boolean;
  statsUpdate: StatsUpdate;
  /** Hide all UI while typing. */
  focusMode: boolean;
  /** Read without typing; arrow keys turn pages. */
  readingMode: boolean;
  /** Keep the current line vertically centred. */
  autoScroll: boolean;
  virtualKeyboard: boolean;
  /** Width of the settings drawer in pixels. */
  drawerWidth: number;
  updatedAt: string;
}

export interface InktypeData {
  version: 1;
  settings: Settings;
  progress: Record<string, BookProgress>;
  sessions: PageSession[];
  customTexts: CustomText[];
  /** IDs of custom texts deleted on any device, so sync does not resurrect them. */
  deletedCustomTexts: string[];
  lastBookKey: string | null;
}
