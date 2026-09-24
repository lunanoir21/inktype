import "server-only";
import { createHash, randomBytes, scrypt as scryptCb, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { cookies } from "next/headers";
import { db } from "./db";

const scrypt = promisify(scryptCb) as (pw: string, salt: Buffer, len: number) => Promise<Buffer>;

export const SESSION_COOKIE = "inktype_session";
const SESSION_DAYS = 90;

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const hash = await scrypt(password, salt, 64);
  return `scrypt$${salt.toString("base64")}$${hash.toString("base64")}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [scheme, saltB64, hashB64] = stored.split("$");
  if (scheme !== "scrypt" || !saltB64 || !hashB64) return false;
  const expected = Buffer.from(hashB64, "base64");
  const actual = await scrypt(password, Buffer.from(saltB64, "base64"), expected.length);
  return timingSafeEqual(expected, actual);
}

function tokenHash(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function createSession(userId: string): Promise<void> {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 86_400_000);
  await db.session.create({ data: { id: tokenHash(token), userId, expiresAt } });
  cookies().set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.COOKIE_SECURE === "true",
    path: "/",
    expires: expiresAt,
  });
}

export async function destroySession(): Promise<void> {
  const token = cookies().get(SESSION_COOKIE)?.value;
  if (token) await db.session.deleteMany({ where: { id: tokenHash(token) } });
  cookies().delete(SESSION_COOKIE);
}

export async function currentUser(): Promise<{ id: string; username: string } | null> {
  const token = cookies().get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const session = await db.session.findUnique({
    where: { id: tokenHash(token) },
    include: { user: { select: { id: true, username: true } } },
  });
  if (!session) return null;
  if (session.expiresAt < new Date()) {
    await db.session.delete({ where: { id: session.id } }).catch(() => undefined);
    return null;
  }
  return session.user;
}

export function validateCredentials(username: unknown, password: unknown): string | null {
  if (typeof username !== "string" || !/^[a-z0-9_-]{3,32}$/i.test(username)) {
    return "Username must be 3–32 characters: letters, numbers, - or _.";
  }
  if (typeof password !== "string" || password.length < 8 || password.length > 200) {
    return "Password must be at least 8 characters.";
  }
  return null;
}

/** Naive in-memory rate limiter for login/register attempts, per key. */
const attempts = new Map<string, { count: number; resetAt: number }>();

export function rateLimited(key: string, limit = 10, windowMs = 15 * 60_000): boolean {
  const now = Date.now();
  const entry = attempts.get(key);
  if (!entry || entry.resetAt < now) {
    attempts.set(key, { count: 1, resetAt: now + windowMs });
    return false;
  }
  entry.count++;
  return entry.count > limit;
}
