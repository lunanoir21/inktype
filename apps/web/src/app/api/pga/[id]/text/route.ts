import { NextResponse } from "next/server";
import { getPgaText } from "@/lib/pga.server";

export const dynamic = "force-dynamic";

/** GET /api/pga/:id/text — a Project Gutenberg Australia book's cleaned text. */
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    const book = await getPgaText(params.id);
    return NextResponse.json(book, { headers: { "Cache-Control": "public, max-age=31536000, immutable" } });
  } catch (err) {
    console.error(`[inktype] PGA ${params.id} text error`, err);
    return NextResponse.json({ error: "Could not load this book." }, { status: 404 });
  }
}
