"use client";

import type { KeyStat } from "@inktype/core";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n";

const ROWS: { keys: string[]; indent: number }[] = [
  { keys: "`1234567890-=".split(""), indent: 0 },
  { keys: "qwertyuiop[]\\".split(""), indent: 0.5 },
  { keys: "asdfghjkl;'".split(""), indent: 0.75 },
  { keys: "zxcvbnm,./".split(""), indent: 1.25 },
];

/** Characters typed with Shift map to their base key on a US layout. */
const SHIFTED: Record<string, string> = {
  "~": "`", "!": "1", "@": "2", "#": "3", $: "4", "%": "5", "^": "6", "&": "7", "*": "8", "(": "9", ")": "0",
  _: "-", "+": "=", "{": "[", "}": "]", "|": "\\", ":": ";", '"': "'", "<": ",", ">": ".", "?": "/",
};

/** Fold per-character stats onto physical keys. */
function perKey(stats: Record<string, KeyStat>): Record<string, { hits: number; misses: number }> {
  const out: Record<string, { hits: number; misses: number }> = {};
  for (const s of Object.values(stats)) {
    const key = s.key === "space" ? "space" : (SHIFTED[s.key] ?? s.key);
    const entry = (out[key] ??= { hits: 0, misses: 0 });
    entry.hits += s.hits;
    entry.misses += s.misses;
  }
  return out;
}

/**
 * QWERTY keyboard shaded by error rate. Darker keys are the ones you miss most.
 */
export function KeyboardHeatmap({ stats }: { stats: Record<string, KeyStat> }) {
  const keys = perKey(stats);
  const t = useT();
  const rates = Object.values(keys)
    .filter((k) => k.hits + k.misses >= 5)
    .map((k) => k.misses / (k.hits + k.misses));
  const worst = Math.max(0.05, ...rates);

  const cell = (key: string, label: string, className?: string) => {
    const k = keys[key];
    const total = k ? k.hits + k.misses : 0;
    const rate = k && total >= 5 ? k.misses / total : 0;
    const intensity = rate / worst;
    return (
      <div
        key={key}
        title={
          total
            ? t("stats.keyTitle", { key: label, misses: k!.misses, total, rate: (rate * 100).toFixed(1) })
            : t("stats.noData", { key: label })
        }
        className={cn(
          "flex h-9 items-center justify-center rounded-md border text-xs uppercase sm:h-11 sm:text-sm",
          total ? "border-transparent" : "border-line text-muted/60",
          className,
        )}
        style={
          total
            ? {
                background: `rgb(var(--error) / ${0.06 + intensity * 0.6})`,
                color: intensity > 0.6 ? "rgb(var(--bg))" : undefined,
              }
            : undefined
        }
      >
        {label}
      </div>
    );
  };

  return (
    <div className="select-none space-y-1 sm:space-y-1.5" aria-label={t("stats.heatmap")} role="img">
      {ROWS.map((row, r) => (
        <div key={r} className="flex gap-1 sm:gap-1.5" style={{ paddingLeft: `${row.indent * 5}%` }}>
          {row.keys.map((k) => cell(k, k, "min-w-0 flex-1"))}
        </div>
      ))}
      <div className="flex justify-center">{cell("space", t("stats.space"), "w-1/2 normal-case")}</div>
      <div className="flex items-center justify-end gap-2 pt-2 text-[11px] text-muted">
        {t("stats.fewer")}
        <span className="h-2 w-20 rounded-full" style={{ background: "linear-gradient(to right, rgb(var(--error) / 0.06), rgb(var(--error) / 0.66))" }} />
        {t("stats.more")}
      </div>
    </div>
  );
}
