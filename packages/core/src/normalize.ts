/**
 * Text normalization.
 *
 * Books (especially Project Gutenberg texts) are full of typographic characters
 * that nobody can type on a regular keyboard: curly quotes, em dashes, ellipses,
 * non-breaking spaces and so on. We map those to their plain-keyboard
 * equivalents so every character on a page is reachable.
 */

const REPLACEMENTS: Array<[RegExp, string]> = [
  [/[\u2018\u2019\u201A\u201B\u2032`\u00B4]/g, "'"], // single quotes, primes, backtick, acute
  [/[\u201C\u201D\u201E\u201F\u2033\u00AB\u00BB]/g, '"'], // double quotes, guillemets
  [/[\u2014\u2015]/g, "--"], // em dash, horizontal bar
  [/[\u2010\u2011\u2012\u2013\u2212]/g, "-"], // hyphens, en dash, minus
  [/\u2026/g, "..."], // ellipsis
  [/[\u00A0\u2000-\u200A\u202F\u205F\u3000]/g, " "], // exotic spaces
  [/[\u200B-\u200D\u2060\uFEFF\u00AD]/g, ""], // zero-width chars, soft hyphen
  [/\u00C6/g, "AE"],
  [/\u00E6/g, "ae"],
  [/\u0152/g, "OE"],
  [/\u0153/g, "oe"],
  [/\t/g, " "],
];

/**
 * Normalize typographic characters to keyboard-typeable ASCII equivalents.
 * Accented letters (é, ü, ç …) are deliberately kept: they are typeable on the
 * keyboards of readers of those languages.
 */
export function normalizeTypography(input: string): string {
  let text = input.normalize("NFC").replace(/\r\n?/g, "\n");
  for (const [pattern, replacement] of REPLACEMENTS) {
    text = text.replace(pattern, replacement);
  }
  return text;
}

/**
 * Collapse raw text into clean paragraphs.
 *
 * - Hard-wrapped lines inside a paragraph are joined with a single space.
 * - Blank lines separate paragraphs.
 * - Runs of whitespace are collapsed.
 */
export function toParagraphs(input: string): string[] {
  return normalizeTypography(input)
    .split(/\n\s*\n/)
    .map((p) =>
      p
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean)
        .join(" ")
        .replace(/ {2,}/g, " ")
        .trim(),
    )
    .filter((p) => p.length > 0)
    // Drop decorative separators such as "* * * * *" or "-----".
    .filter((p) => /[\p{L}\p{N}]/u.test(p));
}

/** Strip accents/diacritics (used by the optional "ignore accents" matching). */
export function stripDiacritics(ch: string): string {
  return ch.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}
