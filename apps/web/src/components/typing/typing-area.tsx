"use client";

/**
 * The typing surface.
 *
 * Input is captured by a visually hidden <textarea>. That is what makes the
 * app work with mobile touch keyboards, IME composition and dead keys: we read
 * what the browser inserted, feed it to the engine, then reset the textarea.
 *
 * Layout: the text block is translated vertically so the line containing the
 * cursor sits in the middle of the viewport (or scrolls only when needed with
 * auto scroll off). The cursor is a single absolutely-positioned element, so
 * it can glide between characters; effects are drawn on a shared canvas.
 */

import { memo, useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import { Settings as SettingsIcon } from "lucide-react";
import {
  backspace,
  backspaceWord,
  createEngine,
  liveStats,
  pauseTiming,
  resumeTiming,
  typeChar,
  type CharState,
  type EngineState,
  type LiveStats,
  type Settings,
} from "@inktype/core";
import { cn } from "@/lib/utils";
import { playError, playKey } from "@/lib/sound";
import { useUi } from "@/lib/ui-state";
import { fontFamily, isMonoFont } from "@/lib/font-catalog";
import { CSS_TYPING_EFFECTS } from "@/lib/effects";
import { cursorTrail, readPalette, typingBurst, type Palette } from "@/components/effects/fx";
import { VirtualKeyboard } from "./virtual-keyboard";
import { cursorBox } from "@/lib/cursor-geometry";
import { useT } from "@/lib/i18n";

/** The textarea always holds this sentinel so mobile Backspace fires input events. */
const SENTINEL = " ";

const LINE_WIDTH: Record<Settings["lineWidth"], string> = {
  narrow: "min(100%, 34em)",
  medium: "min(100%, 42em)",
  wide: "min(100%, 54em)",
};

/** Typing effects drawn only with CSS (no particles). */
const CSS_ONLY = new Set(["typewriter", "glow", "crunch", "float", "corrupt"]);

export interface TypingAreaProps {
  text: string;
  settings: Settings;
  /** Resume offset inside the page. */
  initialPos?: number;
  /** Average WPM over all past sessions. */
  averageWpm?: number;
  title: string;
  pageLabel: string;
  /** 0..1 progress through the whole book. */
  bookProgress: number;
  keyboardLayout?: "us" | "tr";
  onPosChange?: (pos: number) => void;
  onComplete: (state: EngineState) => void;
  onNextPage?: () => void;
  onToggleFocusMode?: () => void;
  /** Page navigation controls rendered in the bottom bar. */
  pageControls?: React.ReactNode;
}

export function TypingArea({
  text,
  settings,
  initialPos = 0,
  averageWpm,
  title,
  pageLabel,
  bookProgress,
  keyboardLayout = "us",
  onPosChange,
  onComplete,
  onNextPage,
  onToggleFocusMode,
  pageControls,
}: TypingAreaProps) {
  const makeEngine = useCallback(
    (startPos: number) =>
      createEngine(text, {
        mode: settings.errorMode,
        ignoreAccents: settings.ignoreAccents,
        ignoreCase: settings.ignoreCase,
        skipPunctuation: settings.skipPunctuation,
        startPos,
      }),
    [text, settings.errorMode, settings.ignoreAccents, settings.ignoreCase, settings.skipPunctuation],
  );

  const [engine, setEngine] = useState<EngineState>(() => makeEngine(initialPos));
  const engineRef = useRef(engine);
  engineRef.current = engine;

  const [paused, setPaused] = useState(false);
  const [focused, setFocused] = useState(false);
  const [idle, setIdle] = useState(true);
  const [now, setNow] = useState(() => Date.now());
  const [shown, setShown] = useState<LiveStats | null>(null);

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const blockRef = useRef<HTMLDivElement>(null);
  const cursorRef = useRef<HTMLDivElement>(null);
  const charRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const [offsetY, setOffsetY] = useState(0);
  const completedRef = useRef(engine.finished);
  const idleTimer = useRef<ReturnType<typeof setTimeout>>();
  const fxPending = useRef(false);
  const lastLineTop = useRef<number | null>(null);
  const lastCursorPos = useRef(engine.pos);
  const palette = useRef<Palette | null>(null);

  const setTyping = useUi((s) => s.setTyping);
  const openSettings = useUi((s) => s.openSettings);
  const typing = useUi((s) => s.typing);
  const t = useT();
  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  // Rebuild the engine when the matching rules change mid-page (keeps position).
  useEffect(() => {
    setEngine((prev) => {
      if (
        prev.text === text &&
        prev.mode === settings.errorMode &&
        prev.ignoreAccents === settings.ignoreAccents &&
        prev.ignoreCase === settings.ignoreCase &&
        prev.skipPunctuation === settings.skipPunctuation
      ) {
        return prev;
      }
      const next = makeEngine(prev.text === text && !prev.finished ? prev.pos : 0);
      engineRef.current = next;
      return next;
    });
  }, [makeEngine, text, settings.errorMode, settings.ignoreAccents, settings.ignoreCase, settings.skipPunctuation]);

  // Theme colours for particles (re-read when the theme changes).
  useEffect(() => {
    palette.current = readPalette();
  }, [settings.theme, settings.customThemes]);

  /* ------------------------------------------------------------------ input */

  const apply = useCallback(
    (update: (s: EngineState, now: number) => EngineState, sound = true) => {
      const prev = engineRef.current;
      const t = Date.now();
      const next = update(prev, t);
      if (next === prev) return;
      engineRef.current = next;
      setEngine(next);

      const s = settingsRef.current;
      const mistake = next.errors > prev.errors;
      if (sound) {
        if (mistake) {
          if (s.soundError) playError(s.soundVolume);
        } else if (s.soundKeypress && next.keystrokes > prev.keystrokes) {
          playKey(s.soundVolume);
        }
      }
      if (!mistake && next.pos > prev.pos) fxPending.current = true;
      if (s.statsUpdate === "word" && !mistake && /\s/.test(prev.text[prev.pos] ?? "")) {
        setShown(liveStats(next, t));
      }
      setIdle(false);
      setTyping(true);
      clearTimeout(idleTimer.current);
      idleTimer.current = setTimeout(() => setIdle(true), 1200);
    },
    [setTyping],
  );

  const typeText = useCallback(
    (chars: string) => {
      for (const ch of chars) apply((s, t) => typeChar(s, ch === "\r" ? "\n" : ch, t));
    },
    [apply],
  );

  const pause = useCallback(() => {
    setPaused(true);
    setTyping(false);
    setEngine((s) => {
      const next = pauseTiming(s, Date.now());
      engineRef.current = next;
      return next;
    });
  }, [setTyping]);

  const resume = useCallback(() => {
    setPaused(false);
    setEngine((s) => {
      const next = resumeTiming(s, Date.now());
      engineRef.current = next;
      return next;
    });
    inputRef.current?.focus({ preventScroll: true });
  }, []);

  const restart = useCallback(() => {
    const fresh = makeEngine(0);
    engineRef.current = fresh;
    completedRef.current = false;
    setEngine(fresh);
    setShown(null);
    setPaused(false);
    inputRef.current?.focus({ preventScroll: true });
  }, [makeEngine]);

  const resetInput = () => {
    const el = inputRef.current;
    if (!el) return;
    el.value = SENTINEL;
    el.setSelectionRange(SENTINEL.length, SENTINEL.length);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const mod = e.ctrlKey || e.metaKey;

    if (e.key === "Escape") {
      e.preventDefault();
      if (paused) resume();
      else pause();
      return;
    }
    if (e.key === "Tab") {
      e.preventDefault();
      restart();
      return;
    }
    if (e.key === "Enter" && mod) {
      e.preventDefault();
      onNextPage?.();
      return;
    }
    if (paused) {
      // While paused, keys are commands, not text.
      if (!mod && !e.altKey && e.key.length === 1) e.preventDefault();
      if (e.key.toLowerCase() === "f" && !mod) onToggleFocusMode?.();
      else if (e.key === "Enter" || e.key === " ") resume();
      return;
    }
    if (e.key === "Backspace") {
      e.preventDefault();
      apply((s, t) => (mod || e.altKey ? backspaceWord(s, t) : backspace(s, t)), false);
      return;
    }
    if (e.key === "Enter") {
      e.preventDefault();
      typeText("\n");
      return;
    }
    // Everything else arrives through the `input` / `compositionend` events.
  };

  // Native listeners give us `inputType` and `isComposing`, which React's
  // synthetic onChange hides.
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    resetInput();

    const onInput = (event: Event) => {
      const e = event as InputEvent;
      if (e.isComposing) return;
      const value = el.value;
      if (e.inputType?.startsWith("delete") || value.length < SENTINEL.length) {
        const word = e.inputType === "deleteWordBackward";
        apply((s, t) => (word ? backspaceWord(s, t) : backspace(s, t)), false);
      } else if (e.inputType === "insertLineBreak" || e.inputType === "insertParagraph") {
        typeText("\n");
      } else {
        const inserted = value.startsWith(SENTINEL) ? value.slice(SENTINEL.length) : value;
        typeText(inserted);
      }
      resetInput();
    };
    const onCompositionEnd = (e: CompositionEvent) => {
      if (e.data) typeText(e.data);
      resetInput();
    };
    el.addEventListener("input", onInput);
    el.addEventListener("compositionend", onCompositionEnd);
    return () => {
      el.removeEventListener("input", onInput);
      el.removeEventListener("compositionend", onCompositionEnd);
    };
  }, [apply, typeText]);

  // Focus on mount; any printable key anywhere on the page focuses the input.
  useEffect(() => {
    if (!useUi.getState().settingsOpen) inputRef.current?.focus({ preventScroll: true });
    const onWindowKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target === inputRef.current) return;
      if (target && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT|BUTTON|A|SUMMARY)$/.test(target.tagName))) return;
      if (target?.closest("[data-testid=settings-drawer]")) return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.key.length === 1 || e.key === "Escape" || e.key === "Tab") {
        inputRef.current?.focus({ preventScroll: true });
        if (e.key === "Tab") {
          e.preventDefault();
          restart();
        }
      }
    };
    window.addEventListener("keydown", onWindowKey);
    return () => window.removeEventListener("keydown", onWindowKey);
  }, [restart]);

  // Reveal the chrome when the mouse moves meaningfully.
  useEffect(() => {
    let last: { x: number; y: number } | null = null;
    const onMove = (e: MouseEvent) => {
      if (last && Math.hypot(e.clientX - last.x, e.clientY - last.y) > 12) setTyping(false);
      last = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener("mousemove", onMove);
    return () => {
      window.removeEventListener("mousemove", onMove);
      setTyping(false);
    };
  }, [setTyping]);

  /* ------------------------------------------------------------- lifecycle */

  useEffect(() => {
    onPosChange?.(engine.pos);
  }, [engine.pos, onPosChange]);

  useEffect(() => {
    if (engine.finished && !completedRef.current) {
      completedRef.current = true;
      setTyping(false);
      onComplete(engine);
    }
  }, [engine, onComplete, setTyping]);

  // Live clock for WPM/time while typing.
  useEffect(() => {
    if (paused || engine.startedAt === null || engine.finished || settings.statsUpdate !== "live") return;
    const id = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(id);
  }, [paused, engine.startedAt, engine.finished, settings.statsUpdate]);

  // Ambient cursor effect: fireflies drift around the cursor even while idle.
  useEffect(() => {
    if (settings.cursorEffect !== "fireflies") return;
    const id = setInterval(() => {
      const el = cursorRef.current;
      if (!el || !palette.current || document.visibilityState !== "visible") return;
      const r = el.getBoundingClientRect();
      if (r.width === 0 && r.height === 0) return;
      cursorTrail("fireflies", r.left, r.top, r.width, r.height, palette.current);
    }, 350);
    return () => clearInterval(id);
  }, [settings.cursorEffect]);

  /* ---------------------------------------------------------------- layout */

  const layout = useCallback(() => {
    const block = blockRef.current;
    const viewport = viewportRef.current;
    const cursor = cursorRef.current;
    if (!block || !viewport || !cursor) return;
    const s = engineRef.current;
    const index = Math.min(s.pos, s.text.length - 1);
    const el = charRefs.current[index];
    if (!el) return;
    const st = settingsRef.current;
    const atEnd = s.pos >= s.text.length;
    const lineHeight = parseFloat(getComputedStyle(block).lineHeight) || el.offsetHeight;
    const top = el.offsetTop;
    const width = atEnd ? 2 : Math.max(el.offsetWidth, 6);
    const vh = viewport.clientHeight;

    // Vertical position of the text block.
    if (st.autoScroll) {
      setOffsetY(Math.round(vh / 2 - top - lineHeight / 2));
    } else {
      setOffsetY((current) => {
        const pad = Math.min(48, vh * 0.08);
        if (current + top < pad) return Math.round(pad - top);
        if (current + top + lineHeight > vh - lineHeight * 1.5) return Math.round(vh - lineHeight * 2.5 - top);
        return current === 0 ? Math.round(pad) : current;
      });
    }

    if (lastLineTop.current !== null && lastLineTop.current !== top && st.statsUpdate === "line") {
      setShown(liveStats(s, Date.now()));
    }
    lastLineTop.current = top;

    // Cursor shape, placed on the visible glyphs (see cursor-geometry.ts).
    const box = cursorBox(el, st.cursorStyle, atEnd);
    const c = cursor.style;
    c.display = st.cursorStyle === "high" || st.cursorStyle === "none" ? "none" : "block";
    c.transform = `translate(${box.x}px, ${box.y}px)`;
    c.width = `${box.w}px`;
    c.height = `${box.h}px`;

    // Cursor trail effect when the cursor moved.
    if (s.pos !== lastCursorPos.current && st.cursorEffect !== "none" && palette.current) {
      const r = el.getBoundingClientRect();
      cursorTrail(st.cursorEffect, atEnd ? r.right : r.left, r.top, width, r.height, palette.current);
    }
    lastCursorPos.current = s.pos;

    // Typing effect on the character just typed.
    if (fxPending.current) {
      fxPending.current = false;
      const typed = charRefs.current[s.pos - 1];
      const fx = st.typingEffect;
      if (typed && fx !== "none") {
        if (CSS_TYPING_EFFECTS.has(fx)) {
          const cls = `fx-${fx}`;
          typed.classList.remove(cls);
          void typed.offsetWidth; // restart the animation
          typed.classList.add(cls);
          typed.addEventListener("animationend", () => typed.classList.remove(cls), { once: true });
        }
        if (palette.current && !CSS_ONLY.has(fx)) {
          const r = typed.getBoundingClientRect();
          typingBurst(fx, r.left + r.width / 2, r.bottom - r.height * 0.25, r.height, palette.current);
        }
      }
    }
  }, []);

  useLayoutEffect(layout, [
    engine.pos,
    engine.marks,
    settings.fontSize,
    settings.font,
    settings.boldText,
    settings.lineWidth,
    settings.cursorStyle,
    settings.autoScroll,
    layout,
  ]);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const ro = new ResizeObserver(() => layout());
    ro.observe(viewport);
    // Web fonts can change metrics after load.
    void document.fonts?.ready.then(() => layout());
    return () => ro.disconnect();
  }, [layout, settings.font]);

  /* ---------------------------------------------------------------- render */

  const live = liveStats(engine, now);
  const stats: LiveStats | null =
    settings.statsUpdate === "live"
      ? live
      : settings.statsUpdate === "page"
        ? engine.finished
          ? live
          : null
        : shown;
  const active = focused && !paused;
  const onError = engine.marks[engine.pos] === "incorrect";
  const hideChrome = typing && settings.focusMode;
  const chromeClass = cn(
    "transition-opacity duration-300",
    hideChrome ? "pointer-events-none opacity-0" : typing ? "opacity-25 hover:opacity-100" : "opacity-100",
  );
  const highlight = settings.cursorStyle === "high" || settings.cursorStyle === "hunder" || settings.cursorStyle === "hdot";

  return (
    <div className="relative z-10 flex min-h-0 flex-1 flex-col">
      <textarea
        ref={inputRef}
        aria-label={t("reader.typingInput")}
        data-testid="typing-input"
        className="fixed left-0 top-0 h-px w-px resize-none opacity-0"
        style={{ fontSize: 16 }}
        autoCapitalize="off"
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
        inputMode="text"
        enterKeyHint="enter"
        onKeyDown={onKeyDown}
        onPaste={(e) => e.preventDefault()}
        onDrop={(e) => e.preventDefault()}
        onFocus={() => setFocused(true)}
        onBlur={() => {
          setFocused(false);
          setTyping(false);
        }}
      />

      {/* Top bar, in the spirit of a reading console. */}
      <div data-chrome className={cn("shrink-0", chromeClass)}>
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 text-sm sm:px-8">
          <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-2 text-muted">
            <Link href="/library" className="shrink-0 hover:text-fg">
              {t("reader.books")}
            </Link>
            <span aria-hidden>/</span>
            <span className="truncate text-fg" data-testid="book-title">
              {title}
            </span>
          </nav>
          <div className="flex shrink-0 items-center gap-4 tabular-nums sm:gap-6">
            <span className="hidden text-muted sm:inline">{pageLabel}</span>
            {settings.showLiveStats && (
              <span className="flex items-center gap-4" data-testid="live-stats">
                <span>
                  <b className="font-semibold">{stats ? Math.round(stats.wpm) : "—"}</b>
                  <span className="ml-1 text-xs text-muted">WPM</span>
                </span>
                <span>
                  <b className="font-semibold">{stats ? `${(stats.accuracy * 100).toFixed(1)}%` : "—"}</b>
                  <span className="ml-1 text-xs text-muted">ACC</span>
                </span>
                <span className="hidden md:inline">
                  <b className="font-semibold">{engine.errors}</b>
                  <span className="ml-1 text-xs text-muted">{t("reader.err")}</span>
                </span>
                {averageWpm !== undefined && averageWpm > 0 && (
                  <span className="hidden lg:inline">
                    <b className="font-semibold">{Math.round(averageWpm)}</b>
                    <span className="ml-1 text-xs text-muted">{t("reader.avg")}</span>
                  </span>
                )}
              </span>
            )}
            <button
              type="button"
              onClick={() => openSettings()}
              className="rounded-md p-1.5 text-muted hover:bg-surface hover:text-fg"
              aria-label={t("nav.settings")}
              data-testid="open-settings"
            >
              <SettingsIcon className="h-[18px] w-[18px]" />
            </button>
          </div>
        </div>
      </div>

      <div
        ref={viewportRef}
        className="typing-mask relative min-h-0 flex-1 cursor-text overflow-hidden"
        onMouseDown={(e) => {
          e.preventDefault();
          if (paused) resume();
          else inputRef.current?.focus({ preventScroll: true });
        }}
        data-testid="typing-viewport"
      >
        <div
          className={cn("mx-auto px-5 sm:px-8", settings.autoScroll && "transition-transform duration-200 ease-out")}
          style={{ width: LINE_WIDTH[settings.lineWidth], transform: `translateY(${offsetY}px)` }}
        >
          <div
            ref={blockRef}
            className="relative select-none whitespace-pre-wrap break-words"
            style={{
              fontFamily: fontFamily(settings.font),
              fontWeight: settings.boldText ? 700 : 400,
              // Never larger than ~15 characters per line allows on narrow phones.
              fontSize: `min(${settings.fontSize}px, 6.4vw)`,
              lineHeight: isMonoFont(settings.font) ? 1.8 : 1.75,
              letterSpacing: settings.boldText ? "0.01em" : undefined,
            }}
            data-testid="typing-text"
          >
            <div
              ref={cursorRef}
              aria-hidden
              className={cn(
                "pointer-events-none absolute left-0 top-0",
                settings.smoothCaret && "transition-[transform,width,height] duration-100 ease-out",
                settings.cursorStyle === "box" && (onError ? "rounded-[3px] bg-error/30" : "rounded-[3px] bg-accent/30"),
                settings.cursorStyle === "ebox" &&
                  (onError ? "rounded-[3px] ring-[1.5px] ring-error" : "rounded-[3px] ring-[1.5px] ring-accent"),
                ["line", "under", "hunder", "dot", "hdot"].includes(settings.cursorStyle) &&
                  (onError ? "rounded-full bg-error" : "rounded-full bg-accent"),
                settings.cursorEffect === "rainbow" && "cursor-rainbow",
                idle && active && "animate-blink",
                !active && "opacity-50",
              )}
            />
            {Array.from(text, (ch, i) => (
              <Char
                key={i}
                ch={ch}
                index={i}
                state={engine.marks[i] ?? "pending"}
                hadError={engine.hadError[i] ?? false}
                typedTitle={t("reader.typed", { ch: "{ch}" })}
                typed={settings.showLiteralMistypes || engine.mode === "advance" ? (engine.typed[i] ?? null) : null}
                literal={settings.showLiteralMistypes}
                current={highlight && i === engine.pos}
                refs={charRefs}
              />
            ))}
          </div>
        </div>
      </div>

      {(!focused || paused) && !engine.finished && (
        <div className="pointer-events-none absolute inset-x-0 bottom-16 z-20 flex justify-center px-4">
          <div
            className="animate-fade-in rounded-full border border-line bg-bg/90 px-4 py-2 text-center text-xs text-muted shadow-sm backdrop-blur"
            data-testid="typing-hint"
          >
            {paused ? (
              <>
                <span className="font-medium text-fg">{t("reader.paused")}</span> · <Kbd>Esc</Kbd> {t("reader.resume")} ·{" "}
                <Kbd>Tab</Kbd> {t("reader.restart")} · <Kbd>F</Kbd> {settings.focusMode ? t("reader.showUi") : t("reader.hideUi")} ·{" "}
                <Kbd>Ctrl</Kbd>+<Kbd>Enter</Kbd> {t("reader.nextPage")}
              </>
            ) : (
              t("reader.clickToType")
            )}
          </div>
        </div>
      )}

      {settings.virtualKeyboard && (
        <div className={cn("shrink-0 px-4 pb-2", chromeClass)}>
          <VirtualKeyboard next={engine.text[engine.pos]} layout={keyboardLayout} />
        </div>
      )}

      <div data-chrome className={cn("relative shrink-0", chromeClass)}>
        <div className="h-px w-full bg-line">
          <div
            className="h-px bg-accent transition-[width] duration-300"
            style={{ width: `${Math.round(bookProgress * 1000) / 10}%` }}
          />
        </div>
        <div className="mx-auto flex max-w-6xl items-center justify-center px-4 py-2.5 text-xs text-muted">
          {pageControls}
        </div>
      </div>
    </div>
  );
}

export function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="rounded border border-line bg-surface px-1.5 py-0.5 font-sans text-[0.85em] text-fg">{children}</kbd>
  );
}

interface CharProps {
  ch: string;
  index: number;
  state: CharState;
  hadError: boolean;
  typed: string | null;
  literal: boolean;
  /** Highlight-style cursors recolour the current character itself. */
  current: boolean;
  /** Tooltip template for a mistyped character, with a {ch} placeholder. */
  typedTitle: string;
  refs: React.MutableRefObject<(HTMLSpanElement | null)[]>;
}

/** One character. Memoized so a keystroke only re-renders the characters it touched. */
const Char = memo(function Char({ ch, index, state, hadError, typed, literal, current, typedTitle, refs }: CharProps) {
  const isNewline = ch === "\n";
  const wrong = state === "incorrect";
  const showTyped = literal && wrong && typed !== null && typed !== ch;
  const shownChar = showTyped ? (typed === " " || typed === "\n" ? "·" : typed) : isNewline ? "↵" : ch;
  const className = cn(
    "transition-colors duration-75",
    state === "pending" && (current ? "text-accent" : "text-muted"),
    state === "correct" && "text-fg",
    state === "correct" && hadError && "underline decoration-error/60 decoration-2 underline-offset-[0.2em]",
    // Mistakes: red glyph with an underline (a background would sit on the
    // font's asymmetric content box). Mistyped spaces get a thicker underline.
    wrong && "text-error underline decoration-error/70 decoration-2 underline-offset-[0.18em]",
    wrong && (ch === " " || isNewline) && "decoration-[3px] decoration-error",
  );
  return (
    <>
      <span
        ref={(el) => {
          refs.current[index] = el;
        }}
        className={cn(className, isNewline && !showTyped && "px-[0.15em] text-[0.7em] opacity-60")}
        title={wrong && typed && typed !== ch ? typedTitle.replace("{ch}", typed) : undefined}
        data-state={state}
      >
        {shownChar}
      </span>
      {isNewline && <br />}
    </>
  );
});
