import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * GET /api/image?file=<Commons file name>&w=240 — an author portrait from
 * Wikimedia Commons, fetched once and served from SQLite, so readers' browsers
 * never contact third parties.
 */
export async function GET(req: NextRequest) {
  const file = req.nextUrl.searchParams.get("file") ?? "";
  const width = Math.min(480, Math.max(64, Number(req.nextUrl.searchParams.get("w")) || 240));
  if (!file || file.length > 300 || /[/\\]/.test(file)) return new NextResponse(null, { status: 400 });
  const key = `commons:${width}:${file}`;

  const cached = await db.cover.findUnique({ where: { key } }).catch(() => null);
  if (cached) {
    if (cached.data.length === 0) return new NextResponse(null, { status: 404 });
    return new NextResponse(new Uint8Array(cached.data), {
      headers: { "Content-Type": cached.type, "Cache-Control": "public, max-age=31536000, immutable" },
    });
  }
  try {
    const url = `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(file)}?width=${width}`;
    const res = await fetch(url, {
      headers: { "User-Agent": "InktypeBot/0.1 (https://github.com/lunanoir21/inktype)" },
      signal: AbortSignal.timeout(15_000),
      cache: "no-store",
    });
    const type = res.headers.get("content-type") ?? "";
    // Only follow redirects that stay on Wikimedia's upload server.
    if (!res.ok || !type.startsWith("image/") || !new URL(res.url).hostname.endsWith("wikimedia.org")) {
      await db.cover.create({ data: { key, type: "none", data: Buffer.alloc(0) } }).catch(() => undefined);
      return new NextResponse(null, { status: 404 });
    }
    const data = Buffer.from(await res.arrayBuffer());
    if (data.length > 3_000_000) return new NextResponse(null, { status: 404 });
    await db.cover.upsert({ where: { key }, create: { key, type, data }, update: { type, data } }).catch(() => undefined);
    return new NextResponse(new Uint8Array(data), {
      headers: { "Content-Type": type, "Cache-Control": "public, max-age=31536000, immutable" },
    });
  } catch {
    return new NextResponse(null, { status: 504 });
  }
}
