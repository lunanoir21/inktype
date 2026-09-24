"use client";

import { useMemo, useState } from "react";
import type { SeriesPoint } from "@inktype/core";
import { useLocale, useT } from "@/lib/i18n";

const W = 720;
const H = 220;
const PAD = { top: 16, right: 12, bottom: 28, left: 36 };

/**
 * WPM over time as a simple SVG line. Periods without practice are left as
 * gaps in the line rather than drawn as zero.
 */
export function WpmChart({ points }: { points: SeriesPoint[] }) {
  const [hover, setHover] = useState<number | null>(null);
  const t = useT();
  const locale = useLocale();
  // Period labels in the reader's language (the key is the period start date).
  const label = (p: SeriesPoint) => {
    const d = new Date(`${p.key}T12:00:00`);
    const monthly = points.length > 1 && points[1]!.key.slice(8) === "01" && points[0]!.key.slice(8) === "01";
    return new Intl.DateTimeFormat(locale, monthly ? { month: "short", year: "2-digit" } : { month: "short", day: "numeric" }).format(d);
  };
  const active = points.filter((p) => p.pages > 0);
  const max = Math.max(40, ...active.map((p) => p.wpm));
  const yMax = Math.ceil(max / 20) * 20;
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;
  const x = (i: number) => PAD.left + (points.length === 1 ? innerW / 2 : (i / (points.length - 1)) * innerW);
  const y = (v: number) => PAD.top + innerH - (v / yMax) * innerH;

  // Split into runs of consecutive active periods.
  const segments = useMemo(() => {
    const runs: { i: number; p: SeriesPoint }[][] = [];
    let run: { i: number; p: SeriesPoint }[] = [];
    points.forEach((p, i) => {
      if (p.pages > 0) run.push({ i, p });
      else if (run.length) {
        runs.push(run);
        run = [];
      }
    });
    if (run.length) runs.push(run);
    return runs;
  }, [points]);

  const ticks = [0, yMax / 2, yMax];
  const labelEvery = Math.ceil(points.length / 7);
  const hovered = hover !== null ? points[hover] : undefined;

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="h-auto w-full overflow-visible"
        role="img"
        aria-label={t("stats.chartLabel", { wpm: Math.round(active.at(-1)?.wpm ?? 0) })}
        onMouseLeave={() => setHover(null)}
      >
        {ticks.map((t) => (
          <g key={t}>
            <line x1={PAD.left} x2={W - PAD.right} y1={y(t)} y2={y(t)} className="stroke-line" strokeWidth={1} />
            <text x={PAD.left - 8} y={y(t)} dy="0.32em" textAnchor="end" className="fill-muted text-[11px] tabular-nums">
              {t}
            </text>
          </g>
        ))}
        {points.map((p, i) =>
          i % labelEvery === 0 || (i === points.length - 1 && i % labelEvery > labelEvery / 2) ? (
            <text key={p.key} x={x(i)} y={H - 8} textAnchor="middle" className="fill-muted text-[11px]">
              {label(p)}
            </text>
          ) : null,
        )}
        {segments.map((run) => (
          <polyline
            key={run[0]!.p.key}
            points={run.map(({ i, p }) => `${x(i)},${y(p.wpm)}`).join(" ")}
            fill="none"
            className="stroke-fg"
            strokeWidth={2}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        ))}
        {active.length === 0 && (
          <text x={W / 2} y={H / 2} textAnchor="middle" className="fill-muted font-serif text-[15px] italic">
            {t("stats.emptyChart")}
          </text>
        )}
        {points.map((p, i) => (
          <g key={p.key}>
            {p.pages > 0 && (
              <circle cx={x(i)} cy={y(p.wpm)} r={hover === i ? 5 : 3} className="fill-bg stroke-fg" strokeWidth={2} />
            )}
            {/* Wide invisible hit area per period. */}
            <rect
              x={x(i) - innerW / points.length / 2}
              y={PAD.top}
              width={innerW / points.length}
              height={innerH}
              fill="transparent"
              onMouseEnter={() => setHover(i)}
            />
          </g>
        ))}
      </svg>
      {hovered && hovered.pages > 0 && (
        <div
          className="pointer-events-none absolute top-0 rounded-md border border-line bg-bg px-3 py-2 text-xs shadow-sm"
          style={{ left: `${(x(hover!) / W) * 100}%`, transform: "translateX(-50%)" }}
        >
          <p className="font-medium">{label(hovered)}</p>
          <p className="tabular-nums text-muted">
            <span className="text-fg">{Math.round(hovered.wpm)} wpm</span> · {Math.round(hovered.accuracy * 100)}% ·{" "}
            {hovered.pages} {hovered.pages === 1 ? t("stats.page") : t("stats.pagesUnit")}
          </p>
        </div>
      )}
    </div>
  );
}
