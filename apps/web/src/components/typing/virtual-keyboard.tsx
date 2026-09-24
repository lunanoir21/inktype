"use client";

import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n";

/**
 * On-screen keyboard that highlights the next key (and Shift when needed).
 * US QWERTY for most books, Turkish Q for Turkish texts.
 */

type Layout = "us" | "tr";

const ROWS: Record<Layout, string[][]> = {
  us: [
    "`1234567890-=".split(""),
    "qwertyuiop[]\\".split(""),
    "asdfghjkl;'".split(""),
    "zxcvbnm,./".split(""),
  ],
  tr: [
    '"1234567890*-'.split(""),
    "qwertyuıopğü".split(""),
    "asdfghjklşi,".split(""),
    "<zxcvbnmöç.".split(""),
  ],
};

/** Shifted character → base key. */
const SHIFTED: Record<Layout, Record<string, string>> = {
  us: {
    "~": "`", "!": "1", "@": "2", "#": "3", $: "4", "%": "5", "^": "6", "&": "7", "*": "8", "(": "9", ")": "0",
    _: "-", "+": "=", "{": "[", "}": "]", "|": "\\", ":": ";", '"': "'", "<": ",", ">": ".", "?": "/",
  },
  tr: {
    é: '"', "!": "1", "'": "2", "^": "3", "+": "4", "%": "5", "&": "6", "/": "7", "(": "8", ")": "9", "=": "0",
    "?": "*", _: "-", ";": ",", ":": ".", ">": "<",
  },
};

function keyFor(ch: string | undefined, layout: Layout): { key: string | null; shift: boolean } {
  if (ch === undefined) return { key: null, shift: false };
  if (ch === " " || ch === "\n") return { key: ch === "\n" ? "enter" : "space", shift: false };
  if (SHIFTED[layout][ch]) return { key: SHIFTED[layout][ch]!, shift: true };
  if (layout === "tr") {
    if (ch === "I") return { key: "ı", shift: true };
    if (ch === "İ") return { key: "i", shift: true };
  }
  const lower = ch.toLocaleLowerCase(layout === "tr" ? "tr" : "en");
  return { key: lower, shift: lower !== ch };
}

export function VirtualKeyboard({ next, layout }: { next: string | undefined; layout: Layout }) {
  const { key, shift } = keyFor(next, layout);
  const t = useT();
  const cap = (label: string, id: string, className?: string) => (
    <div
      key={id}
      className={cn(
        "flex h-8 min-w-0 items-center justify-center rounded-md border text-[11px] transition-colors sm:h-9 sm:text-xs",
        key === id ? "border-accent bg-accent text-bg" : "border-line text-muted",
        className,
      )}
    >
      {label}
    </div>
  );
  return (
    <div className="mx-auto w-full max-w-2xl select-none space-y-1" aria-hidden data-testid="virtual-keyboard">
      {ROWS[layout].map((row, r) => (
        <div key={r} className="flex gap-1" style={{ paddingLeft: `${[0, 3, 5, 0][r]}%` }}>
          {r === 3 && cap("⇧", "shift-l", cn("w-[12%] shrink-0", shift && "border-accent bg-accent/30 text-fg"))}
          {row.map((k) => cap(k.toLocaleUpperCase(layout === "tr" ? "tr" : "en"), k, "flex-1"))}
          {r === 2 && cap("↵", "enter", "w-[10%] shrink-0")}
          {r === 3 && cap("⇧", "shift-r", cn("w-[12%] shrink-0", shift && "border-accent bg-accent/30 text-fg"))}
        </div>
      ))}
      <div className="flex justify-center">{cap(t("keyboard.space"), "space", "w-1/2")}</div>
    </div>
  );
}
