import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { createSession, hashPassword, rateLimited, validateCredentials } from "@/lib/auth.server";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  if (process.env.ALLOW_REGISTRATION === "false") {
    return NextResponse.json({ error: "Registration is disabled on this server." }, { status: 403 });
  }
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  if (rateLimited(`register:${ip}`, 5)) {
    return NextResponse.json({ error: "Too many attempts. Try again later." }, { status: 429 });
  }
  const { username, password } = ((await req.json().catch(() => ({}))) ?? {}) as Record<string, unknown>;
  const invalid = validateCredentials(username, password);
  if (invalid) return NextResponse.json({ error: invalid }, { status: 400 });

  const name = (username as string).toLowerCase();
  if (await db.user.findUnique({ where: { username: name } })) {
    return NextResponse.json({ error: "That username is taken." }, { status: 409 });
  }
  const user = await db.user.create({
    data: { username: name, passwordHash: await hashPassword(password as string) },
  });
  await createSession(user.id);
  return NextResponse.json({ user: { id: user.id, username: user.username } });
}
