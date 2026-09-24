import { NextResponse, type NextRequest } from "next/server";
import { booksByGutenbergAuthor } from "@/lib/catalog.server";
import { pgaBooksByAuthor } from "@/lib/pga.server";
import { getAuthor } from "@/lib/wikidata.server";
import { searchWikisource } from "@/lib/wikisource.server";

export const dynamic = "force-dynamic";

/** GET /api/authors/:wikidataId?lang= — author profile and their books in every library. */
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const lang = req.nextUrl.searchParams.get("lang") === "tr" ? "tr" : "en";
  const author = await getAuthor(params.id, lang).catch(() => null);
  if (!author) return NextResponse.json({ error: "Author not found." }, { status: 404 });

  const [gutenberg, pga, wikisource] = await Promise.all([
    author.gutenbergId ? booksByGutenbergAuthor(author.gutenbergId).catch(() => []) : Promise.resolve([]),
    pgaBooksByAuthor(author.nameEn).catch(() => []),
    author.wikisourcePage || lang === "tr"
      ? searchWikisource("tr", author.name, 1).catch(() => null)
      : Promise.resolve(null),
  ]);

  // Wikisource search is full-text; keep works actually attributed to this author.
  const surname = author.name.split(" ").at(-1)?.toLocaleLowerCase("tr") ?? "";
  const ws = (wikisource?.wikiBooks ?? []).filter((b) => b.author.toLocaleLowerCase("tr").includes(surname));

  return NextResponse.json(
    {
      author,
      books: {
        gutenberg: gutenberg.map((b) => ({ key: `gutenberg:${b.id}`, title: b.title, author: b.author })),
        pga: pga.map((b) => ({ key: `pga:${b.id}`, title: b.title, author: b.author })),
        wikisource: ws.map((b) => ({ key: `wikisource:tr:${b.title}`, title: b.title, author: b.author })),
      },
    },
    { headers: { "Cache-Control": "public, max-age=3600" } },
  );
}
