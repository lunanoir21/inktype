"use client";

import Link from "next/link";
import { useState } from "react";
import { cn } from "@/lib/utils";

export interface AuthorSummary {
  id: string;
  name: string;
  description: string;
  born: number | null;
  died: number | null;
  portrait: string | null;
}

export function lifespan(a: Pick<AuthorSummary, "born" | "died">): string {
  if (a.born === null && a.died === null) return "";
  return `${a.born ?? "?"}–${a.died ?? ""}`;
}

/** Round portrait with an initial as fallback. */
export function Portrait({ src, name, className }: { src: string | null; name: string; className?: string }) {
  const [failed, setFailed] = useState(false);
  return (
    <span className={cn("relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-surface", className)}>
      <span aria-hidden className="font-serif text-lg text-muted">
        {name.trim()[0]}
      </span>
      {src && !failed && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt=""
          loading="lazy"
          onError={() => setFailed(true)}
          className="absolute inset-0 h-full w-full object-cover grayscale-[20%]"
        />
      )}
    </span>
  );
}

/** Compact author profile shown above search results. */
export function AuthorCard({ author }: { author: AuthorSummary }) {
  return (
    <Link
      href={`/author/${author.id}`}
      className="group flex min-w-[240px] items-center gap-3 rounded-xl border border-line bg-surface/40 p-3 transition-colors hover:border-accent/50"
      data-testid="author-card"
    >
      <Portrait src={author.portrait} name={author.name} className="h-14 w-14" />
      <span className="min-w-0">
        <span className="block truncate font-serif text-base group-hover:text-accent">{author.name}</span>
        <span className="block text-xs tabular-nums text-muted">{lifespan(author)}</span>
        {author.description && <span className="block truncate text-xs text-muted">{author.description}</span>}
      </span>
    </Link>
  );
}
