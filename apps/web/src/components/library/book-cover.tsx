"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

/**
 * A book cover. When the book has a real cover (served through our own
 * /api/covers proxy) it is shown; otherwise — and while it loads — a
 * typographic cover generated from the title stands in. The palette is a set
 * of muted cloth-binding colours.
 */
const BINDINGS = [
  ["#2f4a3a", "#e9e2cf"], // bottle green
  ["#6b2d2a", "#f0e4d4"], // oxblood
  ["#243b5a", "#e6e0d0"], // navy
  ["#5b4a2f", "#efe6d2"], // tobacco
  ["#3e3a4f", "#e8e3da"], // aubergine
  ["#7a5a2b", "#f5ecd8"], // ochre
  ["#2c4b52", "#e4e6dc"], // teal
  ["#4a2f3f", "#efe2e2"], // plum
  ["#1f2a2e", "#e2dccb"], // charcoal
  ["#8a4b32", "#f5e8da"], // terracotta
] as const;

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

export function BookCover({
  title,
  author,
  className,
  size = "md",
  src,
}: {
  title: string;
  author: string;
  className?: string;
  size?: "sm" | "md";
  /** Cover image URL; falls back to the typographic cover if missing. */
  src?: string;
}) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const [bg, fg] = BINDINGS[hash(title) % BINDINGS.length]!;
  const short = title.split(/[:;]| -- /)[0]!.trim();
  return (
    <div
      aria-hidden
      className={cn(
        "relative flex aspect-[2/3] flex-col justify-between overflow-hidden rounded-[3px] shadow-[inset_4px_0_0_rgba(0,0,0,0.18),0_1px_2px_rgba(0,0,0,0.12)]",
        size === "sm" ? "p-2" : "p-3.5",
        className,
      )}
      style={{ background: bg, color: fg }}
    >
      <div className="absolute inset-x-3 top-2.5 h-px opacity-40" style={{ background: fg }} />
      <p
        className={cn(
          "mt-2 line-clamp-5 font-serif font-medium leading-[1.15]",
          size === "sm" ? "text-[10px]" : short.length > 40 ? "text-[13px]" : "text-[15px]",
        )}
      >
        {short}
      </p>
      <p className={cn("smallcaps line-clamp-2 opacity-75", size === "sm" ? "text-[8px]" : "text-[10px]")}>{author}</p>
      <div className="absolute inset-x-3 bottom-2.5 h-px opacity-40" style={{ background: fg }} />
      {src && !failed && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt=""
          loading="lazy"
          decoding="async"
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
          className={cn(
            "absolute inset-0 h-full w-full object-cover transition-opacity duration-300",
            loaded ? "opacity-100" : "opacity-0",
          )}
        />
      )}
    </div>
  );
}
