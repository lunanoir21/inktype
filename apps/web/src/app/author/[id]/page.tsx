"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { BookCard } from "@/components/library/book-card";
import { Portrait, lifespan, type AuthorSummary } from "@/components/authors/author-card";
import { bookHref } from "@/lib/book-key";
import { useLocale, useT } from "@/lib/i18n";
import type { MessageKey } from "@/lib/i18n/messages";
import { useStore } from "@/lib/store";

interface Book {
  key: string;
  title: string;
  author: string;
}

interface AuthorResponse {
  author: AuthorSummary & { summary: string; wikipediaUrl: string | null };
  books: { gutenberg: Book[]; pga: Book[]; wikisource: Book[] };
}

const SHELVES: { id: keyof AuthorResponse["books"]; label: MessageKey; note?: MessageKey }[] = [
  { id: "gutenberg", label: "author.gutenberg" },
  { id: "wikisource", label: "author.wikisource" },
  { id: "pga", label: "author.pga", note: "author.pgaNote" },
];

/** An author's profile (from Wikidata and Wikipedia) and their books in every library. */
export default function AuthorPage({ params }: { params: { id: string } }) {
  const t = useT();
  const locale = useLocale();
  const progress = useStore((s) => s.data.progress);
  const [data, setData] = useState<AuthorResponse | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setData(null);
    setError(false);
    fetch(`/api/authors/${encodeURIComponent(params.id)}?lang=${locale}`)
      .then((r) => (r.ok ? (r.json() as Promise<AuthorResponse>) : Promise.reject()))
      .then((d) => !cancelled && setData(d))
      .catch(() => !cancelled && setError(true));
    return () => {
      cancelled = true;
    };
  }, [params.id, locale]);

  useEffect(() => {
    if (data) document.title = `${data.author.name} · Inktype`;
  }, [data]);

  if (error) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
        <h1 className="font-serif text-2xl italic">{t("author.notFound")}</h1>
        <Link href="/library" className="text-accent underline-offset-4 hover:underline">
          {t("reader.back")}
        </Link>
      </main>
    );
  }
  if (!data) {
    return (
      <main className="flex flex-1 items-center justify-center">
        <p className="animate-pulse font-serif text-xl italic text-muted">{t("author.loading")}</p>
      </main>
    );
  }

  const { author, books } = data;
  const total = books.gutenberg.length + books.pga.length + books.wikisource.length;

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-5 pb-20 sm:px-8">
      <Link href="/library" className="mt-8 inline-flex items-center gap-1.5 text-sm text-muted hover:text-fg">
        <ArrowLeft className="h-4 w-4" /> {t("nav.library")}
      </Link>

      <header className="mt-6 flex flex-col gap-6 border-b border-line pb-10 sm:flex-row sm:items-start">
        <Portrait src={author.portrait?.replace("w=240", "w=400") ?? null} name={author.name} className="h-32 w-32 sm:h-40 sm:w-40" />
        <div className="min-w-0 max-w-2xl">
          <h1 className="font-serif text-4xl tracking-tight sm:text-5xl" data-testid="author-name">
            {author.name}
          </h1>
          <p className="mt-2 text-sm tabular-nums text-muted">
            {[lifespan(author), author.description, total ? t("author.books", { n: total }) : null].filter(Boolean).join(" · ")}
          </p>
          {author.summary && <p className="mt-5 leading-relaxed text-fg/85">{author.summary}</p>}
          {author.wikipediaUrl && (
            <a
              href={author.wikipediaUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-4 inline-flex items-center gap-1.5 text-sm text-accent underline-offset-4 hover:underline"
            >
              {t("author.wikipedia")} <ExternalLink className="h-3.5 w-3.5" />
            </a>
          )}
        </div>
      </header>

      {total === 0 && <p className="py-16 text-center font-serif text-xl italic text-muted">{t("author.none")}</p>}

      {SHELVES.filter((s) => books[s.id].length > 0).map((shelf) => (
        <section key={shelf.id} className="mt-12" aria-labelledby={`shelf-${shelf.id}`}>
          <h2 id={`shelf-${shelf.id}`} className="smallcaps text-sm text-muted">
            {t(shelf.label)} · {books[shelf.id].length}
          </h2>
          {shelf.note && <p className="mt-1 text-xs text-muted">{t(shelf.note)}</p>}
          <div className="mt-5 grid grid-cols-3 gap-x-4 gap-y-7 sm:grid-cols-4 md:grid-cols-6">
            {books[shelf.id].map((b) => {
              const p = progress[b.key];
              return (
                <BookCard
                  key={b.key}
                  bookKey={b.key}
                  href={bookHref(b.key)}
                  title={b.title}
                  author={b.author}
                  progress={p && p.totalPages ? p.page / p.totalPages : undefined}
                />
              );
            })}
          </div>
        </section>
      ))}
    </main>
  );
}
