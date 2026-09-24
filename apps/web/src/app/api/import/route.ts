import { NextResponse, type NextRequest } from "next/server";
import { importFromUrl } from "@/lib/import.server";

export const dynamic = "force-dynamic";

/** POST /api/import { url } — fetch a web page and strip it to readable text. */
export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as { url?: unknown } | null;
  if (typeof body?.url !== "string" || body.url.length > 2000) {
    return NextResponse.json({ error: "Please provide a URL." }, { status: 400 });
  }
  try {
    const page = await importFromUrl(body.url);
    if (page.text.trim().length < 20) {
      return NextResponse.json({ error: "No readable text found on that page." }, { status: 422 });
    }
    return NextResponse.json(page);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Import failed.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
