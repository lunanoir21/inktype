import "server-only";
import { htmlToText, skipFrontMatter } from "@inktype/core";
import { db } from "./db";
import { swrCache } from "./swr-cache.server";

/**
 * Project Gutenberg Australia (gutenberg.net.au) publishes books that are in
 * the public domain under "life + 70 years" rules — Orwell's Animal Farm and
 * Nineteen Eighty-Four, for example — which the US Project Gutenberg cannot.
 * Those books are public domain in Turkey, the EU and many other countries,
 * but not everywhere; readers should check their local law.
 *
 * PGA has no API. Its "plus fifty" author index (two HTML pages, metadata
 * only) is fetched when an author is looked up and cached; a book's text is
 * downloaded only when a reader opens it.
 */

const BASE = "https://gutenberg.net.au";
const USER_AGENT = "InktypeBot/0.1 (https://github.com/lunanoir21/inktype; open-source typing practice)";
const INDEX_PAGES = ["/plusfifty-a-m.html", "/plusfifty-n-z.html"];

export interface PgaBook {
  /** e.g. "0100011" (the folder, "ebooks01", is derived from the first two digits). */
  id: string;
  title: string;
  author: string;
}

interface AuthorSection {
  author: string;
  /** Normalised author heading, for matching. */
  key: string;
  books: PgaBook[];
}

const indexCache = swrCache<AuthorSection[]>("pga-index", { freshMs: 7 * 86_400_000, maxAgeMs: 60 * 86_400_000, max: 4 });

/** Lower-case, accent-free, letters and spaces only. */
export function fold(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/ı/g, "i")
    .replace(/[^a-z0-9 ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function strip(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&rsquo;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

/** Parse an index page into author sections with their text-format books. */
export function parsePgaIndex(html: string): AuthorSection[] {
  const sections: AuthorSection[] = [];
  // Each author section starts with an anchor, followed by the author's name
  // in bold (usually linked to their page): <a name="orwell"></a><a …><b>George ORWELL (1903-1950)</b></a>
  const parts = html.split(/(?=<a\s+(?:name|id)="?[\w.-]+"?[^>]*>\s*<\/a>)/i);
  for (const part of parts) {
    if (!/^<a\s+(?:name|id)=/i.test(part)) continue;
    const head = /<b>([\s\S]*?)<\/b>/i.exec(part.slice(0, 600));
    if (!head) continue;
    const author = strip(head[1] ?? "").replace(/\s*\(.*?\)\s*$/, "");
    if (!author) continue;
    const books: PgaBook[] = [];
    // Books are list items: "Title (1945)--<a href="/ebooks01/0100011.txt">Text</a>--<a …>HTML</a>…"
    for (const item of part.split(/<li[\s>]/i).slice(1)) {
      const link = /href="?\/?ebooks\d+\/(\d{7})h?\.(?:txt|html?)"?/i.exec(item);
      if (!link) continue;
      const title = strip(item.split(/<a\s/i)[0] ?? "")
        .replace(/[-–—\s]+$/, "")
        .replace(/\s*\((?:c\.\s*)?\d{4}[^)]*\)\s*$/, "")
        .trim();
      if (title) books.push({ id: link[1]!, title, author });
    }
    if (books.length) sections.push({ author, key: fold(author), books });
  }
  return sections;
}

async function fetchText(path: string, timeout = 30_000): Promise<string> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "User-Agent": USER_AGENT },
    signal: AbortSignal.timeout(timeout),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`PG Australia responded ${res.status}`);
  const bytes = new Uint8Array(await res.arrayBuffer());
  // PGA files are mostly Latin-1; use UTF-8 when it decodes cleanly.
  const utf8 = new TextDecoder("utf-8").decode(bytes);
  return utf8.includes("\uFFFD") ? new TextDecoder("latin1").decode(bytes) : utf8;
}

async function index(): Promise<AuthorSection[]> {
  return indexCache.get("all", async () => {
    const pages = await Promise.all(INDEX_PAGES.map((p) => fetchText(p, 45_000)));
    return pages.flatMap(parsePgaIndex);
  });
}

/** Books by an author, matched on surname (and first name when given). */
export async function pgaBooksByAuthor(name: string): Promise<PgaBook[]> {
  const words = fold(name).split(" ").filter((w) => w.length > 1);
  const surname = words.at(-1);
  if (!surname) return [];
  const sections = await index();
  const hits = sections.filter((s) => s.key.split(" ").includes(surname));
  // Prefer sections that also contain another part of the name.
  const best = hits.filter((s) => words.slice(0, -1).some((w) => s.key.includes(w)));
  return (best.length ? best : hits).flatMap((s) => s.books);
}

/** Books whose title matches (all words of) the given English title. */
export async function pgaFindWork(titleEn: string, authorEn?: string): Promise<PgaBook[]> {
  const want = fold(titleEn).split(" ").filter((w) => w.length > 2);
  if (want.length === 0) return [];
  const pool = authorEn ? await pgaBooksByAuthor(authorEn) : (await index()).flatMap((s) => s.books);
  return pool.filter((b) => {
    const t = fold(b.title);
    return want.every((w) => t.includes(w));
  });
}

function folder(id: string): string {
  return `ebooks${id.slice(0, 2)}`;
}

/** Remove the PGA licence header and trailer from a plain-text book. */
export function stripPgaBoilerplate(raw: string): string {
  let text = raw.replace(/\r\n?/g, "\n");
  const contact = /To contact Project Gutenberg of Australia[^\n]*\n/i.exec(text);
  if (contact) text = text.slice(contact.index + contact[0].length);
  // Repeated "Title: / Author:" lines right after the header.
  text = text.replace(/^\s*(Title|Author):[^\n]*\n/gim, (line, _k, offset: number) => (offset < 400 ? "" : line));
  text = text.replace(/\s*Project Gutenberg (of )?Australia\s*$/i, "").trim();
  return text;
}

export interface PgaText {
  id: string;
  title: string;
  author: string;
  language: string;
  text: string;
}

/** A PGA book's cleaned text (cached in SQLite after the first download). */
export async function getPgaText(id: string): Promise<PgaText> {
  if (!/^\d{7}$/.test(id)) throw new Error("Invalid id");
  const key = `pga:${id}`;
  const cached = await db.wikiText.findUnique({ where: { key } }).catch(() => null);
  if (cached) return { id, title: cached.title, author: cached.author, language: cached.language, text: cached.text };

  let raw: string;
  let html = false;
  try {
    raw = await fetchText(`/${folder(id)}/${id}.txt`);
  } catch {
    raw = await fetchText(`/${folder(id)}/${id}h.html`);
    html = true;
  }
  const field = (name: string) => new RegExp(`^\\s*${name}:\\s*(.+)$`, "mi").exec(raw.slice(0, 3000))?.[1]?.trim();
  const title = field("Title") ?? `PGA ${id}`;
  const author = (field("Author") ?? "Unknown").replace(/\s*\((pseudonym|\d{4}).*$/i, "").trim();
  const body = html ? htmlToText(raw).text : raw;
  const text = skipFrontMatter(stripPgaBoilerplate(body));
  if (text.length < 200) throw new Error("Book text is empty");
  const book = { id, title, author, language: (field("Language") ?? "English").slice(0, 2).toLowerCase(), text };
  const row = { title, author, language: book.language, text };
  await db.wikiText.upsert({ where: { key }, create: { key, ...row }, update: row }).catch(() => undefined);
  return book;
}
