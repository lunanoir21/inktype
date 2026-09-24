import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { createSession, rateLimited, verifyPassword } from "@/lib/auth.server";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  if (rateLimited(`login:${ip}`)) {
    return NextResponse.json({ error: "Too many attempts. Try again later." }, { status: 429 });
  }
  const { username, password } = ((await req.json().catch(() => ({}))) ?? {}) as Record<string, unknown>;
  if (typeof username !== "string" || typeof password !== "string") {
    return NextResponse.json({ error: "Missing username or password." }, { status: 400 });
  }
  const user = await db.user.findUnique({ where: { username: username.toLowerCase() } });
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return NextResponse.json({ error: "Wrong username or password." }, { status: 401 });
  }
  await createSession(user.id);
  return NextResponse.json({ user: { id: user.id, username: user.username } });
}
