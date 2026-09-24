import { NextResponse, type NextRequest } from "next/server";
import { searchCatalog } from "@/lib/catalog.server";
import { fold, pgaFindWork } from "@/lib/pga.server";
import { searchAuthors, searchWorks } from "@/lib/wikidata.server";

export const dynamic = "force-dynamic";

/** A short, accent-free query: the distinctive title words plus the author's surname. */
function gutenbergQuery(title: string, author?: string): string {
  const stop = new Set(["the", "a", "an", "les", "la", "le", "der", "die", "das", "of", "and"]);
  const words = fold(title).split(" ").filter((w) => !stop.has(w)).slice(0, 4);
  return [...words, fold(author ?? "").split(" ").at(-1) ?? ""].join(" ").trim();
}

export interface DiscoverBook {
  key: string;
  title: string;
  author: string;
  /** Where the book comes from, shown as a small label. */
  source: "gutenberg" | "pga";
}

/**
 * GET /api/discover?q=&lang= — what a free-text query means beyond a plain
 * title match: matching authors (for profile cards) and works found through
 * their title in any language ("Hayvan Çiftliği" → Animal Farm), looked up on
 * Project Gutenberg and Project Gutenberg Australia.
 */
export async function GET(req: NextRequest) {
  const q = (req.nextUrl.searchParams.get("q") ?? "").trim();
  const lang = req.nextUrl.searchParams.get("lang") === "tr" ? "tr" : "en";
  if (q.length < 2) return NextResponse.json({ authors: [], books: [] });

  const [authors, works] = await Promise.all([
    searchAuthors(q, lang).catch(() => []),
    searchWorks(q, lang).catch(() => []),
  ]);

  const books: DiscoverBook[] = [];
  await Promise.all(
    works.slice(0, 2).map(async (work) => {
      const author = work.author?.nameEn;
      const [pga, gutenberg] = await Promise.all([
        pgaFindWork(work.titleEn, author).catch(() => []),
        // The English title often finds the Gutenberg edition of a translated query.
        work.titleEn.toLowerCase() !== q.toLowerCase()
          ? searchCatalog({ search: gutenbergQuery(work.titleEn, author) }).catch(() => null)
          : Promise.resolve(null),
      ]);
      for (const b of pga) books.push({ key: `pga:${b.id}`, title: b.title, author: b.author, source: "pga" });
      for (const b of gutenberg?.books.slice(0, 4) ?? []) {
        books.push({ key: `gutenberg:${b.id}`, title: b.title, author: b.author, source: "gutenberg" });
      }
    }),
  );

  const unique = books.filter((b, i) => books.findIndex((x) => x.key === b.key) === i);
  // Only show authors whose name actually contains a word of the query.
  const words = fold(q).split(" ").filter((w) => w.length > 2);
  const named = authors.filter((a) => words.some((w) => fold(`${a.name} ${a.nameEn}`).includes(w)));
  return NextResponse.json(
    { authors: named.slice(0, 4), books: unique },
    { headers: { "Cache-Control": "public, max-age=600" } },
  );
}
