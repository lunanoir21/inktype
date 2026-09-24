"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Download } from "lucide-react";
import {
  computeStreak,
  keyStats,
  series,
  summarize,
  weakestKeys,
  type Period,
} from "@inktype/core";
import { useStore } from "@/lib/store";
import { bookHref } from "@/lib/book-key";
import { useHydrated } from "@/lib/use-hydrated";
import { exportStats } from "@/lib/download";
import { Button } from "@/components/ui/button";
import { Segmented } from "@/components/ui/segmented";
import { WpmChart } from "@/components/stats/wpm-chart";
import { KeyboardHeatmap } from "@/components/stats/keyboard-heatmap";
import { formatDurationL, useLocale, useT } from "@/lib/i18n";
import type { MessageKey } from "@/lib/i18n/messages";

const PERIODS: Record<Period, { label: MessageKey; count: number }> = {
  day: { label: "stats.daily", count: 30 },
  week: { label: "stats.weekly", count: 26 },
  month: { label: "stats.monthly", count: 12 },
};

export default function StatsPage() {
  const hydrated = useHydrated();
  const t = useT();
  const locale = useLocale();
  const formatDuration = (ms: number) => formatDurationL(ms, locale);
  const data = useStore((s) => s.data);
  const { sessions, progress } = data;
  const [period, setPeriod] = useState<Period>("week");

  const summary = useMemo(() => summarize(sessions), [sessions]);
  const streak = useMemo(() => computeStreak(sessions), [sessions]);
  const points = useMemo(() => series(sessions, period, PERIODS[period].count), [sessions, period]);
  const keys = useMemo(() => keyStats(sessions), [sessions]);
  const weak = useMemo(() => weakestKeys(keys), [keys]);

  const books = useMemo(
    () =>
      Object.values(progress)
        .map((p) => ({ ...p, stats: summarize(sessions.filter((s) => s.bookKey === p.bookKey)) }))
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
    [progress, sessions],
  );

  if (!hydrated) return <main className="flex-1" />;

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-5 pb-20 sm:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4 pb-8 pt-10 sm:pt-14">
        <div>
          <h1 className="font-serif text-4xl tracking-tight sm:text-5xl">{t("stats.title")}</h1>
          <p className="mt-3 text-muted">{t("stats.intro")}</p>
        </div>
        <Button variant="outline" onClick={() => exportStats(data)} data-testid="export-json">
          <Download /> {t("stats.export")}
        </Button>
      </div>

      <section aria-label="Summary" className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-4">
        <Tile label={t("stats.avgSpeed")} value={`${Math.round(summary.avgWpm)}`} unit="wpm" />
        <Tile label={t("stats.bestPage")} value={`${Math.round(summary.bestWpm)}`} unit="wpm" />
        <Tile label={t("stats.accuracy")} value={`${(summary.accuracy * 100).toFixed(1)}`} unit="%" />
        <Tile label={t("stats.errors")} value={summary.errors.toLocaleString()} />
        <Tile label={t("stats.time")} value={formatDuration(summary.timeMs)} />
        <Tile label={t("stats.pages")} value={summary.pages.toLocaleString()} />
        <Tile
          label={t("stats.streak")}
          value={`${streak.current}`}
          unit={streak.current === 1 ? t("stats.day") : t("stats.days")}
          note={streak.today || streak.current === 0 ? undefined : t("stats.keepStreak")}
        />
        <Tile
          label={t("stats.longest")}
          value={`${streak.longest}`}
          unit={streak.longest === 1 ? t("stats.day") : t("stats.days")}
        />
      </section>

      <section className="mt-14" aria-labelledby="progress-heading">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <h2 id="progress-heading" className="font-serif text-2xl">{t("stats.speedOverTime")}</h2>
          <Segmented
            aria-label={t("stats.period")}
            value={period}
            onChange={setPeriod}
            options={(Object.keys(PERIODS) as Period[]).map((p) => ({ value: p, label: t(PERIODS[p].label) }))}
          />
        </div>
        <WpmChart points={points} />
      </section>

      <section className="mt-14" aria-labelledby="keys-heading">
        <h2 id="keys-heading" className="font-serif text-2xl">{t("stats.weakKeys")}</h2>
        <p className="mb-5 mt-1 text-sm text-muted">
          {weak.length > 0 ? (
            <>
              {t("stats.stumble")}{" "}
              {weak.map((k, i) => (
                <span key={k.key}>
                  <kbd className="rounded border border-line bg-surface px-1.5 font-mono text-fg">{k.key}</kbd>
                  <span className="tabular-nums"> {(k.errorRate * 100).toFixed(0)}%</span>
                  {i < weak.length - 1 ? ", " : "."}
                </span>
              ))}
            </>
          ) : (
            t("stats.notEnough")
          )}
        </p>
        <KeyboardHeatmap stats={keys} />
      </section>

      <section className="mt-14" aria-labelledby="books-heading">
        <h2 id="books-heading" className="mb-5 font-serif text-2xl">{t("stats.books")}</h2>
        {books.length === 0 ? (
          <p className="text-muted">
            {t("stats.noBooks")}{" "}
            <Link href="/library" className="text-accent underline-offset-4 hover:underline">
              {t("stats.pickOne")}
            </Link>
            .
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs uppercase tracking-wider text-muted">
                  <th className="py-2 pr-4 font-normal">{t("stats.colTitle")}</th>
                  <th className="py-2 pr-4 font-normal">{t("stats.colPages")}</th>
                  <th className="w-40 py-2 pr-4 font-normal">{t("stats.colProgress")}</th>
                  <th className="py-2 pr-4 text-right font-normal">{t("stats.colWpm")}</th>
                  <th className="py-2 text-right font-normal">{t("stats.colTime")}</th>
                </tr>
              </thead>
              <tbody>
                {books.map((b) => {
                  const done = Math.min(b.page, b.totalPages);
                  const pct = b.totalPages ? (done / b.totalPages) * 100 : 0;
                  return (
                    <tr key={b.bookKey} className="border-b border-line/60">
                      <td className="max-w-[260px] py-3 pr-4">
                        <Link href={bookHref(b.bookKey)} className="block truncate font-serif hover:text-accent">
                          {b.title}
                        </Link>
                        <span className="block truncate text-xs text-muted">{b.author}</span>
                      </td>
                      <td className="py-3 pr-4 tabular-nums text-muted">
                        {done} / {b.totalPages}
                      </td>
                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-2">
                          <div className="h-1 flex-1 overflow-hidden rounded-full bg-line">
                            <div className="h-full bg-fg/70" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="w-10 text-right text-xs tabular-nums text-muted">{pct.toFixed(pct < 10 ? 1 : 0)}%</span>
                        </div>
                      </td>
                      <td className="py-3 pr-4 text-right tabular-nums">{b.stats.pages ? Math.round(b.stats.avgWpm) : "—"}</td>
                      <td className="py-3 text-right tabular-nums text-muted">{b.stats.pages ? formatDuration(b.stats.timeMs) : "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}

function Tile({ label, value, unit, note }: { label: string; value: string; unit?: string; note?: string }) {
  return (
    <div className="bg-bg p-5">
      <p className="text-xs uppercase tracking-wider text-muted">{label}</p>
      <p className="mt-2 font-serif text-3xl tabular-nums">
        {value}
        {unit && <span className="ml-1 font-sans text-sm text-muted">{unit}</span>}
      </p>
      {note && <p className="mt-1 text-xs text-muted">{note}</p>}
    </div>
  );
}
