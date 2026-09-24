"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";
import { GENRES, LANGUAGES, TURKISH_AUTHORS, type CatalogPage } from "@/lib/catalog";
import { bookHref } from "@/lib/book-key";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { BookCard } from "./book-card";
import { useT } from "@/lib/i18n";
import type { MessageKey } from "@/lib/i18n/messages";

type Source = "gutenberg" | "wikisource";

interface ResultPage {
  items: Item[];
  hasNext: boolean;
}

/** Results already fetched this session, so going back or re-filtering is instant. */
const resultCache = new Map<string, Promise<ResultPage>>();

function fetchPage(source: Source, q: string, topic: string, language: string, page: number): Promise<ResultPage> {
  const key = [source, q, topic, language, page].join("|");
  const hit = resultCache.get(key);
  if (hit) return hit;
  const p = (async (): Promise<ResultPage> => {
    if (source === "wikisource") {
      const sp = new URLSearchParams({ lang: "tr", q: q || topic, page: String(page) });
      const res = await fetch(`/api/wikisource/search?${sp}`);
      if (!res.ok) throw new Error("failed");
      const json = (await res.json()) as { wikiBooks?: { title: string; author: string }[]; hasNext?: boolean };
      return {
        items: (json.wikiBooks ?? []).map((b) => ({ key: `wikisource:tr:${b.title}`, title: b.title, author: b.author })),
        hasNext: Boolean(json.hasNext),
      };
    }
    const sp = new URLSearchParams({ page: String(page) });
    if (q) sp.set("search", q);
    if (topic) sp.set("topic", topic);
    if (language) sp.set("language", language);
    const res = await fetch(`/api/books?${sp}`);
    if (!res.ok) throw new Error("failed");
    const json = (await res.json()) as CatalogPage;
    return {
      items: json.books.map((b) => ({ key: `gutenberg:${b.id}`, title: b.title, author: b.author })),
      hasNext: json.hasNext,
    };
  })();
  resultCache.set(key, p);
  p.catch(() => resultCache.delete(key));
  return p;
}

interface Item {
  key: string;
  title: string;
  author: string;
}

/**
 * Search and browse the libraries. Filters live in the URL so results are
 * linkable and survive reloads. Only the requested page of results is fetched,
 * and a book's text is downloaded only when it is opened.
 */
export function LibraryBrowser() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const source: Source = params.get("src") === "wikisource" ? "wikisource" : "gutenberg";
  const q = params.get("q") ?? "";
  const topic = params.get("genre") ?? "";
  const language = params.get("lang") ?? "";

  const [input, setInput] = useState(q);
  const [items, setItems] = useState<Item[]>([]);
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const requestId = useRef(0);
  const progress = useStore((s) => s.data.progress);
  const t = useT();

  useEffect(() => setInput(q), [q]);

  const setParams = useCallback(
    (patch: Record<string, string>) => {
      const next = new URLSearchParams(params.toString());
      for (const [key, value] of Object.entries(patch)) {
        if (value) next.set(key, value);
        else next.delete(key);
      }
      router.replace(`${pathname}${next.size ? `?${next}` : ""}`, { scroll: false });
    },
    [params, pathname, router],
  );

  // Debounce typing into the search box.
  useEffect(() => {
    if (input === q) return;
    const id = setTimeout(() => setParams({ q: input.trim() }), 300);
    return () => clearTimeout(id);
  }, [input, q, setParams]);

  const load = useCallback(
    async (pageNumber: number) => {
      const id = ++requestId.current;
      setLoading(true);
      setError(null);
      try {
        const { items: found, hasNext: more } = await fetchPage(source, q, topic, language, pageNumber);
        if (id !== requestId.current) return;
        setItems((prev) => {
          const merged = pageNumber === 1 ? found : [...prev, ...found];
          return merged.filter((b, i, all) => all.findIndex((x) => x.key === b.key) === i);
        });
        setHasNext(more);
        setPage(pageNumber);
        // Fetch the next page in the background so "More books" is instant.
        if (more) void fetchPage(source, q, topic, language, pageNumber + 1).catch(() => undefined);
      } catch (e) {
        if (id === requestId.current) setError(t("library.failed"));
      } finally {
        if (id === requestId.current) setLoading(false);
      }
    },
    [source, q, topic, language, t],
  );

  useEffect(() => {
    void load(1);
  }, [load]);

  const chips =
    source === "wikisource"
      ? TURKISH_AUTHORS.map((a) => ({ label: a, value: a }))
      : GENRES.map((g) => ({ label: t(`genre.${g.label}` as MessageKey), value: g.topic }));

  const heading = q
    ? t("library.results", { q })
    : topic
      ? (chips.find((c) => c.value === topic)?.label ?? t("library.books"))
      : source === "wikisource"
        ? "Ömer Seyfettin"
        : t("library.mostRead");

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-5 pb-16 sm:px-8">
      <div className="pb-6 pt-10 sm:pt-14">
        <h1 className="font-serif text-4xl tracking-tight sm:text-5xl">{t("library.title")}</h1>
        <p className="mt-3 max-w-xl text-muted">
          {source === "wikisource" ? t("library.wikisourceIntro") : t("library.gutenbergIntro")}{" "}
          {t("library.onDemand")}
        </p>
        <div className="mt-6 flex gap-1 border-b border-line" role="tablist" aria-label={t("library.title")}>
          {(
            [
              ["gutenberg", t("library.tabGutenberg")],
              ["wikisource", t("library.tabWikisource")],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={source === id}
              onClick={() => setParams({ src: id === "gutenberg" ? "" : id, genre: "", q: "", lang: "" })}
              className={cn(
                "-mb-px border-b-2 px-3 py-2 text-sm transition-colors",
                source === id ? "border-accent text-fg" : "border-transparent text-muted hover:text-fg",
              )}
              data-testid={`source-${id}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="sticky top-14 z-10 -mx-5 space-y-3 bg-bg/95 px-5 py-3 backdrop-blur sm:-mx-8 sm:px-8">
        <div className="flex gap-2">
          <label className="relative flex-1">
            <span className="sr-only">{t("library.searchLabel")}</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              type="search"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={source === "wikisource" ? t("library.searchWikisource") : t("library.search")}
              className="h-11 w-full rounded-lg border border-line bg-bg pl-9 pr-9 text-[15px] placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
              data-testid="library-search"
            />
            {input && (
              <button
                type="button"
                onClick={() => setInput("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted hover:text-fg"
                aria-label={t("library.clear")}
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </label>
          {source === "gutenberg" && (
            <select
              value={language}
              onChange={(e) => setParams({ lang: e.target.value })}
              aria-label={t("library.language")}
              className="h-11 rounded-lg border border-line bg-bg px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
            >
              <option value="">{t("library.allLanguages")}</option>
              {LANGUAGES.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.label}
                </option>
              ))}
            </select>
          )}
        </div>
        <div className="-mx-5 flex gap-1.5 overflow-x-auto px-5 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:px-0">
          <Chip active={!topic} onClick={() => setParams({ genre: "" })}>
            {t("library.all")}
          </Chip>
          {chips.map((c) => (
            <Chip key={c.value} active={topic === c.value} onClick={() => setParams({ genre: c.value, q: "" })}>
              {c.label}
            </Chip>
          ))}
        </div>
      </div>

      <h2 className="smallcaps mb-5 mt-6 text-sm text-muted">{heading}</h2>

      {error && (
        <div className="rounded-lg border border-line p-6 text-center">
          <p className="text-muted">{error}</p>
          <Button variant="outline" className="mt-4" onClick={() => void load(1)}>
            {t("library.tryAgain")}
          </Button>
        </div>
      )}

      {!error && !loading && items.length === 0 && (
        <p className="py-16 text-center font-serif text-xl italic text-muted">{t("library.none")}</p>
      )}

      <div className="grid grid-cols-3 gap-x-4 gap-y-7 sm:grid-cols-4 md:grid-cols-6" data-testid="library-results">
        {items.map((b) => {
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
        {loading &&
          Array.from({ length: items.length === 0 ? 12 : 6 }, (_, i) => (
            <div key={`s${i}`} aria-hidden>
              <div className="aspect-[2/3] animate-pulse rounded-[3px] bg-surface" />
              <div className="mt-2 h-3 w-4/5 animate-pulse rounded bg-surface" />
              <div className="mt-1.5 h-2.5 w-1/2 animate-pulse rounded bg-surface" />
            </div>
          ))}
      </div>

      {hasNext && !loading && !error && (
        <div className="mt-10 flex justify-center">
          <Button variant="outline" onClick={() => void load(page + 1)}>
            {t("library.more")}
          </Button>
        </div>
      )}
    </main>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "shrink-0 rounded-full border px-3 py-1 text-[13px] transition-colors",
        active ? "border-fg bg-fg text-bg" : "border-line text-muted hover:border-fg/40 hover:text-fg",
      )}
    >
      {children}
    </button>
  );
}
