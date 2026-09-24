"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Reader } from "@/components/typing/reader";
import { Button } from "@/components/ui/button";
import { loadGutenbergBook, loadPgaBook, loadWikisourceWork, pagesFor, type LoadedBook } from "@/lib/books";
import { useStore } from "@/lib/store";
import { useHydrated } from "@/lib/use-hydrated";
import { useT } from "@/lib/i18n";
import type { MessageKey } from "@/lib/i18n/messages";

export default function ReadPage({ params }: { params: { source: string; id: string } }) {
  if (params.source === "gutenberg") return <GutenbergReader id={Number(params.id)} />;
  if (params.source === "custom") return <CustomReader id={params.id} />;
  if (params.source === "wikisource") return <WikisourceReader id={decodeURIComponent(params.id)} />;
  if (params.source === "pga") return <PgaReader id={params.id} />;
  notFound();
}

function GutenbergReader({ id }: { id: number }) {
  const hydrated = useHydrated();
  const [book, setBook] = useState<LoadedBook | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setBook(null);
    setError(null);
    loadGutenbergBook(id)
      .then((b) => !cancelled && setBook(b))
      .catch((e: unknown) => !cancelled && setError(e instanceof Error ? e.message : "Could not load this book."));
    return () => {
      cancelled = true;
    };
  }, [id]);

  const pages = useMemo(() => (book ? pagesFor(`gutenberg:${id}`, book.text) : null), [book, id]);

  useEffect(() => {
    if (book) document.title = `${book.title} · Inktype`;
  }, [book]);

  if (error) return <Message title="reader.wouldNotOpen" detail="reader.loadFailed" />;
  if (!book || !pages || !hydrated) return <Loading />;
  return (
    <Reader
      bookKey={`gutenberg:${id}`}
      source="gutenberg"
      title={book.title}
      author={book.author}
      pages={pages}
      language={book.language}
    />
  );
}

/** A Project Gutenberg Australia book; `id` is its seven-digit number. */
function PgaReader({ id }: { id: string }) {
  const hydrated = useHydrated();
  const [book, setBook] = useState<LoadedBook | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setBook(null);
    setError(false);
    loadPgaBook(id)
      .then((b) => !cancelled && setBook(b))
      .catch(() => !cancelled && setError(true));
    return () => {
      cancelled = true;
    };
  }, [id]);

  const pages = useMemo(() => (book ? pagesFor(`pga:${id}`, book.text) : null), [book, id]);

  useEffect(() => {
    if (book) document.title = `${book.title} · Inktype`;
  }, [book]);

  if (error) return <Message title="reader.wouldNotOpen" detail="reader.loadFailed" />;
  if (!book || !pages || !hydrated) return <Loading />;
  return (
    <Reader bookKey={`pga:${id}`} source="pga" title={book.title} author={book.author} pages={pages} language={book.language} />
  );
}

/** A Wikisource work; `id` is "<lang>:<page title>". */
function WikisourceReader({ id }: { id: string }) {
  const hydrated = useHydrated();
  const [lang, ...rest] = id.split(":");
  const title = rest.join(":");
  const [book, setBook] = useState<LoadedBook | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setBook(null);
    setError(null);
    loadWikisourceWork(lang ?? "tr", title)
      .then((b) => !cancelled && setBook(b))
      .catch((e: unknown) => !cancelled && setError(e instanceof Error ? e.message : "Could not load this work."));
    return () => {
      cancelled = true;
    };
  }, [lang, title]);

  const pages = useMemo(() => (book ? pagesFor(`wikisource:${id}`, book.text) : null), [book, id]);

  useEffect(() => {
    if (book) document.title = `${book.title} · Inktype`;
  }, [book]);

  if (error) return <Message title="reader.wouldNotOpen" detail="reader.loadFailed" />;
  if (!book || !pages || !hydrated) return <Loading />;
  if (pages.length === 0) return <Message title="reader.nothing" detail="reader.empty" />;
  return (
    <Reader
      bookKey={`wikisource:${id}`}
      source="wikisource"
      title={book.title}
      author={book.author}
      pages={pages}
      language={book.language}
    />
  );
}

function CustomReader({ id }: { id: string }) {
  const hydrated = useHydrated();
  const t = useT();
  const text = useStore((s) => s.data.customTexts.find((t) => t.id === id));
  const pages = useMemo(() => (text ? pagesFor(`custom:${id}:${text.updatedAt}`, text.body) : null), [text, id]);

  if (!hydrated) return <Loading />;
  if (!text || !pages) return <Message title="reader.notFound" detail="reader.deleted" />;
  if (pages.length === 0) return <Message title="reader.nothing" detail="reader.empty" />;
  return <Reader bookKey={`custom:${id}`} source="custom" title={text.title} author={t("reader.yourText")} pages={pages} />;
}

function Loading() {
  const t = useT();
  return (
    <main className="flex flex-1 items-center justify-center">
      <p className="animate-pulse font-serif text-xl italic text-muted">{t("reader.opening")}</p>
    </main>
  );
}

function Message({ title, detail }: { title: MessageKey; detail: MessageKey }) {
  const t = useT();
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
      <h1 className="font-serif text-2xl italic">{t(title)}</h1>
      <p className="text-sm text-muted">{t(detail)}</p>
      <Button asChild variant="outline" className="mt-4">
        <Link href="/library">{t("reader.back")}</Link>
      </Button>
    </main>
  );
}
