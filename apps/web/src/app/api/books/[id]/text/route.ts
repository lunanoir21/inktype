import { NextResponse } from "next/server";
import { getBookText } from "@/lib/gutenberg.server";

export const dynamic = "force-dynamic";

/** GET /api/books/:id/text — the cleaned full text of a Gutenberg book. */
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const id = Number(params.id);
  if (!Number.isInteger(id) || id <= 0 || id > 10_000_000) {
    return NextResponse.json({ error: "Invalid book id." }, { status: 400 });
  }
  try {
    const book = await getBookText(id);
    return NextResponse.json(book, {
      // Book texts never change: let browsers and the service worker keep them.
      headers: { "Cache-Control": "public, max-age=31536000, immutable" },
    });
  } catch (err) {
    console.error(`[inktype] book ${id} text error`, err);
    return NextResponse.json({ error: "Could not load this book." }, { status: 404 });
  }
}
