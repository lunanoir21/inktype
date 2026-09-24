import { NextResponse, type NextRequest } from "next/server";
import { emptyData, mergeData, sanitizeData } from "@inktype/core";
import { currentUser } from "@/lib/auth.server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

const MAX_BODY = 20 * 1024 * 1024;

async function load(userId: string) {
  const row = await db.syncData.findUnique({ where: { userId } });
  return row ? sanitizeData(JSON.parse(row.data)) : emptyData();
}

/** GET /api/sync — the server copy of the signed-in reader's data. */
export async function GET() {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  return NextResponse.json(await load(user.id));
}

/**
 * POST /api/sync — merge this device's data with the server copy and return
 * the merged result. The merge is commutative, so devices converge.
 */
export async function POST(req: NextRequest) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  const raw = await req.text();
  if (raw.length > MAX_BODY) return NextResponse.json({ error: "Payload too large." }, { status: 413 });

  let incoming;
  try {
    incoming = sanitizeData(JSON.parse(raw));
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }
  const merged = mergeData(await load(user.id), incoming);
  const data = JSON.stringify(merged);
  await db.syncData.upsert({
    where: { userId: user.id },
    create: { userId: user.id, data },
    update: { data },
  });
  return NextResponse.json(merged);
}
