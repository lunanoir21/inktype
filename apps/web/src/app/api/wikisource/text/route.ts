import { NextResponse, type NextRequest } from "next/server";
import { getWikisourceText } from "@/lib/wikisource.server";

export const dynamic = "force-dynamic";

/** GET /api/wikisource/text?lang=tr&title=… — the cleaned text of a work. */
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const title = sp.get("title") ?? "";
  if (!title || title.length > 300) return NextResponse.json({ error: "Missing title." }, { status: 400 });
  try {
    const work = await getWikisourceText(sp.get("lang") ?? "tr", title);
    return NextResponse.json(work, { headers: { "Cache-Control": "public, max-age=86400" } });
  } catch (err) {
    console.error(`[inktype] wikisource text error (${title})`, err);
    return NextResponse.json({ error: "Could not load this work." }, { status: 404 });
  }
}
