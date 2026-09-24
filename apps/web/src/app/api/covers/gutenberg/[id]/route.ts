import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

const MIRROR = (process.env.GUTENBERG_MIRROR ?? "https://www.gutenberg.org").replace(/\/$/, "");
const IMMUTABLE = "public, max-age=31536000, immutable";

/**
 * GET /api/covers/gutenberg/:id — a book's cover image, fetched from Project
 * Gutenberg on first request and served from SQLite afterwards.
 */
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const id = Number(params.id);
  if (!Number.isInteger(id) || id <= 0 || id > 10_000_000) return new NextResponse(null, { status: 400 });
  const key = `gutenberg:${id}`;

  const cached = await db.cover.findUnique({ where: { key } }).catch(() => null);
  if (cached) {
    if (cached.data.length === 0) return new NextResponse(null, { status: 404, headers: { "Cache-Control": "public, max-age=86400" } });
    return new NextResponse(new Uint8Array(cached.data), { headers: { "Content-Type": cached.type, "Cache-Control": IMMUTABLE } });
  }

  try {
    const res = await fetch(`${MIRROR}/cache/epub/${id}/pg${id}.cover.medium.jpg`, {
      headers: { "User-Agent": "Inktype/0.1 (+https://github.com/lunanoir21/inktype)" },
      signal: AbortSignal.timeout(15_000),
      cache: "no-store",
    });
    const type = res.headers.get("content-type") ?? "";
    if (!res.ok || !type.startsWith("image/")) {
      await db.cover.create({ data: { key, type: "none", data: Buffer.alloc(0) } }).catch(() => undefined);
      return new NextResponse(null, { status: 404, headers: { "Cache-Control": "public, max-age=86400" } });
    }
    const data = Buffer.from(await res.arrayBuffer());
    if (data.length > 2_000_000) return new NextResponse(null, { status: 404 });
    await db.cover.upsert({ where: { key }, create: { key, type, data }, update: { type, data } }).catch(() => undefined);
    return new NextResponse(new Uint8Array(data), { headers: { "Content-Type": type, "Cache-Control": IMMUTABLE } });
  } catch {
    // Network trouble: don't remember the failure.
    return new NextResponse(null, { status: 504 });
  }
}
