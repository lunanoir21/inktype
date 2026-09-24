/**
 * Minimal, dependency-free HTML → readable text conversion, used when a reader
 * imports a custom text from a URL. It is not a full readability engine; it
 * prefers <article>/<main> content, drops non-content elements and keeps
 * paragraph structure.
 */

const NAMED_ENTITIES: Record<string, string> = {
  amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", ndash: "-", mdash: "--",
  hellip: "...", lsquo: "'", rsquo: "'", ldquo: '"', rdquo: '"', laquo: '"', raquo: '"',
  copy: "(c)", reg: "(R)", trade: "(TM)", deg: "°", eacute: "é", egrave: "è", agrave: "à",
  ccedil: "ç", uuml: "ü", ouml: "ö", auml: "ä", szlig: "ß", ntilde: "ñ", middot: "·",
};

export function decodeEntities(text: string): string {
  return text.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (whole, body: string) => {
    if (body[0] === "#") {
      const code = body[1]?.toLowerCase() === "x" ? parseInt(body.slice(2), 16) : parseInt(body.slice(1), 10);
      return Number.isFinite(code) && code > 0 && code < 0x110000 ? String.fromCodePoint(code) : whole;
    }
    return NAMED_ENTITIES[body.toLowerCase()] ?? whole;
  });
}

export interface ExtractedPage {
  title: string;
  text: string;
}

export function htmlToText(html: string): ExtractedPage {
  const title = decodeEntities(/<title[^>]*>([\s\S]*?)<\/title>/i.exec(html)?.[1] ?? "")
    .replace(/\s+/g, " ")
    .trim();

  let body = html;
  // Prefer the main content region when the page marks one.
  const region =
    /<article[\s>][\s\S]*<\/article>/i.exec(body)?.[0] ?? /<main[\s>][\s\S]*<\/main>/i.exec(body)?.[0];
  if (region) body = region;

  body = body
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(
      /<(script|style|noscript|svg|nav|header|footer|aside|form|button|iframe|template|figure|select)[\s\S]*?<\/\1>/gi,
      " ",
    )
    // Block-level elements become paragraph breaks.
    .replace(/<\/?(p|div|section|article|h[1-6]|li|blockquote|pre|tr|table|ul|ol|dd|dt)[^>]*>/gi, "\n\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "");

  const text = decodeEntities(body)
    .split(/\n\s*\n/)
    .map((p) => p.replace(/\s+/g, " ").trim())
    // Drop link-farm fragments: very short lines without sentence punctuation.
    .filter((p) => p.length > 40 || /[.!?:"]$/.test(p))
    .join("\n\n");

  return { title, text };
}
