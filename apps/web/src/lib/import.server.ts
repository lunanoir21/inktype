import "server-only";
import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import { htmlToText } from "@inktype/core";

const MAX_BYTES = 5 * 1024 * 1024;
const MAX_REDIRECTS = 4;

/** Reject loopback, private, link-local and other non-public addresses (SSRF guard). */
export function isPrivateAddress(address: string): boolean {
  if (isIP(address) === 6) {
    const a = address.toLowerCase();
    if (a === "::1" || a === "::") return true;
    if (a.startsWith("fc") || a.startsWith("fd") || a.startsWith("fe80")) return true;
    const mapped = /^::ffff:(\d+\.\d+\.\d+\.\d+)$/.exec(a);
    return mapped ? isPrivateAddress(mapped[1]!) : false;
  }
  const [a = 0, b = 0] = address.split(".").map(Number);
  return (
    a === 0 || a === 10 || a === 127 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    a >= 224
  );
}

async function assertPublicUrl(url: URL): Promise<void> {
  if (url.protocol !== "http:" && url.protocol !== "https:") throw new Error("Only http(s) URLs are supported.");
  if (url.username || url.password) throw new Error("URLs with credentials are not supported.");
  const host = url.hostname.replace(/^\[|\]$/g, "");
  const addresses = isIP(host) ? [host] : (await lookup(host, { all: true })).map((r) => r.address);
  if (addresses.length === 0 || addresses.some(isPrivateAddress)) {
    throw new Error("That address is not reachable from this server.");
  }
}

async function readLimited(res: Response): Promise<string> {
  const reader = res.body?.getReader();
  if (!reader) return "";
  const chunks: Uint8Array[] = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > MAX_BYTES) {
      await reader.cancel();
      throw new Error("Page is too large to import.");
    }
    chunks.push(value);
  }
  return new TextDecoder().decode(Buffer.concat(chunks));
}

/** Fetch a public web page and return its readable text. */
export async function importFromUrl(input: string): Promise<{ title: string; text: string }> {
  let url = new URL(input);
  for (let i = 0; i <= MAX_REDIRECTS; i++) {
    await assertPublicUrl(url);
    const res = await fetch(url, {
      redirect: "manual",
      headers: { "User-Agent": "Inktype/0.1 (text import)", Accept: "text/html,text/plain" },
      signal: AbortSignal.timeout(15_000),
      cache: "no-store",
    });
    if (res.status >= 300 && res.status < 400) {
      const location = res.headers.get("location");
      if (!location) throw new Error("Broken redirect.");
      url = new URL(location, url);
      continue;
    }
    if (!res.ok) throw new Error(`The page responded with ${res.status}.`);
    const type = res.headers.get("content-type") ?? "";
    const body = await readLimited(res);
    if (type.includes("text/plain")) {
      return { title: url.pathname.split("/").pop() || url.hostname, text: body };
    }
    if (!type.includes("html")) throw new Error("Only HTML and plain-text pages can be imported.");
    const page = htmlToText(body);
    return { title: page.title || url.hostname, text: page.text };
  }
  throw new Error("Too many redirects.");
}
