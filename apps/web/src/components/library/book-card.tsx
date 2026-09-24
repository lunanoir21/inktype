"use client";

import Link from "next/link";
import { warmBook } from "@/lib/books";
import { BookCover } from "./book-cover";

export function BookCard({
  href,
  title,
  author,
  meta,
  progress,
  bookKey,
}: {
  href: string;
  title: string;
  author: string;
  meta?: string;
  /** 0..1 */
  progress?: number;
  /** Enables the real cover and pre-loading the text on hover. */
  bookKey?: string;
}) {
  const warm = () => bookKey && warmBook(bookKey);
  return (
    <Link
      href={href}
      className="group block rounded-sm focus-visible:outline-offset-4"
      data-testid="book-card"
      onMouseEnter={warm}
      onFocus={warm}
      onTouchStart={warm}
    >
      <BookCover
        src={bookKey ? coverUrl(bookKey) : undefined}
        title={title}
        author={author}
        className="transition-transform duration-200 group-hover:-translate-y-1"
      />
      {progress !== undefined && (
        <div className="mt-2 h-0.5 w-full overflow-hidden rounded-full bg-line">
          <div className="h-full bg-fg/70" style={{ width: `${Math.max(2, progress * 100)}%` }} />
        </div>
      )}
      <p className="mt-2 line-clamp-2 font-serif text-sm leading-snug">{title}</p>
      <p className="mt-0.5 line-clamp-1 text-xs text-muted">{author}</p>
      {meta && <p className="mt-0.5 text-[11px] text-muted">{meta}</p>}
    </Link>
  );
}

function coverUrl(bookKey: string): string | undefined {
  const m = /^gutenberg:(\d+)$/.exec(bookKey);
  return m ? `/api/covers/gutenberg/${m[1]}` : undefined;
}
