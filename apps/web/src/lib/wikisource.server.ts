import "server-only";
import { parse, type HTMLElement } from "node-html-parser";
import { db } from "./db";
import type { CatalogPage } from "./catalog";
import { swrCache } from "./swr-cache.server";

/**
 * Wikisource as a second library, starting with Turkish Vikikaynak
 * (tr.wikisource.org), since Project Gutenberg has no Turkish books.
 *
 * Search and texts are fetched on demand through the MediaWiki API — only the
 * work a reader opens is downloaded — and texts are cached in SQLite.
 */

const USER_AGENT = "InktypeBot/0.1 (https://github.com/lunanoir21/inktype; open-source typing practice)";
export const WIKISOURCE_PAGE_SIZE = 24;

interface WikiConfig {
  /** Only pages using this template are works (not indexes, author pages …). */
  workTemplate: string;
  /**
   * Root category of literature. Searching inside it (with all subcategories)
   * keeps out laws, indictments, speeches and other official documents.
   */
  literatureCategory: string;
  /** Namespace id of author pages. */
  authorNs: number;
}

export const WIKISOURCES: Record<string, WikiConfig> = {
  tr: { workTemplate: "Eser başlığı", literatureCategory: "Edebiyat", authorNs: 100 },
};

function api(lang: string): string {
  return `https://${lang}.wikisource.org/w/api.php`;
}

async function call<T>(lang: string, params: Record<string, string>): Promise<T> {
  const url = `${api(lang)}?${new URLSearchParams({ format: "json", formatversion: "2", ...params })}`;
  const res = await fetch(url, {
    headers: { "User-Agent": USER_AGENT, "Api-User-Agent": USER_AGENT },
    signal: AbortSignal.timeout(20_000),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Wikisource responded ${res.status}`);
  return (await res.json()) as T;
}

type WikiSearchResult = CatalogPage & { wikiBooks: WikiBook[] };
const searchCache = swrCache<WikiSearchResult>("wikisource-search", { freshMs: 24 * 3_600_000, maxAgeMs: 14 * 86_400_000, max: 1000 });

export interface WikiBook {
  title: string;
  author: string;
}

interface SearchResponse {
  query?: {
    pages?: { title: string; index?: number; links?: { title: string }[] }[];
  };
  continue?: { gsroffset?: number };
}

/** Search literary works. An empty query lists works by a well-known author. */
export async function searchWikisource(lang: string, query: string, page: number) {
  const config = WIKISOURCES[lang];
  if (!config) throw new Error("Unsupported Wikisource language");
  const q = query.replace(/["\\]/g, " ").trim().slice(0, 120) || "Ömer Seyfettin";
  const key = `${lang}|${q}|${page}`;
  return searchCache.get(key, () => runSearch(lang, config, q, page));
}

async function runSearch(lang: string, config: WikiConfig, q: string, page: number): Promise<WikiSearchResult> {
  const json = await call<SearchResponse>(lang, {
    action: "query",
    generator: "search",
    gsrsearch: `${q} hastemplate:"${config.workTemplate}" deepcat:"${config.literatureCategory}"`,
    gsrnamespace: "0",
    gsrlimit: String(WIKISOURCE_PAGE_SIZE),
    gsroffset: String((page - 1) * WIKISOURCE_PAGE_SIZE),
    prop: "links",
    plnamespace: String(config.authorNs),
    pllimit: "max",
  });
  const pages = (json.query?.pages ?? [])
    // Chapters of longer works are reached through their parent page.
    .filter((p) => !p.title.includes("/"))
    .sort((a, b) => (a.index ?? 0) - (b.index ?? 0));
  const wikiBooks: WikiBook[] = pages.map((p) => ({
    title: p.title,
    author: p.links?.[0]?.title.replace(/^[^:]+:/, "") ?? "Anonim",
  }));
  return { page, hasNext: json.continue?.gsroffset !== undefined, books: [], wikiBooks };
}

/** Warm the Wikisource search cache (default list and author shortcuts). */
export async function prewarmWikisource(authors: string[]): Promise<void> {
  for (const q of ["", ...authors]) {
    await searchWikisource("tr", q, 1).catch(() => undefined);
    await new Promise((r) => setTimeout(r, 250));
  }
}

/** Elements that are navigation, licensing or maintenance notices, not the work. */
const NOISE = [
  "#headerContainer",
  ".ws-noexport",
  ".noprint",
  ".searchaux",
  ".licenseContainer",
  "[class*=license]",
  // Maintenance/notice boxes: ambox, ombox, tmbox, imbox, cmbox …
  "[class*=mbox]",
  "table.plainlinks",
  ".sisterproject",
  ".noexcerpt",
  ".ws-summary",
  ".mw-cite-backlink",
  "ol.references",
  ".mw-references-wrap",
  "sup",
  ".reference",
  ".mw-editsection",
  "style",
  "script",
  "figure",
  ".thumb",
];

interface ParseResponse {
  parse?: { title: string; text: string };
  error?: { info: string };
}

/**
 * Paragraph-level safety net for boilerplate that slips through the HTML
 * filters (and for texts cached before a filter existed).
 */
const BOILERPLATE = [
  /Vikikaynak/i,
  /Wikisource/i,
  /elden geçirilmesi gerekmektedir/i,
  /yardım sayfasına bakabilirsiniz/i,
  /^Çevrimiçi kaynak/i,
  /^Kaynak:/i,
  /kamu malı/i,
  /public domain/i,
  /telif hakk/i,
  /^Bu (eser|hikâye|hikaye|şiir|metin).{0,80}(yayımlanmıştır|yazılmıştır|künyeli)/i,
  /^\d{3,4} yılında yazılmıştır/i,
  /bakınız\.?$/i,
  /^→/,
];

/** Sections that end the work: licence notes, references, footnotes. */
const TRAILING_SECTION =
  /^(Telif durumu:?|Kaynakça|Kaynaklar|Notlar|Dipnotlar|Açıklamalar|Lisans)$|^Bu maddede yer alan eserin telif/i;

/** Embedded-media boxes ("Harici dosya / Ses / Video …") and their captions. */
const MEDIA_LINE = /^(Harici dosya|Ses|Video|Resim|Görsel|Dinle)$|\((TRT )?Dinle\)|YouTube/i;

export function cleanWikisourceText(text: string): string {
  const paragraphs = text
    .replace(/\[\d+\]/g, "")
    .split(/\n{2,}/)
    .map((p) => p.trim());
  const end = paragraphs.findIndex((p) => TRAILING_SECTION.test(p));
  return (end === -1 ? paragraphs : paragraphs.slice(0, end))
    .filter((p) => /[\p{L}\p{N}]/u.test(p)) // drop decorative quote marks and rules
    .filter((p) => !(p.length < 200 && MEDIA_LINE.test(p)))
    .filter((p) => !(p.length < 400 && BOILERPLATE.some((re) => re.test(p))))
    .join("\n\n");
}

export function extractWikisourceHtml(html: string): { text: string; author: string | null } {
  const root = parse(html, { blockTextElements: { script: false, style: false } });
  const author = root.querySelector("#header_author_text")?.text.trim() || null;
  for (const selector of NOISE) root.querySelectorAll(selector).forEach((el: HTMLElement) => el.remove());
  const text = root.structuredText
    .replace(/\u00A0/g, " ")
    .replace(/[ \t]+/g, " ")
    .split("\n")
    .map((l) => l.trim())
    .join("\n")
    // structuredText separates block elements with single newlines; use blank
    // lines so each block becomes its own paragraph.
    .replace(/\n+/g, "\n\n")
    .trim();
  return { text: cleanWikisourceText(text), author };
}

async function parsePage(lang: string, title: string) {
  const json = await call<ParseResponse>(lang, { action: "parse", page: title, prop: "text", redirects: "1" });
  if (!json.parse) throw new Error(json.error?.info ?? "Work not found");
  return { title: json.parse.title, ...extractWikisourceHtml(json.parse.text) };
}

async function subpages(lang: string, title: string): Promise<string[]> {
  const json = await call<{ query?: { allpages?: { title: string }[] } }>(lang, {
    action: "query",
    list: "allpages",
    apprefix: `${title}/`,
    apnamespace: "0",
    aplimit: "100",
  });
  const collator = new Intl.Collator(lang, { numeric: true });
  return (json.query?.allpages ?? []).map((p) => p.title).sort(collator.compare);
}

export interface WikiText {
  key: string;
  title: string;
  author: string;
  language: string;
  text: string;
}

/** Full text of a work, joining its chapter subpages when it has them. */
export async function getWikisourceText(lang: string, title: string): Promise<WikiText> {
  if (!WIKISOURCES[lang]) throw new Error("Unsupported Wikisource language");
  const key = `${lang}:${title}`;
  const cached = await db.wikiText.findUnique({ where: { key } }).catch(() => null);
  if (cached) return { ...cached, text: cleanWikisourceText(cached.text) };

  const main = await parsePage(lang, title);
  const parts = [main.text];
  const chapters = await subpages(lang, main.title).catch(() => []);
  // Fetch chapters a few at a time to be gentle with the API.
  for (let i = 0; i < chapters.length; i += 8) {
    const batch = await Promise.all(chapters.slice(i, i + 8).map((c) => parsePage(lang, c).catch(() => null)));
    for (const chapter of batch) if (chapter?.text) parts.push(chapter.text);
  }

  const work: WikiText = {
    key,
    title: main.title,
    author: main.author ?? "Anonim",
    language: lang,
    text: parts.join("\n\n").trim(),
  };
  if (work.text.length < 20) throw new Error("This page has no readable text");
  await db.wikiText.upsert({ where: { key }, create: work, update: work }).catch((err: unknown) => {
    console.warn("[inktype] could not cache wikisource text:", err);
  });
  return work;
}
