"use client";

/**
 * A book (or custom text) being typed: page navigation, progress saving,
 * session recording and the end-of-book screen, wrapped around TypingArea.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Settings as SettingsIcon } from "lucide-react";
import {
  accuracy,
  correctChars,
  summarize,
  wpm,
  type EngineState,
  type PageSession,
  type TextSource,
} from "@inktype/core";
import { useStore } from "@/lib/store";
import { useUi } from "@/lib/ui-state";
import { scheduleSync } from "@/lib/sync";
import { uid } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { TypingArea } from "./typing-area";
import { Background } from "@/components/effects/background";
import { fontFamily } from "@/lib/font-catalog";
import { useT } from "@/lib/i18n";

interface ReaderProps {
  bookKey: string;
  source: TextSource;
  title: string;
  author: string;
  pages: string[];
  /** ISO language code of the text (picks the virtual keyboard layout). */
  language?: string;
}

interface Toast {
  id: number;
  text: string;
}

export function Reader({ bookKey, source, title, author, pages, language }: ReaderProps) {
  const settings = useStore((s) => s.data.settings);
  const sessions = useStore((s) => s.data.sessions);
  const saved = useStore((s) => s.data.progress[bookKey]);
  const { saveProgress, recordSession, updateSettings } = useStore.getState();
  const t = useT();

  const total = pages.length;
  // Initial position comes from saved progress (read once on mount).
  const [page, setPage] = useState(() => Math.min(saved?.page ?? 0, total));
  const [startPos, setStartPos] = useState(() => (saved && saved.page < total ? saved.pos : 0));
  const [toast, setToast] = useState<Toast | null>(null);

  const posRef = useRef(startPos);
  const pageRef = useRef(page);
  pageRef.current = page;

  const averageWpm = useMemo(() => summarize(sessions).avgWpm, [sessions]);
  const finishedBook = page >= total;

  const persist = useCallback(
    (nextPage: number, pos: number) => {
      saveProgress({
        bookKey,
        source,
        title,
        author,
        page: nextPage,
        pos,
        totalPages: total,
        completed: nextPage >= total,
      });
    },
    [bookKey, source, title, author, total, saveProgress],
  );

  // Record that the book was opened (so it appears under "continue reading").
  useEffect(() => {
    persist(pageRef.current, posRef.current);
  }, [persist]);

  // Mid-page position is saved on a timer and when the tab is hidden,
  // rather than on every keystroke.
  useEffect(() => {
    let lastSaved = posRef.current;
    const flush = () => {
      if (posRef.current !== lastSaved && pageRef.current < total) {
        lastSaved = posRef.current;
        persist(pageRef.current, posRef.current);
      }
    };
    const id = setInterval(flush, 3000);
    const onHide = () => document.visibilityState === "hidden" && flush();
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("pagehide", flush);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("pagehide", flush);
      flush();
    };
  }, [persist, total]);

  const onPosChange = useCallback((pos: number) => {
    posRef.current = pos;
  }, []);

  const goTo = useCallback(
    (target: number) => {
      const next = Math.max(0, Math.min(target, total));
      posRef.current = 0;
      setStartPos(0);
      setPage(next);
      persist(next, 0);
    },
    [persist, total],
  );

  const onComplete = useCallback(
    (state: EngineState) => {
      const current = pageRef.current;
      if (state.keystrokes > 0) {
        const chars = correctChars(state);
        const session: PageSession = {
          id: uid(),
          at: new Date().toISOString(),
          bookKey,
          page: current,
          chars,
          durationMs: Math.round(state.activeMs),
          wpm: Math.round(wpm(chars, state.activeMs) * 10) / 10,
          accuracy: Math.round(accuracy(state.correctKeystrokes, state.keystrokes) * 1000) / 1000,
          errors: state.errors,
          keyHits: { ...state.keyHits },
          keyMisses: { ...state.keyMisses },
        };
        recordSession(session);
        setToast({
          id: Date.now(),
          text: t("reader.toast", {
            page: current + 1,
            wpm: Math.round(session.wpm),
            acc: Math.round(session.accuracy * 100),
          }),
        });
        scheduleSync();
      }
      goTo(current + 1);
    },
    [bookKey, goTo, recordSession, t],
  );

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 2400);
    return () => clearTimeout(id);
  }, [toast]);

  const percent = total === 0 ? 100 : Math.floor((Math.min(page, total) / total) * 100);

  const pageControls = (
    <div className="flex items-center gap-1 tabular-nums">
      <button
        type="button"
        onClick={() => goTo(page - 1)}
        disabled={page === 0}
        className="rounded p-1 hover:text-fg disabled:opacity-30"
        aria-label={t("reader.prevPage")}
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      <PageJump page={page} total={total} onJump={goTo} />
      <button
        type="button"
        onClick={() => goTo(page + 1)}
        disabled={page >= total}
        className="rounded p-1 hover:text-fg disabled:opacity-30"
        aria-label={t("reader.nextPageAria")}
      >
        <ChevronRight className="h-4 w-4" />
      </button>
      <span className="ml-2">{percent}%</span>
    </div>
  );

  return (
    <main className="relative flex h-dvh min-h-0 flex-1 flex-col overflow-hidden">
      <Background kind={settings.background} themeKey={settings.theme} />

      {finishedBook ? (
        <FinishedBook title={title} bookKey={bookKey} onRestart={() => goTo(0)} />
      ) : settings.readingMode ? (
        <ReadingView
          text={pages[page] ?? ""}
          title={title}
          pageLabel={t("reader.page", { page: page + 1, total })}
          onPrev={() => goTo(page - 1)}
          onNext={() => goTo(page + 1)}
          pageControls={pageControls}
          progress={total ? page / total : 1}
        />
      ) : (
        <TypingArea
          key={`${bookKey}:${page}`}
          text={pages[page] ?? ""}
          settings={settings}
          initialPos={startPos}
          averageWpm={averageWpm}
          title={title}
          pageLabel={t("reader.page", { page: page + 1, total })}
          bookProgress={total ? page / total : 1}
          keyboardLayout={language === "tr" ? "tr" : "us"}
          onPosChange={onPosChange}
          onComplete={onComplete}
          onNextPage={() => goTo(page + 1)}
          onToggleFocusMode={() => updateSettings({ focusMode: !settings.focusMode })}
          pageControls={pageControls}
        />
      )}

      <div aria-live="polite" className="pointer-events-none fixed inset-x-0 top-16 z-30 flex justify-center">
        {toast && (
          <div
            key={toast.id}
            className="animate-fade-in rounded-full border border-line bg-bg/95 px-4 py-1.5 text-xs tabular-nums text-fg shadow-sm"
            data-testid="page-toast"
          >
            {toast.text}
          </div>
        )}
      </div>
    </main>
  );
}

/** Reading mode: the page, fully legible, turned with the arrow keys. */
function ReadingView({
  text,
  title,
  pageLabel,
  onPrev,
  onNext,
  pageControls,
  progress,
}: {
  text: string;
  title: string;
  pageLabel: string;
  onPrev: () => void;
  onNext: () => void;
  pageControls: React.ReactNode;
  progress: number;
}) {
  const settings = useStore((s) => s.data.settings);
  const openSettings = useUi((s) => s.openSettings);
  const t = useT();
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target?.closest("input, textarea, select, [data-testid=settings-drawer]")) return;
      if (e.key === "ArrowRight" || e.key === "PageDown" || e.key === " ") {
        e.preventDefault();
        onNext();
      } else if (e.key === "ArrowLeft" || e.key === "PageUp") {
        e.preventDefault();
        onPrev();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onNext, onPrev]);

  return (
    <div className="relative z-10 flex min-h-0 flex-1 flex-col">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between gap-4 px-4 text-sm sm:px-8">
        <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-2 text-muted">
          <Link href="/library" className="shrink-0 hover:text-fg">
            {t("reader.books")}
          </Link>
          <span aria-hidden>/</span>
          <span className="truncate text-fg">{title}</span>
        </nav>
        <div className="flex items-center gap-4 text-muted">
          <span className="hidden sm:inline">
            {t("reader.readingMode")} · {pageLabel}
          </span>
          <button type="button" onClick={() => openSettings()} className="rounded-md p-1.5 hover:bg-surface hover:text-fg" aria-label={t("nav.settings")}>
            <SettingsIcon className="h-[18px] w-[18px]" />
          </button>
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-8 sm:px-8">
        <div
          className="mx-auto whitespace-pre-wrap text-fg"
          style={{
            maxWidth: { narrow: "34em", medium: "42em", wide: "54em" }[settings.lineWidth],
            fontFamily: fontFamily(settings.font),
            fontWeight: settings.boldText ? 700 : 400,
            fontSize: `min(${settings.fontSize}px, 6.4vw)`,
            lineHeight: 1.75,
          }}
          data-testid="reading-text"
        >
          {text.split("\n").map((para, i) => (
            <p key={i} className="mb-[0.9em]">
              {para}
            </p>
          ))}
        </div>
      </div>
      <div className="shrink-0">
        <div className="h-px w-full bg-line">
          <div className="h-px bg-accent" style={{ width: `${progress * 100}%` }} />
        </div>
        <div className="flex justify-center py-2.5 text-xs text-muted">{pageControls}</div>
      </div>
    </div>
  );
}

function PageJump({ page, total, onJump }: { page: number; total: number; onJump: (p: number) => void }) {
  const t = useT();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState("");
  if (editing) {
    return (
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const n = parseInt(value, 10);
          if (Number.isFinite(n)) onJump(n - 1);
          setEditing(false);
        }}
      >
        <input
          autoFocus
          inputMode="numeric"
          aria-label={t("reader.goToPage")}
          value={value}
          onChange={(e) => setValue(e.target.value.replace(/\D/g, ""))}
          onBlur={() => setEditing(false)}
          className="w-14 rounded border border-line bg-bg px-1 text-center text-xs text-fg"
        />
      </form>
    );
  }
  return (
    <button
      type="button"
      className="rounded px-1 hover:text-fg"
      title={t("reader.goToPage")}
      data-testid="page-indicator"
      onClick={() => {
        setValue(String(Math.min(page + 1, total)));
        setEditing(true);
      }}
    >
      {Math.min(page + 1, total)} / {total}
    </button>
  );
}

function FinishedBook({ title, bookKey, onRestart }: { title: string; bookKey: string; onRestart: () => void }) {
  const sessions = useStore((s) => s.data.sessions);
  const t = useT();
  const summary = useMemo(() => summarize(sessions.filter((s) => s.bookKey === bookKey)), [sessions, bookKey]);
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 text-center animate-fade-in">
      <p className="smallcaps text-sm text-muted">{t("reader.finis")}</p>
      <h2 className="mt-2 font-serif text-4xl italic">{t("reader.theEnd")}</h2>
      <p className="mt-4 max-w-md text-muted">
        {t("reader.typedAll")} <span className="italic text-fg">{title}</span>
        {summary.pages > 0 &&
          t("reader.summary", {
            pages: summary.pages,
            wpm: Math.round(summary.avgWpm),
            acc: Math.round(summary.accuracy * 100),
          })}
        .
      </p>
      <div className="mt-8 flex gap-3">
        <Button variant="outline" onClick={onRestart}>
          {t("reader.startOver")}
        </Button>
        <Button asChild>
          <Link href="/library">{t("reader.another")}</Link>
        </Button>
      </div>
    </div>
  );
}
