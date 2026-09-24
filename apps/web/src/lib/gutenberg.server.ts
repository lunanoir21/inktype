import "server-only";
import { skipFrontMatter, stripGutenbergBoilerplate } from "@inktype/core";
import { db } from "./db";

const MIRROR = (process.env.GUTENBERG_MIRROR ?? "https://www.gutenberg.org").replace(/\/$/, "");
const USER_AGENT = "Inktype/0.1 (+https://github.com/lunanoir21/inktype)";

async function fetchWithTimeout(url: string, ms: number): Promise<Response> {
  return fetch(url, {
    signal: AbortSignal.timeout(ms),
    headers: { "User-Agent": USER_AGENT },
    cache: "no-store",
  });
}

export interface BookText {
  id: number;
  title: string;
  author: string;
  language: string;
  text: string;
}

/** Read "Title: …" style metadata from a Gutenberg header. */
function headerField(raw: string, field: string): string | undefined {
  const head = raw.slice(0, 6000);
  const match = new RegExp(`^${field}:\\s*(.+(?:\\n {2,}.+)*)`, "mi").exec(head);
  return match?.[1]?.replace(/\s+/g, " ").trim();
}

const LANGUAGE_CODES: Record<string, string> = {
  english: "en", french: "fr", german: "de", spanish: "es", italian: "it", portuguese: "pt",
  dutch: "nl", finnish: "fi", swedish: "sv", latin: "la", esperanto: "eo", danish: "da",
  norwegian: "no", polish: "pl", russian: "ru", greek: "el", chinese: "zh", japanese: "ja",
};

/**
 * Get the cleaned text of a book, from the SQLite cache or Project Gutenberg.
 */
export async function getBookText(id: number): Promise<BookText> {
  const cached = await db.bookText.findUnique({ where: { id } }).catch(() => null);
  if (cached) return cached;

  const urls = [
    `${MIRROR}/cache/epub/${id}/pg${id}.txt`,
    `${MIRROR}/files/${id}/${id}-0.txt`,
    `${MIRROR}/ebooks/${id}.txt.utf-8`,
  ];
  let raw: string | null = null;
  for (const url of urls) {
    try {
      const res = await fetchWithTimeout(url, 30_000);
      if (res.ok) {
        raw = await res.text();
        break;
      }
    } catch {
      // try the next URL
    }
  }
  if (raw === null) throw new Error("Book text not found");

  const languageName = headerField(raw, "Language")?.toLowerCase() ?? "english";
  const book: BookText = {
    id,
    title: headerField(raw, "Title") ?? `Book #${id}`,
    author: headerField(raw, "Author") ?? "Unknown",
    language: LANGUAGE_CODES[languageName.split(/[ ,;]/)[0] ?? ""] ?? languageName.slice(0, 2),
    text: skipFrontMatter(stripGutenbergBoilerplate(raw)),
  };
  if (book.text.length < 200) throw new Error("Book text is empty");

  await db.bookText.upsert({ where: { id }, create: book, update: book }).catch((err: unknown) => {
    console.warn("[inktype] could not cache book text:", err);
  });
  return book;
}
