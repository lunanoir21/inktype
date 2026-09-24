/**
 * Split a long text into typing "pages" of roughly `target` characters, always
 * breaking at natural sentence boundaries.
 *
 * The algorithm is deterministic: the same input and options always produce
 * the same pages, which is what lets us store progress as a page index.
 *
 * Paragraph breaks inside a page are kept as "\n" (typed with Enter or Space).
 */

import { toParagraphs } from "./normalize";

export interface PaginateOptions {
  /** Ideal page length in characters. */
  target?: number;
  /** A page will not be closed before reaching this length (unless the text ends). */
  min?: number;
  /** Hard ceiling; longer sentences are split at clause or word boundaries. */
  max?: number;
}

export const DEFAULT_PAGE_TARGET = 350;

/**
 * Split a paragraph into sentences. A sentence ends with . ! or ? (optionally
 * followed by closing quotes/brackets) and whitespace. Common abbreviations
 * (Mr., Dr., St. …) and single initials do not end a sentence.
 */
export function splitSentences(paragraph: string): string[] {
  const sentences: string[] = [];
  const re = /[.!?]+["')\]]*\s+/g;
  let start = 0;
  let match: RegExpExecArray | null;
  while ((match = re.exec(paragraph)) !== null) {
    const end = match.index + match[0].length;
    const candidate = paragraph.slice(start, match.index + 1);
    const lastWord = /(\S+)$/.exec(candidate)?.[1] ?? "";
    if (isAbbreviation(lastWord)) continue;
    sentences.push(paragraph.slice(start, end).trim());
    start = end;
  }
  const rest = paragraph.slice(start).trim();
  if (rest) sentences.push(rest);
  return sentences;
}

const ABBREVIATIONS = new Set([
  "mr.", "mrs.", "ms.", "dr.", "st.", "jr.", "sr.", "prof.", "rev.", "gen.", "col.",
  "capt.", "lt.", "sgt.", "vs.", "etc.", "e.g.", "i.e.", "no.", "vol.", "ch.", "mt.",
]);

function isAbbreviation(word: string): boolean {
  const w = word.toLowerCase().replace(/^["'([]+/, "");
  if (ABBREVIATIONS.has(w)) return true;
  // Single-letter initials such as "J." in "J. R. R. Tolkien".
  return /^\p{Lu}\.$/u.test(word.replace(/^["'([]+/, ""));
}

/** Break a single over-long sentence into chunks no longer than `max`. */
function splitLong(sentence: string, max: number): string[] {
  const chunks: string[] = [];
  let rest = sentence;
  while (rest.length > max) {
    const window = rest.slice(0, max);
    // Prefer clause punctuation, then any space.
    let cut = Math.max(
      window.lastIndexOf("; "),
      window.lastIndexOf(": "),
      window.lastIndexOf(", "),
      window.lastIndexOf("-- "),
    );
    if (cut < max * 0.4) cut = window.lastIndexOf(" ");
    if (cut <= 0) cut = max - 1; // no whitespace at all: hard cut
    chunks.push(rest.slice(0, cut + 1).trim());
    rest = rest.slice(cut + 1).trim();
  }
  if (rest) chunks.push(rest);
  return chunks;
}

interface Unit {
  text: string;
  /** True when this unit starts a new paragraph. */
  paragraphStart: boolean;
}

export function paginate(text: string, options: PaginateOptions = {}): string[] {
  const target = options.target ?? DEFAULT_PAGE_TARGET;
  const min = options.min ?? Math.round(target * 0.6);
  const max = options.max ?? Math.round(target * 1.7);

  // Flatten the text into sentence-sized units, remembering paragraph starts.
  const units: Unit[] = [];
  for (const paragraph of toParagraphs(text)) {
    let first = true;
    for (const sentence of splitSentences(paragraph)) {
      for (const chunk of splitLong(sentence, max)) {
        units.push({ text: chunk, paragraphStart: first });
        first = false;
      }
    }
  }

  const pages: string[] = [];
  let current = "";

  for (const unit of units) {
    const separator = current === "" ? "" : unit.paragraphStart ? "\n" : " ";
    const next = current + separator + unit.text;

    if (current !== "" && next.length > target && current.length >= min) {
      // Closing now gets us closer to the target than appending.
      const overshoot = next.length - target;
      const undershoot = target - current.length;
      if (overshoot > undershoot || next.length > max) {
        pages.push(current);
        current = unit.text;
        continue;
      }
    }
    if (current !== "" && next.length > max) {
      pages.push(current);
      current = unit.text;
      continue;
    }
    current = next;
  }
  if (current) {
    // Merge a tiny trailing page into the previous one when it still fits.
    const last = pages[pages.length - 1];
    if (last !== undefined && current.length < min / 2 && last.length + current.length < max) {
      pages[pages.length - 1] = `${last} ${current}`;
    } else {
      pages.push(current);
    }
  }
  return pages;
}
