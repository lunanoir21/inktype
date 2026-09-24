import { NextResponse, type NextRequest } from "next/server";
import { searchWikisource } from "@/lib/wikisource.server";

export const dynamic = "force-dynamic";

/** GET /api/wikisource/search?lang=tr&q=&page= — literary works on Wikisource. */
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  try {
    const result = await searchWikisource(sp.get("lang") ?? "tr", sp.get("q") ?? "", Math.max(1, Number(sp.get("page")) || 1));
    return NextResponse.json(result, { headers: { "Cache-Control": "public, max-age=300" } });
  } catch (err) {
    console.error("[inktype] wikisource search error", err);
    return NextResponse.json({ error: "Wikisource is unreachable right now." }, { status: 502 });
  }
}
