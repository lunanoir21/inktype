import "server-only";
import { decodeEntities } from "@inktype/core";
import type { BookSummary, CatalogPage } from "./catalog";
import { swrCache } from "./swr-cache.server";

/**
 * Catalog search, proxied to Project Gutenberg's own OPDS search feed.
 *
 * Nothing is bulk-downloaded: each request fetches just the page of results
 * the reader asked for (25 books), sorted by popularity. Results are cached in
 * memory for an hour. The browser never talks to third parties directly.
 */

const MIRROR = (process.env.GUTENBERG_MIRROR ?? "https://www.gutenberg.org").replace(/\/$/, "");
const USER_AGENT = "Inktype/0.1 (+https://github.com/lunanoir21/inktype)";
export const PAGE_SIZE = 25;

const cache = swrCache<CatalogPage>("gutenberg-search", { freshMs: 24 * 3_600_000, maxAgeMs: 14 * 86_400_000, max: 2000 });

export interface CatalogQuery {
  search?: string;
  /** A Gutenberg query fragment for the genre, e.g. "s.horror". */
  topic?: string;
  /** ISO language code, e.g. "fr". */
  language?: string;
  page?: number;
}

/** Build Gutenberg's search syntax: free text plus s./l. prefixed filters. */
export function buildQuery(q: CatalogQuery): string {
  const parts: string[] = [];
  const search = (q.search ?? "").replace(/[^\p{L}\p{N}\s'.-]/gu, " ").trim().slice(0, 120);
  if (search) parts.push(search);
  if (q.topic && /^(s|bs)\.[\p{L}\s-]{2,40}$/u.test(q.topic)) parts.push(q.topic);
  if (q.language && /^[a-z]{2,3}$/.test(q.language)) parts.push(`l.${q.language}`);
  return parts.join(" ");
}

/** Parse the book entries out of an OPDS (Atom) feed. */
export function parseOpds(xml: string): { books: BookSummary[]; hasNext: boolean } {
  const books: BookSummary[] = [];
  for (const [, entry = ""] of xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)) {
    const id = /<id>[^<]*\/ebooks\/(\d+)\.opds<\/id>/.exec(entry)?.[1];
    if (!id) continue; // navigation entries ("Sort by…", "Authors") have no book id
    const title = decodeEntities(/<title>([^<]*)<\/title>/.exec(entry)?.[1] ?? "").trim();
    const author = decodeEntities(/<content type="text">([^<]*)<\/content>/.exec(entry)?.[1] ?? "").trim();
    if (!title) continue;
    books.push({
      id: Number(id),
      title,
      author: author || "Anonymous",
      languages: [],
      subjects: [],
      downloads: 0,
    });
  }
  return { books, hasNext: /<link[^>]+rel="next"/.test(xml) };
}

export async function searchCatalog(query: CatalogQuery): Promise<CatalogPage> {
  const page = Math.max(1, Math.min(query.page ?? 1, 400));
  const params = new URLSearchParams({ sort_order: "downloads" });
  const q = buildQuery(query);
  if (q) params.set("query", q);
  if (page > 1) params.set("start_index", String((page - 1) * PAGE_SIZE + 1));

  const key = params.toString();
  return cache.get(key, async () => {
    const res = await fetch(`${MIRROR}/ebooks/search.opds/?${key}`, {
      headers: { "User-Agent": USER_AGENT, Accept: "application/atom+xml" },
      signal: AbortSignal.timeout(20_000),
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`Gutenberg search responded ${res.status}`);
    const { books, hasNext } = parseOpds(await res.text());
    return { page, hasNext, books };
  });
}

/**
 * Warm the cache with what readers open first: the most-read list and every
 * genre. Runs once at server start, one request at a time.
 */
export async function prewarmCatalog(genres: string[]): Promise<void> {
  const queries: CatalogQuery[] = [{}, { page: 2 }, ...genres.map((topic) => ({ topic }))];
  for (const q of queries) {
    await searchCatalog(q).catch(() => undefined);
    await new Promise((r) => setTimeout(r, 250));
  }
}
