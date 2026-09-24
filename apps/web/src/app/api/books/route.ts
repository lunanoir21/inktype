import { NextResponse, type NextRequest } from "next/server";
import { searchCatalog } from "@/lib/catalog.server";

export const dynamic = "force-dynamic";

/** GET /api/books?search=&topic=&language=&page= — browse the Gutenberg catalog. */
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  try {
    const result = await searchCatalog({
      search: sp.get("search") ?? undefined,
      topic: sp.get("topic") ?? undefined,
      language: sp.get("language") ?? undefined,
      page: Number(sp.get("page") ?? "1") || 1,
    });
    return NextResponse.json(result, {
      headers: { "Cache-Control": "public, max-age=300, stale-while-revalidate=3600" },
    });
  } catch (err) {
    console.error("[inktype] catalog error", err);
    return NextResponse.json({ error: "The book catalog is unreachable right now." }, { status: 502 });
  }
}
