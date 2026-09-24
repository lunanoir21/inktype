import "server-only";
import { swrCache } from "./swr-cache.server";

/**
 * Wikidata gives Inktype two things:
 *
 * 1. Multilingual search. "Hayvan Çiftliği" or "Suç ve Ceza" are resolved to
 *    the work and its original title ("Animal Farm", "Crime and Punishment")
 *    and author, so a Turkish query finds the English Gutenberg edition.
 * 2. Author profiles: portrait, life dates, a short description, the
 *    Project Gutenberg author id (P1938) and a Wikipedia summary.
 */

const API = "https://www.wikidata.org/w/api.php";
const USER_AGENT = "InktypeBot/0.1 (https://github.com/lunanoir21/inktype; open-source typing practice)";

/** Occupations that make someone an author worth showing. */
const WRITER_OCCUPATIONS = [
  "Q36180", // writer
  "Q49757", // poet
  "Q6625963", // novelist
  "Q4853732", // children's writer
  "Q214917", // playwright
  "Q1930187", // journalist
  "Q11774202", // essayist
  "Q18814623", // autobiographer
  "Q482980", // author
];

interface Claim {
  mainsnak: { datavalue?: { value: unknown } };
}

interface Entity {
  id: string;
  labels?: Record<string, { value: string }>;
  descriptions?: Record<string, { value: string }>;
  claims?: Record<string, Claim[]>;
  sitelinks?: Record<string, { title: string }>;
}

async function call<T>(params: Record<string, string>): Promise<T> {
  const url = `${API}?${new URLSearchParams({ format: "json", formatversion: "2", ...params })}`;
  const res = await fetch(url, {
    headers: { "User-Agent": USER_AGENT, "Api-User-Agent": USER_AGENT },
    signal: AbortSignal.timeout(12_000),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Wikidata responded ${res.status}`);
  return (await res.json()) as T;
}

function values(e: Entity, prop: string): unknown[] {
  return (e.claims?.[prop] ?? []).map((c) => c.mainsnak.datavalue?.value).filter((v) => v !== undefined);
}

function label(e: Entity, lang: string): string {
  return e.labels?.[lang]?.value ?? e.labels?.en?.value ?? e.labels?.[Object.keys(e.labels ?? {})[0] ?? ""]?.value ?? e.id;
}

function year(e: Entity, prop: string): number | null {
  const v = values(e, prop)[0] as { time?: string } | undefined;
  const m = v?.time ? /^([+-]\d+)-/.exec(v.time) : null;
  return m ? Number(m[1]) : null;
}

/** Commons file name → our image proxy URL. */
export function portraitUrl(file: string | undefined, width = 240): string | null {
  return file ? `/api/image?${new URLSearchParams({ file, w: String(width) })}` : null;
}

async function entities(ids: string[], lang: string): Promise<Entity[]> {
  if (ids.length === 0) return [];
  const langs = [...new Set([lang, "en", "tr"])].join("|");
  const json = await call<{ entities: Record<string, Entity> }>({
    action: "wbgetentities",
    ids: ids.join("|"),
    props: "labels|descriptions|claims|sitelinks",
    languages: langs,
    sitefilter: [`${lang}wiki`, "enwiki", "trwiki", "trwikisource"].join("|"),
  });
  return ids.map((id) => json.entities[id]).filter((e): e is Entity => Boolean(e?.labels));
}

async function search(query: string, limit: number): Promise<string[]> {
  const json = await call<{ query?: { search?: { title: string }[] } }>({
    action: "query",
    list: "search",
    srsearch: query,
    srlimit: String(limit),
    srprop: "",
  });
  return (json.query?.search ?? []).map((s) => s.title);
}

export interface AuthorCard {
  id: string;
  name: string;
  /** English name, used to look the author up in English libraries. */
  nameEn: string;
  description: string;
  born: number | null;
  died: number | null;
  portrait: string | null;
  gutenbergId: string | null;
  /** Author page on Turkish Wikisource, if any (e.g. "Kişi:Ömer Seyfettin"). */
  wikisourcePage: string | null;
}

function toAuthor(e: Entity, lang: string): AuthorCard {
  return {
    id: e.id,
    name: label(e, lang),
    nameEn: label(e, "en"),
    description: e.descriptions?.[lang]?.value ?? e.descriptions?.en?.value ?? "",
    born: year(e, "P569"),
    died: year(e, "P570"),
    portrait: portraitUrl(values(e, "P18")[0] as string | undefined),
    gutenbergId: (values(e, "P1938")[0] as string | undefined) ?? null,
    wikisourcePage: e.sitelinks?.trwikisource?.title ?? null,
  };
}

export interface WorkMatch {
  id: string;
  /** Title in the reader's language. */
  title: string;
  /** Title in English (what Gutenberg and PG Australia use). */
  titleEn: string;
  author: AuthorCard | null;
}

const cache = swrCache<unknown>("wikidata", { freshMs: 7 * 86_400_000, maxAgeMs: 30 * 86_400_000, max: 3000 });

/** Writers whose name matches the query. */
export function searchAuthors(query: string, lang: string): Promise<AuthorCard[]> {
  const q = query.replace(/["\\|]/g, " ").trim().slice(0, 80);
  return cache.get(`authors|${lang}|${q}`, async () => {
    const ids = await search(`${q} haswbstatement:P31=Q5 haswbstatement:${WRITER_OCCUPATIONS.map((o) => `P106=${o}`).join("|")}`, 6);
    return (await entities(ids, lang)).map((e) => toAuthor(e, lang));
  }) as Promise<AuthorCard[]>;
}

/** Literary works whose title (in any language) matches the query. */
export function searchWorks(query: string, lang: string): Promise<WorkMatch[]> {
  const q = query.replace(/["\\|]/g, " ").trim().slice(0, 80);
  return cache.get(`works|${lang}|${q}`, async () => {
    const works = await entities(await search(`${q} haswbstatement:P50`, 4), lang);
    const authorIds = [...new Set(works.map((w) => (values(w, "P50")[0] as { id?: string } | undefined)?.id).filter(Boolean))] as string[];
    const authors = new Map((await entities(authorIds, lang)).map((a) => [a.id, toAuthor(a, lang)]));
    return works.map((w) => {
      const authorId = (values(w, "P50")[0] as { id?: string } | undefined)?.id;
      return { id: w.id, title: label(w, lang), titleEn: label(w, "en"), author: (authorId && authors.get(authorId)) || null };
    });
  }) as Promise<WorkMatch[]>;
}

export interface AuthorProfile extends AuthorCard {
  summary: string;
  wikipediaUrl: string | null;
}

/** Full profile, with a short Wikipedia summary in the reader's language. */
export function getAuthor(id: string, lang: string): Promise<AuthorProfile | null> {
  if (!/^Q\d+$/.test(id)) return Promise.resolve(null);
  return cache.get(`author|${lang}|${id}`, async () => {
    const [e] = await entities([id], lang);
    if (!e) return null;
    const card = toAuthor(e, lang);
    const wiki = e.sitelinks?.[`${lang}wiki`] ? lang : e.sitelinks?.enwiki ? "en" : null;
    let summary = "";
    let wikipediaUrl: string | null = null;
    if (wiki) {
      const title = e.sitelinks![`${wiki}wiki`]!.title;
      wikipediaUrl = `https://${wiki}.wikipedia.org/wiki/${encodeURIComponent(title.replace(/ /g, "_"))}`;
      try {
        const res = await fetch(`https://${wiki}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`, {
          headers: { "User-Agent": USER_AGENT },
          signal: AbortSignal.timeout(10_000),
          cache: "no-store",
        });
        if (res.ok) summary = ((await res.json()) as { extract?: string }).extract ?? "";
      } catch {
        // A profile without a summary is still useful.
      }
    }
    return { ...card, summary, wikipediaUrl };
  }) as Promise<AuthorProfile | null>;
}
